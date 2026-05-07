// ═══════════════════════════════════════════════════════════════════════
// USE MESSAGES HOOK - Real-time message management with pagination
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { fetchMessages, updateMessageStatus, markConversationAsRead } from '../../../utils/supabaseRest';

export const useMessages = (conversationId, currentUserId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const subscriptionRef = useRef(null);

    // Load initial messages
    const loadMessages = useCallback(async () => {
        if (!conversationId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await fetchMessages(conversationId);
            setMessages(data.reverse()); // Oldest first for display
            setHasMore(data.length === 50);
            setError(null);
        } catch (err) {
            console.error('Error loading messages:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Load more messages (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loading || messages.length === 0) return;

        try {
            const oldestMessage = messages[0];
            const data = await fetchMessages(conversationId, {
                before: oldestMessage.created_at
            });

            if (data.length > 0) {
                setMessages(prev => [...data.reverse(), ...prev]);
                setHasMore(data.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Error loading more messages:', err);
        }
    }, [conversationId, messages, hasMore, loading]);

    // Real-time subscription
    useEffect(() => {
        if (!conversationId) return;

        loadMessages();

        // Subscribe to new messages
        subscriptionRef.current = supabase
            .channel(`messages:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, async (payload) => {


                // Fetch full message with relations
                const fullMessage = await fetchMessages(conversationId, { limit: 1 });
                if (fullMessage[0]?.id === payload.new.id) {
                    setMessages(prev => [...prev, fullMessage[0]]);

                    // Mark as delivered if not sender
                    if (payload.new.sender_id !== currentUserId) {
                        await updateMessageStatus(payload.new.id, 'delivered');
                    }
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {

                setMessages(prev => prev.map(m =>
                    m.id === payload.new.id ? { ...m, ...payload.new } : m
                ));
            })
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {

                setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            })
            .subscribe();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [conversationId, currentUserId, loadMessages]);

    // Mark messages as read when viewing
    const markAsRead = useCallback(async () => {
        if (!conversationId || !currentUserId || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.sender_id !== currentUserId && lastMessage.status !== 'seen') {
            try {
                await markConversationAsRead(conversationId, currentUserId, lastMessage.id);
            } catch (err) {
                console.error('Error marking as read:', err);
            }
        }
    }, [conversationId, currentUserId, messages]);

    return {
        messages,
        loading,
        hasMore,
        error,
        loadMore,
        markAsRead,
        refetch: loadMessages
    };
};
