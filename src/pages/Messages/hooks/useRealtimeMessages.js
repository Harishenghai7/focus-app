// ═══════════════════════════════════════════════════════════════════════
// REAL-TIME MESSAGES HOOK - Production-ready with all features
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

export const useRealtimeMessages = (conversationId, currentUserId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [sending, setSending] = useState(false);

    const subscriptionRef = useRef(null);
    const PAGE_SIZE = 50;

    // Fetch initial messages
    const fetchMessages = useCallback(async (offset = 0) => {
        if (!conversationId) return [];

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!sender_id(id, username, full_name, avatar_url),
                    reply_to:messages!reply_to_message_id(
                        id,
                        content,
                        type,
                        sender:profiles!sender_id(id, username)
                    ),
                    attachments:message_attachments(*)
                `)
                .eq('conversation_id', conversationId)
                .eq('deleted_for_everyone', false)
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (fetchError) throw fetchError;

            // Filter out messages deleted for current user
            const visibleMessages = (data || []).filter(msg => {
                if (msg.sender_id === currentUserId) {
                    return !msg.deleted_for_sender;
                }
                return true;
            });

            return visibleMessages.reverse(); // Oldest first for display
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message);
            return [];
        }
    }, [conversationId, currentUserId]);

    // Load initial messages
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const loadMessages = async () => {
            setLoading(true);
            const initialMessages = await fetchMessages(0);
            setMessages(initialMessages);
            setHasMore(initialMessages.length >= PAGE_SIZE);
            setLoading(false);
        };

        loadMessages();
    }, [conversationId, fetchMessages]);

    // Real-time subscription
    useEffect(() => {
        if (!conversationId) return;

        // Subscribe to new messages
        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {


                    // Fetch full message with relations
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            sender:profiles!sender_id(id, username, full_name, avatar_url),
                            reply_to:messages!reply_to_message_id(
                                id,
                                content,
                                type,
                                sender:profiles!sender_id(id, username)
                            ),
                            attachments:message_attachments(*)
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        setMessages(prev => {
                            // Prevent duplicates
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data];
                        });

                        // Auto-mark as delivered if not sender
                        if (data.sender_id !== currentUserId) {
                            await markAsDelivered(data.id);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {

                    setMessages(prev => prev.map(msg =>
                        msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                    ));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {

                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
            )
            .subscribe();

        subscriptionRef.current = channel;

        return () => {
            channel.unsubscribe();
        };
    }, [conversationId, currentUserId]);

    // Send message
    const sendMessage = useCallback(async (messageData) => {
        if (!conversationId || !currentUserId) {
            throw new Error('Missing conversation or user ID');
        }

        setSending(true);
        try {
            const messagePayload = {
                conversation_id: conversationId,
                sender_id: currentUserId,
                type: messageData.type || 'text',
                content: messageData.content || null,
                reply_to_message_id: messageData.replyToId || null,
                status: 'sent',
                metadata: messageData.metadata || {}
            };

            // Insert message
            const { data: newMessage, error: messageError } = await supabase
                .from('messages')
                .insert(messagePayload)
                .select(`
                    *,
                    sender:profiles!sender_id(id, username, full_name, avatar_url),
                    reply_to:messages!reply_to_message_id(
                        id,
                        content,
                        type,
                        sender:profiles!sender_id(id, username)
                    )
                `)
                .single();

            if (messageError) throw messageError;

            // Handle attachments if present
            if (messageData.attachmentData) {
                const attachmentPayload = {
                    message_id: newMessage.id,
                    type: messageData.type,
                    url: messageData.attachmentData.url,
                    thumbnail_url: messageData.attachmentData.thumbnailUrl,
                    width: messageData.attachmentData.width,
                    height: messageData.attachmentData.height,
                    size: messageData.attachmentData.size,
                    duration: messageData.attachmentData.duration,
                    mime_type: messageData.attachmentData.mimeType
                };

                const { data: attachment, error: attachmentError } = await supabase
                    .from('message_attachments')
                    .insert(attachmentPayload)
                    .select()
                    .single();

                if (attachmentError) {
                    console.error('Attachment error:', attachmentError);
                } else {
                    newMessage.attachments = [attachment];
                }
            }

            return newMessage;
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        } finally {
            setSending(false);
        }
    }, [conversationId, currentUserId]);

    // Mark message as delivered
    const markAsDelivered = useCallback(async (messageId) => {
        try {
            await supabase
                .from('messages')
                .update({
                    status: 'delivered',
                    delivered_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .neq('sender_id', currentUserId);
        } catch (err) {
            console.error('Error marking as delivered:', err);
        }
    }, [currentUserId]);

    // Mark messages as seen
    const markAsSeen = useCallback(async (messageId) => {
        if (!conversationId || !currentUserId) return;

        try {
            // Use the database function
            await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId,
                p_user_id: currentUserId,
                p_message_id: messageId
            });
        } catch (err) {
            console.error('Error marking as seen:', err);
        }
    }, [conversationId, currentUserId]);

    // Delete message
    const deleteMessage = useCallback(async (messageId, deleteForEveryone = false) => {
        try {
            if (deleteForEveryone) {
                // Check if within time limit
                const { data: canUnsend } = await supabase
                    .rpc('can_unsend_message', { p_message_id: messageId });

                if (!canUnsend) {
                    throw new Error('Time limit exceeded for deleting for everyone');
                }

                await supabase
                    .from('messages')
                    .update({
                        deleted_for_everyone: true,
                        deleted_at: new Date().toISOString(),
                        content: null
                    })
                    .eq('id', messageId)
                    .eq('sender_id', currentUserId);
            } else {
                // Delete for me only
                await supabase
                    .from('messages')
                    .update({
                        deleted_for_sender: true,
                        deleted_at: new Date().toISOString()
                    })
                    .eq('id', messageId)
                    .eq('sender_id', currentUserId);
            }
        } catch (err) {
            console.error('Error deleting message:', err);
            throw err;
        }
    }, [currentUserId]);

    // Load more messages (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loading) return;

        const moreMessages = await fetchMessages(messages.length);
        if (moreMessages.length < PAGE_SIZE) {
            setHasMore(false);
        }
        setMessages(prev => [...moreMessages, ...prev]);
    }, [hasMore, loading, messages.length, fetchMessages]);

    return {
        messages,
        loading,
        error,
        sending,
        hasMore,
        sendMessage,
        markAsSeen,
        deleteMessage,
        loadMore
    };
};
