// ═══════════════════════════════════════════════════════════════════════
// USE TYPING INDICATOR HOOK - Real-time typing status
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { setTypingStatus } from '../../../utils/supabaseRest';

export const useTypingIndicator = (conversationId, currentUserId) => {
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Subscribe to typing indicators
    useEffect(() => {
        if (!conversationId) return;

        subscriptionRef.current = supabase
            .channel(`typing:${conversationId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'typing_indicators',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                if (payload.new && payload.new.user_id !== currentUserId) {
                    if (payload.new.is_typing) {
                        setTypingUsers(prev => {
                            if (!prev.includes(payload.new.user_id)) {
                                return [...prev, payload.new.user_id];
                            }
                            return prev;
                        });
                    } else {
                        setTypingUsers(prev => prev.filter(id => id !== payload.new.user_id));
                    }
                }
            })
            .subscribe();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [conversationId, currentUserId]);

    // Set typing status (debounced)
    const setIsTyping = useCallback(async (isTyping) => {
        if (!conversationId || !currentUserId) return;

        try {
            await setTypingStatus(conversationId, currentUserId, isTyping);

            // Auto-clear typing after 3 seconds
            if (isTyping) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                    setTypingStatus(conversationId, currentUserId, false);
                }, 3000);
            }
        } catch (err) {
            console.error('Error setting typing status:', err);
        }
    }, [conversationId, currentUserId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Clear typing status on unmount
            if (conversationId && currentUserId) {
                setTypingStatus(conversationId, currentUserId, false).catch(console.error);
            }
        };
    }, [conversationId, currentUserId]);

    return {
        typingUsers,
        setIsTyping
    };
};
