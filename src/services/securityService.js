// ═══════════════════════════════════════════════════════════════════════
// 🔐 SECURITY SERVICE — Sovereign Whisper Security Layer
// Centralized encryption health, key transparency, and privacy audit
// ═══════════════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';

/**
 * Security Event Types
 */
export const SECURITY_EVENTS = {
  KEY_GENERATED: 'key_generated',
  KEY_ROTATED: 'key_rotated',
  SESSION_CREATED: 'session_created',
  SESSION_EXPIRED: 'session_expired',
  ENCRYPTION_VERIFIED: 'encryption_verified',
  ENCRYPTION_FAILED: 'encryption_failed',
  NEW_DEVICE_DETECTED: 'new_device_detected',
  SAFETY_NUMBER_CHANGED: 'safety_number_changed'
};

/**
 * SecurityService — Sovereign Whisper Security Layer
 * 
 * Privacy Principles:
 * - Even admins cannot read encrypted messages
 * - User privacy is sacred
 * - Encrypted communication must be trusted
 * - All key operations are client-side only
 */
class SecurityService {
  constructor() {
    this.listeners = new Map();
    this.securityLog = [];
    this.maxLogSize = 500;
  }

  // ═════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═════════════════════════════════════════════════════════════════

  /**
   * Subscribe to security events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit a security event
   */
  emit(event, data = {}) {
    const entry = {
      event,
      timestamp: Date.now(),
      ...data
    };

    // Log the event
    this.securityLog.unshift(entry);
    if (this.securityLog.length > this.maxLogSize) {
      this.securityLog = this.securityLog.slice(0, this.maxLogSize);
    }

    // Notify listeners
    this.listeners.get(event)?.forEach(cb => {
      try { cb(entry); } catch (err) {
        console.error('[SecurityService] Listener error:', err);
      }
    });
  }

  // ═════════════════════════════════════════════════════════════════
  // ENCRYPTION HEALTH AUDIT
  // ═════════════════════════════════════════════════════════════════

  /**
   * Audit encryption health for a conversation
   * Returns a security report with score and recommendations
   */
  auditConversationSecurity(conversationId, userId) {
    const report = {
      conversationId,
      timestamp: Date.now(),
      checks: [],
      score: 0,
      maxScore: 100,
      level: 'unknown' // 'sovereign' | 'strong' | 'moderate' | 'weak'
    };

    // Check 1: Local key pair exists
    const hasPrivateKey = !!localStorage.getItem(`private_key_${userId}`);
    const hasPublicKey = !!localStorage.getItem(`public_key_${userId}`);
    report.checks.push({
      name: 'Identity Key Pair',
      passed: hasPrivateKey && hasPublicKey,
      weight: 25,
      description: hasPrivateKey && hasPublicKey
        ? 'Your encryption identity is established'
        : 'Missing encryption keys — generate to enable E2EE'
    });

    // Check 2: Session exists for conversation
    const sessionKey = `session_${conversationId}_${userId}`;
    const hasSession = !!localStorage.getItem(sessionKey);
    report.checks.push({
      name: 'Active Session',
      passed: hasSession,
      weight: 20,
      description: hasSession
        ? 'Encrypted session is active'
        : 'No active session — encryption may need initialization'
    });

    // Check 3: Key age (should rotate periodically)
    const keyCreatedAt = localStorage.getItem(`key_created_${userId}`);
    const keyAge = keyCreatedAt ? Date.now() - parseInt(keyCreatedAt) : Infinity;
    const keyFresh = keyAge < 7 * 24 * 60 * 60 * 1000; // 7 days
    report.checks.push({
      name: 'Key Freshness',
      passed: keyFresh,
      weight: 20,
      description: keyFresh
        ? 'Encryption keys are current'
        : 'Keys should be rotated for forward secrecy'
    });

    // Check 4: Message count since last rotation
    const msgCount = parseInt(localStorage.getItem(`msg_count_${conversationId}`) || '0');
    const msgCountOk = msgCount < 100;
    report.checks.push({
      name: 'Message Chain Health',
      passed: msgCountOk,
      weight: 15,
      description: msgCountOk
        ? `${msgCount} messages in current chain`
        : 'Session rotation recommended (100+ messages)'
    });

    // Check 5: Protocol version
    const protocolVersion = localStorage.getItem(`protocol_version_${userId}`) || '1.0';
    const isLatestProtocol = protocolVersion === '3.0';
    report.checks.push({
      name: 'Protocol Version',
      passed: isLatestProtocol,
      weight: 20,
      description: isLatestProtocol
        ? 'Using Sovereign Cipher v3.0 (Signal-grade)'
        : `Using protocol v${protocolVersion} — upgrade available`
    });

    // Calculate score
    report.score = report.checks.reduce((sum, check) => 
      sum + (check.passed ? check.weight : 0), 0
    );

    // Determine security level
    if (report.score >= 90) report.level = 'sovereign';
    else if (report.score >= 70) report.level = 'strong';
    else if (report.score >= 40) report.level = 'moderate';
    else report.level = 'weak';

    return report;
  }

  // ═════════════════════════════════════════════════════════════════
  // SAFETY NUMBER VERIFICATION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Generate a safety number for visual verification
   * Like Signal's "safety number" — users can compare to verify identity
   */
  async generateSafetyNumber(myPublicKey, peerPublicKey) {
    try {
      // Combine both public keys
      const combined = myPublicKey + peerPublicKey;
      
      // Hash the combination
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      // Format as groups of 5 digits
      const digits = [];
      for (let i = 0; i < 12; i++) {
        const value = (hashArray[i * 2] << 8 | hashArray[i * 2 + 1]) % 100000;
        digits.push(value.toString().padStart(5, '0'));
      }
      
      // Format: 12345 67890 12345 67890 12345 67890
      //         12345 67890 12345 67890 12345 67890
      return {
        formatted: digits.join(' '),
        groups: digits,
        raw: Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
      };
    } catch (err) {
      console.error('[SecurityService] Safety number generation failed:', err);
      return null;
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // KEY TRANSPARENCY LOG
  // ═════════════════════════════════════════════════════════════════

  /**
   * Record a key change event
   */
  recordKeyChange(userId, keyType, oldKeyHash, newKeyHash) {
    const entry = {
      userId,
      keyType,
      oldKeyHash: oldKeyHash?.substring(0, 16),
      newKeyHash: newKeyHash?.substring(0, 16),
      timestamp: Date.now()
    };

    // Store in local transparency log
    const logKey = `key_transparency_${userId}`;
    const existing = JSON.parse(localStorage.getItem(logKey) || '[]');
    existing.unshift(entry);
    
    // Keep last 50 entries
    const trimmed = existing.slice(0, 50);
    localStorage.setItem(logKey, JSON.stringify(trimmed));

    this.emit(SECURITY_EVENTS.KEY_ROTATED, entry);
    return entry;
  }

  /**
   * Get key transparency log for a user
   */
  getKeyTransparencyLog(userId) {
    const logKey = `key_transparency_${userId}`;
    return JSON.parse(localStorage.getItem(logKey) || '[]');
  }

  // ═════════════════════════════════════════════════════════════════
  // PRIVACY DASHBOARD DATA
  // ═════════════════════════════════════════════════════════════════

  /**
   * Get aggregate encryption statistics
   */
  getEncryptionStats(userId) {
    const stats = {
      totalEncryptedMessages: parseInt(localStorage.getItem(`total_encrypted_${userId}`) || '0'),
      activeSessionCount: 0,
      lastKeyRotation: parseInt(localStorage.getItem(`last_rotation_${userId}`) || '0'),
      protocolVersion: localStorage.getItem(`protocol_version_${userId}`) || '1.0',
      keyAge: 0,
      securityScore: 0
    };

    // Calculate key age
    const keyCreated = parseInt(localStorage.getItem(`key_created_${userId}`) || '0');
    if (keyCreated) {
      stats.keyAge = Date.now() - keyCreated;
    }

    // Count active sessions (scan localStorage)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('session_') && key?.includes(userId)) {
        stats.activeSessionCount++;
      }
    }

    // Calculate security score
    let score = 0;
    if (localStorage.getItem(`private_key_${userId}`)) score += 30;
    if (stats.protocolVersion === '3.0') score += 25;
    if (stats.keyAge > 0 && stats.keyAge < 7 * 24 * 60 * 60 * 1000) score += 25;
    if (stats.activeSessionCount > 0) score += 20;
    stats.securityScore = Math.min(100, score);

    return stats;
  }

  /**
   * Increment encrypted message counter
   */
  incrementEncryptedCount(userId) {
    const key = `total_encrypted_${userId}`;
    const current = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, (current + 1).toString());
  }

  /**
   * Record key rotation timestamp
   */
  recordKeyRotation(userId) {
    localStorage.setItem(`last_rotation_${userId}`, Date.now().toString());
    this.emit(SECURITY_EVENTS.KEY_ROTATED, { userId, timestamp: Date.now() });
  }

  /**
   * Update protocol version marker
   */
  setProtocolVersion(userId, version) {
    localStorage.setItem(`protocol_version_${userId}`, version);
  }

  // ═════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═════════════════════════════════════════════════════════════════

  /**
   * Clear all security data for a user (logout/account deletion)
   */
  clearUserSecurityData(userId) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes(userId) && (
        key.startsWith('private_key_') ||
        key.startsWith('public_key_') ||
        key.startsWith('session_') ||
        key.startsWith('key_created_') ||
        key.startsWith('key_transparency_') ||
        key.startsWith('total_encrypted_') ||
        key.startsWith('last_rotation_') ||
        key.startsWith('protocol_version_') ||
        key.startsWith('msg_count_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}

// Singleton export
const securityService = new SecurityService();
export default securityService;
