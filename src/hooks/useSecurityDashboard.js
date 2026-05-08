// ═══════════════════════════════════════════════════════════════════════
// 🔐 useSecurityDashboard — Security Health UI Hook
// Exposes encryption metrics for the Sovereign Whisper ecosystem
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import securityService, { SECURITY_EVENTS } from '../services/securityService';

/**
 * Hook for consuming encryption and security metrics in UI components
 * 
 * @param {string} userId - Current user ID
 * @returns {Object} Security dashboard data
 */
export function useSecurityDashboard(userId) {
  const [stats, setStats] = useState({
    totalEncryptedMessages: 0,
    activeSessionCount: 0,
    lastKeyRotation: 0,
    protocolVersion: '1.0',
    keyAge: 0,
    securityScore: 0
  });

  const [securityLevel, setSecurityLevel] = useState('unknown');
  const [recentEvents, setRecentEvents] = useState([]);

  // Refresh stats
  const refreshStats = useCallback(() => {
    if (!userId) return;

    const newStats = securityService.getEncryptionStats(userId);
    setStats(newStats);

    // Determine security level from score
    if (newStats.securityScore >= 90) setSecurityLevel('sovereign');
    else if (newStats.securityScore >= 70) setSecurityLevel('strong');
    else if (newStats.securityScore >= 40) setSecurityLevel('moderate');
    else setSecurityLevel('weak');
  }, [userId]);

  // Subscribe to security events
  useEffect(() => {
    if (!userId) return;

    // Initial load
    refreshStats();

    // Listen for key rotations
    const unsub1 = securityService.on(SECURITY_EVENTS.KEY_ROTATED, (event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 20));
      refreshStats();
    });

    const unsub2 = securityService.on(SECURITY_EVENTS.SESSION_CREATED, (event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 20));
      refreshStats();
    });

    const unsub3 = securityService.on(SECURITY_EVENTS.ENCRYPTION_VERIFIED, (event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 20));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [userId, refreshStats]);

  // Audit a specific conversation
  const auditConversation = useCallback((conversationId) => {
    if (!userId) return null;
    return securityService.auditConversationSecurity(conversationId, userId);
  }, [userId]);

  // Get key transparency log
  const getKeyLog = useCallback(() => {
    if (!userId) return [];
    return securityService.getKeyTransparencyLog(userId);
  }, [userId]);

  // Format key age for display
  const formattedKeyAge = (() => {
    if (!stats.keyAge) return 'Never generated';
    const days = Math.floor(stats.keyAge / (24 * 60 * 60 * 1000));
    const hours = Math.floor((stats.keyAge % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  })();

  // Format last rotation for display
  const formattedLastRotation = (() => {
    if (!stats.lastKeyRotation) return 'Never';
    const ago = Date.now() - stats.lastKeyRotation;
    const hours = Math.floor(ago / (60 * 60 * 1000));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  })();

  return {
    // Raw stats
    ...stats,

    // Computed
    securityLevel,
    formattedKeyAge,
    formattedLastRotation,
    recentEvents,

    // Actions
    refreshStats,
    auditConversation,
    getKeyLog
  };
}

export default useSecurityDashboard;
