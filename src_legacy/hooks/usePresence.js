import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * usePresence Hook
 * 
 * Purpose: Track user online status using Supabase realtime
 * 
 * Features:
 * - Subscribe to user presence channel
 * - Send heartbeat every 30 seconds
 * - Update last seen timestamp
 * - Handle offline detection
 * - Auto cleanup on unmount
 * 
 * @param {string} currentUserId - The ID of the current user
 * @returns {Object} Presence state and helper functions
 */
const usePresence = (currentUserId) => {
  const [presenceState, setPresenceState] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const channelRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastSeenMapRef = useRef(new Map());

  /**
   * Check if a user is currently online
   * @param {string} userId - The user ID to check
   * @returns {boolean} True if user is online
   */
  const isOnline = useCallback((userId) => {
    if (!userId) return false;
    
    const userPresence = presenceState[userId];
    if (!userPresence) return false;

    // Check if user has recent presence (within last 45 seconds)
    const lastUpdate = userPresence.last_seen || userPresence.timestamp;
    if (!lastUpdate) return false;

    const timeDiff = Date.now() - new Date(lastUpdate).getTime();
    return timeDiff < 45000; // 45 seconds threshold
  }, [presenceState]);

  /**
   * Get the last seen timestamp for a user
   * @param {string} userId - The user ID to check
   * @returns {Date|null} Last seen date or null
   */
  const getLastSeen = useCallback((userId) => {
    if (!userId) return null;

    // Check in-memory map first
    if (lastSeenMapRef.current.has(userId)) {
      return lastSeenMapRef.current.get(userId);
    }

    // Check presence state
    const userPresence = presenceState[userId];
    if (userPresence) {
      const lastSeen = userPresence.last_seen || userPresence.timestamp;
      if (lastSeen) {
        const date = new Date(lastSeen);
        lastSeenMapRef.current.set(userId, date);
        return date;
      }
    }

    return null;
  }, [presenceState]);

  /**
   * Send heartbeat to update presence
   */
  const sendHeartbeat = useCallback(async () => {
    if (!currentUserId || !channelRef.current) return;

    try {
      const timestamp = new Date().toISOString();
      
      // Track presence in Supabase realtime
      await channelRef.current.track({
        user_id: currentUserId,
        online: true,
        last_seen: timestamp,
        timestamp: timestamp
      });

      // Update local state
      setPresenceState(prev => ({
        ...prev,
        [currentUserId]: {
          user_id: currentUserId,
          online: true,
          last_seen: timestamp,
          timestamp: timestamp
        }
      }));

      // Update last seen in database
      await supabase
        .from('profiles')
        .update({ 
          last_seen: timestamp,
          is_online: true 
        })
        .eq('id', currentUserId);

    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }, [currentUserId]);

  /**
   * Send offline status
   */
  const sendOfflineStatus = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const timestamp = new Date().toISOString();

      // Update in channel if available
      if (channelRef.current) {
        await channelRef.current.track({
          user_id: currentUserId,
          online: false,
          last_seen: timestamp,
          timestamp: timestamp
        });
      }

      // Update in database
      await supabase
        .from('profiles')
        .update({ 
          last_seen: timestamp,
          is_online: false 
        })
        .eq('id', currentUserId);

      // Update local state
      setPresenceState(prev => ({
        ...prev,
        [currentUserId]: {
          user_id: currentUserId,
          online: false,
          last_seen: timestamp,
          timestamp: timestamp
        }
      }));

    } catch (error) {
      console.error('Error sending offline status:', error);
    }
  }, [currentUserId]);

  /**
   * Initialize presence tracking
   */
  useEffect(() => {
    if (!currentUserId) {
      setIsInitialized(false);
      return;
    }

    let mounted = true;

    const initializePresence = async () => {
      try {
        // Create or get presence channel
        const channelName = 'presence:global';
        const channel = supabase.channel(channelName, {
          config: {
            presence: {
              key: currentUserId
            }
          }
        });

        // Handle presence sync
        channel.on('presence', { event: 'sync' }, () => {
          if (!mounted) return;

          const state = channel.presenceState();
          const newPresenceState = {};

          // Convert presence state to our format
          Object.keys(state).forEach(key => {
            const presences = state[key];
            if (presences && presences.length > 0) {
              const presence = presences[0];
              newPresenceState[presence.user_id] = presence;
              
              // Update last seen map
              if (presence.last_seen) {
                lastSeenMapRef.current.set(
                  presence.user_id, 
                  new Date(presence.last_seen)
                );
              }
            }
          });

          setPresenceState(newPresenceState);
        });

        // Handle presence join
        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          if (!mounted) return;

          newPresences.forEach(presence => {
            setPresenceState(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));

            if (presence.last_seen) {
              lastSeenMapRef.current.set(
                presence.user_id,
                new Date(presence.last_seen)
              );
            }
          });
        });

        // Handle presence leave
        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          if (!mounted) return;

          leftPresences.forEach(presence => {
            const timestamp = new Date().toISOString();
            setPresenceState(prev => ({
              ...prev,
              [presence.user_id]: {
                ...presence,
                online: false,
                last_seen: timestamp
              }
            }));

            lastSeenMapRef.current.set(
              presence.user_id,
              new Date(timestamp)
            );
          });
        });

        // Subscribe to channel
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            if (!mounted) return;

            channelRef.current = channel;
            
            // Send initial heartbeat
            await sendHeartbeat();
            
            setIsInitialized(true);

            // Start heartbeat interval (every 30 seconds)
            heartbeatIntervalRef.current = setInterval(() => {
              sendHeartbeat();
            }, 30000);
          }
        });

        // Set online status in database
        await supabase
          .from('profiles')
          .update({ is_online: true })
          .eq('id', currentUserId);

      } catch (error) {
        console.error('Error initializing presence:', error);
        setIsInitialized(false);
      }
    };

    initializePresence();

    // Cleanup function
    return () => {
      mounted = false;

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Send offline status before unsubscribing
      if (currentUserId) {
        sendOfflineStatus();
      }

      // Unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsInitialized(false);
    };
  }, [currentUserId, sendHeartbeat, sendOfflineStatus]);

  /**
   * Handle page visibility changes
   */
  useEffect(() => {
    if (!currentUserId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but don't send offline immediately
        // The heartbeat will stop, and server will detect offline
      } else {
        // Page is visible again, send heartbeat
        sendHeartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUserId, sendHeartbeat]);

  /**
   * Handle before unload (user closing tab/browser)
   */
  useEffect(() => {
    if (!currentUserId) return;

    const handleBeforeUnload = () => {
      sendOfflineStatus();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUserId, sendOfflineStatus]);

  /**
   * Get all online users
   */
  const getOnlineUsers = useCallback(() => {
    return Object.keys(presenceState).filter(userId => isOnline(userId));
  }, [presenceState, isOnline]);

  /**
   * Get online count
   */
  const getOnlineCount = useCallback(() => {
    return getOnlineUsers().length;
  }, [getOnlineUsers]);

  /**
   * Get formatted last seen text
   */
  const getLastSeenText = useCallback((userId) => {
    if (isOnline(userId)) {
      return 'Online';
    }

    const lastSeen = getLastSeen(userId);
    if (!lastSeen) {
      return 'Offline';
    }

    const now = Date.now();
    const diff = now - lastSeen.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return lastSeen.toLocaleDateString();
  }, [isOnline, getLastSeen]);

  return {
    // State
    isInitialized,
    presenceState,
    
    // Core functions
    isOnline,
    getLastSeen,
    getLastSeenText,
    
    // Utility functions
    getOnlineUsers,
    getOnlineCount,
    
    // Manual controls
    sendHeartbeat,
    sendOfflineStatus
  };
};

export default usePresence;
