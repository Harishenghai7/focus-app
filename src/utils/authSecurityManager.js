/**
 * Authentication Security Manager
 * Handles rate limiting, session management, and security features
 * Features: 10, 11, 12, 13, 18, 362, 363
 */

import { supabase } from '../supabaseClient';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from './rateLimiter';

const MAX_CONCURRENT_SESSIONS = 5; // Feature #12: Concurrent device sessions
const SUSPICIOUS_LOGIN_THRESHOLD = 10; // Feature #502: Suspicious pattern lockout

class AuthSecurityManager {
  constructor() {
    this.sessionCheckInterval = null;
    this.suspiciousActivityLog = new Map();
  }

  /**
   * Feature #13: Rate limit for login attempts
   */
  async checkLoginRateLimit(identifier) {
    const limitCheck = checkRateLimit(identifier);
    
    if (limitCheck.isLocked) {
      throw new Error(`Too many failed attempts. Try again in ${limitCheck.remainingMinutes} minutes.`);
    }
    
    return limitCheck;
  }

  /**
   * Feature #18: Blocked/banned user can't log in
   */
  async checkUserStatus(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_banned, ban_reason, ban_expires_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile?.is_banned) {
        const banExpired = profile.ban_expires_at && new Date(profile.ban_expires_at) < new Date();
        
        if (!banExpired) {
          throw new Error(`Account suspended: ${profile.ban_reason || 'Violation of terms'}`);
        } else {
          // Unban expired user
          await supabase
            .from('profiles')
            .update({ is_banned: false, ban_reason: null, ban_expires_at: null })
            .eq('id', userId);
        }
      }

      return profile;
    } catch (error) {
      console.error('Error checking user status:', error);
      throw error;
    }
  }

  /**
   * Feature #12: Concurrent device sessions management
   */
  async manageConcurrentSessions(userId, newSessionToken) {
    try {
      // Get all active sessions
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      // If too many sessions, remove oldest ones
      if (sessions && sessions.length >= MAX_CONCURRENT_SESSIONS) {
        const sessionsToRemove = sessions.slice(MAX_CONCURRENT_SESSIONS - 1);
        
        for (const session of sessionsToRemove) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', session.id);
        }

        // Feature #395: Session takeover alert
        if (sessionsToRemove.length > 0) {
          await this.notifySessionTakeover(userId, sessionsToRemove.length);
        }
      }

      // Record new session
      const sessionId = newSessionToken.substring(0, 16);
      await supabase
        .from('user_sessions')
        .upsert({
          id: sessionId,
          user_id: userId,
          device_type: this.getDeviceType(),
          browser: this.getBrowser(),
          ip_address: await this.getClientIP(),
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      return sessionId;
    } catch (error) {
      console.error('Error managing concurrent sessions:', error);
      throw error;
    }
  }

  /**
   * Feature #502: Suspicious pattern lockout
   */
  async checkSuspiciousActivity(identifier, activityType = 'login') {
    const key = `${identifier}_${activityType}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!this.suspiciousActivityLog.has(key)) {
      this.suspiciousActivityLog.set(key, []);
    }

    const activities = this.suspiciousActivityLog.get(key);
    
    // Remove old activities outside the window
    const recentActivities = activities.filter(time => now - time < windowMs);
    
    // Check if threshold exceeded
    if (recentActivities.length >= SUSPICIOUS_LOGIN_THRESHOLD) {
      // Feature #349: Suspicious activity alert
      await this.alertSuspiciousActivity(identifier, activityType, recentActivities.length);
      throw new Error('Suspicious activity detected. Account temporarily locked for security.');
    }

    // Record this activity
    recentActivities.push(now);
    this.suspiciousActivityLog.set(key, recentActivities);

    return recentActivities.length;
  }

  /**
   * Feature #10: Session expiration monitoring
   */
  startSessionMonitoring(onExpiring, onExpired) {
    this.sessionCheckInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          onExpired?.();
          return;
        }

        const expiresAt = session.expires_at * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Feature #10: Session expiration warning (5 minutes before)
        if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
          onExpiring?.(Math.floor(timeUntilExpiry / 1000));
        } else if (timeUntilExpiry <= 0) {
          onExpired?.();
        }
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Feature #11: Session refresh
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error('Session refresh failed: ' + error.message);
      }

      if (data?.session) {
        // Update session activity
        const sessionId = data.session.access_token.substring(0, 16);
        await supabase
          .from('user_sessions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', sessionId);
      }

      return data;
    } catch (error) {
      console.error('Session refresh error:', error);
      throw error;
    }
  }

  /**
   * Feature #362: Multi-device session invalidation
   */
  async invalidateAllSessions(userId, exceptCurrentSession = null) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
        .neq('id', exceptCurrentSession || '');

      if (error) throw error;

      // Sign out from Supabase auth
      await supabase.auth.signOut();

      return true;
    } catch (error) {
      console.error('Error invalidating sessions:', error);
      return false;
    }
  }

  /**
   * Feature #363: 2FA enforced for new device
   */
  async checkNewDeviceLogin(userId, deviceFingerprint) {
    try {
      const { data: knownDevices, error } = await supabase
        .from('user_devices')
        .select('device_fingerprint')
        .eq('user_id', userId);

      if (error) throw error;

      const isKnownDevice = knownDevices?.some(
        device => device.device_fingerprint === deviceFingerprint
      );

      if (!isKnownDevice) {
        // Check if user has 2FA enabled
        const { data: settings } = await supabase
          .from('user_settings')
          .select('two_factor_enabled')
          .eq('user_id', userId)
          .single();

        if (settings?.two_factor_enabled) {
          return { requiresTwoFactor: true, isNewDevice: true };
        }

        // Record new device
        await supabase
          .from('user_devices')
          .insert({
            user_id: userId,
            device_fingerprint: deviceFingerprint,
            device_name: this.getDeviceName(),
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString()
          });
      }

      return { requiresTwoFactor: false, isNewDevice: !isKnownDevice };
    } catch (error) {
      console.error('Error checking new device:', error);
      return { requiresTwoFactor: false, isNewDevice: false };
    }
  }

  // Helper methods
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  getDeviceName() {
    return `${this.getBrowser()} on ${this.getDeviceType()}`;
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  async notifySessionTakeover(userId, removedSessions) {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'security_alert',
          title: 'New Device Login',
          message: `${removedSessions} older session${removedSessions > 1 ? 's' : ''} were signed out due to new device login.`,
          data: { type: 'session_takeover', removed_sessions: removedSessions }
        });
    } catch (error) {
      console.error('Error sending session takeover notification:', error);
    }
  }

  async alertSuspiciousActivity(identifier, activityType, attemptCount) {
    console.warn(`Suspicious ${activityType} activity detected for ${identifier}: ${attemptCount} attempts`);
    
    // Could integrate with external security services here
    // For now, just log and potentially notify admins
  }

  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

export default new AuthSecurityManager();