// ═══════════════════════════════════════════════════════════════════════
// USE PRESENCE HOOK - Real-time user presence tracking
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { updatePresence, fetchPresence } from '../../../utils/supabaseRest';

export const usePresence = (currentUserId) => {
    const [presenceMap, setPresenceMap] = useState(new Map());
    const heartbeatIntervalRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Update own presence
    const setOnline = useCallback(async (isOnline) => {
        if (!currentUserId) return;

        try {
            await updatePresence(currentUserId, isOnline);
        } catch (err) {
            console.error('Error updating presence:', err);
        }
    }, [currentUserId]);

    // Heartbeat to keep presence alive
    useEffect(() => {
        if (!currentUserId) return;

        // Set online on mount
        setOnline(true);

        // Heartbeat every 30 seconds
        heartbeatIntervalRef.current = setInterval(() => {
            setOnline(true);
        }, 30000);

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setOnline(false);
            } else {
                setOnline(true);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Set offline on unmount
        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            setOnline(false);
        };
    }, [currentUserId, setOnline]);

    // Subscribe to presence updates
    useEffect(() => {
        subscriptionRef.current = supabase
            .channel('user_presence')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_presence'
            }, (payload) => {
                if (payload.new) {
                    setPresenceMap(prev => {
                        const newMap = new Map(prev);
                        newMap.set(payload.new.user_id, {
                            isOnline: payload.new.is_online,
                            lastSeenAt: payload.new.last_seen_at
                        });
                        return newMap;
                    });
                }
            })
            .subscribe();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, []);

    // Fetch presence for specific users
    const fetchUserPresence = useCallback(async (userIds) => {
        if (!userIds || userIds.length === 0) return;

        try {
            const data = await fetchPresence(userIds);
            setPresenceMap(prev => {
                const newMap = new Map(prev);
                data.forEach(p => {
                    newMap.set(p.user_id, {
                        isOnline: p.is_online,
                        lastSeenAt: p.last_seen_at
                    });
                });
                return newMap;
            });
        } catch (err) {
            console.error('Error fetching presence:', err);
        }
    }, []);

    // Get presence for a user
    const getUserPresence = useCallback((userId) => {
        return presenceMap.get(userId) || { isOnline: false, lastSeenAt: null };
    }, [presenceMap]);

    return {
        getUserPresence,
        fetchUserPresence,
        setOnline
    };
};
