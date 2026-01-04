import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useTypingStatus = (currentUserId, otherUserId) => {
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => {
        if (!currentUserId || !otherUserId) return;

        // Create presence channel for typing status
        channelRef.current = supabase.channel(`typing_${currentUserId}_${otherUserId}`, {
            config: {
                presence: {
                    key: currentUserId
                }
            }
        });

        // Subscribe to presence changes
        channelRef.current
            .on('presence', { event: 'sync' }, () => {
                const state = channelRef.current.presenceState();
                const otherUserState = state[otherUserId];

                if (otherUserState && otherUserState[0]?.typing) {
                    setIsOtherUserTyping(true);

                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }

                    // Auto-clear typing status after 3 seconds
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsOtherUserTyping(false);
                    }, 3000);
                } else {
                    setIsOtherUserTyping(false);
                }
            })
            .subscribe();

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [currentUserId, otherUserId]);

    const setTyping = async (isTyping) => {
        if (!channelRef.current) return;

        try {
            await channelRef.current.track({
                typing: isTyping,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error updating typing status:', err);
        }
    };

    return { isOtherUserTyping, setTyping };
};
