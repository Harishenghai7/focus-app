/**
 * Session Management utilities
 * Handles automatic token refresh, session tracking, and multi-device logout
 */

import { supabase } from '../supabaseClient';

const SESSION_STORAGE_KEY = 'focus_sessions';
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes (tokens expire after 60 minutes)

let refreshTimer = null;
let warningTimer = null;
let sessionWarningCallback = null;

/**
 * Gets device information for session tracking
 * @returns {Object} Device info
 */
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/mobile/i.test(ua)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'Tablet';
  }

  // Detect browser
  if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
  }

  // Detect OS
  if (ua.includes('Windows')) {
    os = 'Windows';
  } else if (ua.includes('Mac')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
  } else if (ua.includes('iOS')) {
    os = 'iOS';
  }

  return {
    deviceType,
    browser,
    os,
    userAgent: ua
  };
};

/**
 * Records a new session
 * @param {string} userId - User ID
 * @param {Object} sessionData - Session data from Supabase
 */
export const recordSession = async (userId, sessionData) => {
  try {
    const deviceInfo = getDeviceInfo();
    const sessionId = sessionData.access_token.substring(0, 16); // Use part of token as session ID

    const session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    };

    // Store in localStorage
    const sessions = getStoredSessions();
    sessions[sessionId] = session;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));

    // Store in database
    await supabase
      .from('user_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        last_active_at: new Date().toISOString()
      });

    return session;
  } catch (error) {
  }
};

/**
 * Gets all stored sessions from localStorage
 * @returns {Object} Sessions object
 */
const getStoredSessions = () => {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
};

/**
 * Gets active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of active sessions
 */
export const getActiveSessions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Logs out from all devices
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const logoutAllDevices = async (userId) => {
  try {
    // Delete all sessions from database
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Clear local storage
    localStorage.removeItem(SESSION_STORAGE_KEY);

    // Sign out from Supabase
    await supabase.auth.signOut();

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Logs out from a specific session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} Success status
 */
export const logoutSession = async (sessionId) => {
  try {
    // Delete session from database
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    // Remove from local storage
    const sessions = getStoredSessions();
    delete sessions[sessionId];
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Updates session activity timestamp
 * @param {string} sessionId - Session ID
 */
export const updateSessionActivity = async (sessionId) => {
  try {
    const now = new Date().toISOString();

    // Update in database
    await supabase
      .from('user_sessions')
      .update({ last_active_at: now })
      .eq('id', sessionId);

    // Update in local storage
    const sessions = getStoredSessions();
    if (sessions[sessionId]) {
      sessions[sessionId].lastActiveAt = now;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
  }
};

/**
 * Starts automatic token refresh
 * @param {Function} onWarning - Callback when session is about to expire
 */
export const startTokenRefresh = (onWarning) => {
  sessionWarningCallback = onWarning;

  // Clear existing timers
  if (refreshTimer) clearInterval(refreshTimer);
  if (warningTimer) clearTimeout(warningTimer);

  // Set up automatic refresh
  refreshTimer = setInterval(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        if (sessionWarningCallback) {
          sessionWarningCallback();
        }
      } else if (data?.session) {
        // Update session record
        const sessionId = data.session.access_token.substring(0, 16);
        await updateSessionActivity(sessionId);
      }
    } catch (error) {
    }
  }, TOKEN_REFRESH_INTERVAL);

  // Set up warning timer (5 minutes before expiry)
  warningTimer = setTimeout(() => {
    if (sessionWarningCallback) {
      sessionWarningCallback();
    }
  }, TOKEN_REFRESH_INTERVAL + SESSION_WARNING_TIME);
};

/**
 * Stops automatic token refresh
 */
export const stopTokenRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
  sessionWarningCallback = null;
};

/**
 * Checks if current session is valid
 * @returns {Promise<boolean>} True if session is valid
 */
export const isSessionValid = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    // Check if token is expired
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();

    return now < expiresAt;
  } catch (error) {
    return false;
  }
};

/**
 * Gets time until session expires
 * @returns {Promise<number>} Milliseconds until expiry, or 0 if expired
 */
export const getTimeUntilExpiry = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return 0;

    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    const remaining = expiresAt - now;

    return Math.max(0, remaining);
  } catch (error) {
    return 0;
  }
};

/**
 * Cleans up expired sessions from storage
 */
export const cleanupExpiredSessions = () => {
  try {
    const sessions = getStoredSessions();
    const now = Date.now();
    let hasChanges = false;

    Object.keys(sessions).forEach(sessionId => {
      const session = sessions[sessionId];
      const expiresAt = new Date(session.expiresAt).getTime();

      if (now > expiresAt) {
        delete sessions[sessionId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
  }
};

// Initialize cleanup on module load
cleanupExpiredSessions();

// Set up periodic cleanup (every 5 minutes)
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

export default {
  recordSession,
  getActiveSessions,
  logoutAllDevices,
  logoutSession,
  updateSessionActivity,
  startTokenRefresh,
  stopTokenRefresh,
  isSessionValid,
  getTimeUntilExpiry,
  cleanupExpiredSessions
};
