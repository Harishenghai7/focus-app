import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing typing indicators in conversations
 * Shows real-time "User is typing..." status
 * Auto-clears after 3 seconds of inactivity
 */
export const useTypingIndicator = (conversationId, groupId, currentUserId) => {
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const channelRef = useRef(null);

    // Set typing status
    const setTyping = useCallback(async (isTyping = true) => {
        if (!currentUserId || (!conversationId && !groupId)) return;

        try {
            if (isTyping) {
                // Upsert typing indicator
                const payload = {
                    user_id: currentUserId,
                    is_typing: true,
                    updated_at: new Date().toISOString()
                };

                if (conversationId) {
                    payload.conversation_id = conversationId;
                } else if (groupId) {
                    payload.group_id = groupId;
                }

                // Use Supabase Realtime Presence instead of database
                if (channelRef.current) {
                    await channelRef.current.track({
                        user_id: currentUserId,
                        typing: true,
                        timestamp: Date.now()
                    });
                }

                // Clear any existing timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Auto-clear after 3 seconds
                typingTimeoutRef.current = setTimeout(() => {
                    setTyping(false);
                }, 3000);
            } else {
                // Remove typing indicator
                if (channelRef.current) {
                    await channelRef.current.untrack();
                }

                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
            }
        } catch (error) {
            console.error('Error setting typing status:', error);
        }
    }, [conversationId, groupId, currentUserId]);

    // Debounced typing handler
    const handleTyping = useCallback(() => {
        setTyping(true);
    }, [setTyping]);

    // Stop typing
    const stopTyping = useCallback(() => {
        setTyping(false);
    }, [setTyping]);

    // Subscribe to typing indicators
    useEffect(() => {
        if (!conversationId && !groupId) return;

        const channelName = conversationId
            ? `typing:conversation:${conversationId}`
            : `typing:group:${groupId}`;

        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: currentUserId
                }
            }
        });

        channelRef.current = channel;

        // Subscribe to presence changes
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const typing = [];

                Object.keys(state).forEach(key => {
                    const presences = state[key];
                    presences.forEach(presence => {
                        if (presence.user_id !== currentUserId && presence.typing) {
                            // Check if timestamp is recent (within 5 seconds)
                            const age = Date.now() - presence.timestamp;
                            if (age < 5000) {
                                typing.push(presence.user_id);
                            }
                        }
                    });
                });

                setTypingUsers(typing);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {

                }
            });

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            channel.untrack();
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [conversationId, groupId, currentUserId]);

    return {
        typingUsers,
        isTyping: typingUsers.length > 0,
        handleTyping,
        stopTyping,
        setTyping
    };
};

/**
 * Get typing user details
 */
export const useTypingUserDetails = (typingUserIds) => {
    const [typingUserDetails, setTypingUserDetails] = useState([]);

    useEffect(() => {
        if (!typingUserIds || typingUserIds.length === 0) {
            setTypingUserDetails([]);
            return;
        }

        const fetchUserDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, avatar_url')
                    .in('id', typingUserIds);

                if (error) throw error;
                setTypingUserDetails(data || []);
            } catch (error) {
                console.error('Error fetching typing user details:', error);
            }
        };

        fetchUserDetails();
    }, [typingUserIds]);

    return typingUserDetails;
};
