import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing message delivery and read status
 * Implements WhatsApp/Instagram-style message ticks:
 * - Single gray tick: Sent
 * - Double gray ticks: Delivered
 * - Double blue ticks: Read
 */
export const useMessageStatus = (conversationId, currentUserId) => {
    const [messageStatuses, setMessageStatuses] = useState({});

    // Mark message as delivered
    const markAsDelivered = useCallback(async (messageId) => {
        if (!messageId || !currentUserId) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_delivered: true,
                    delivered_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .neq('sender_id', currentUserId); // Don't mark own messages

            if (error) throw error;

            // Update local state
            setMessageStatuses(prev => ({
                ...prev,
                [messageId]: { ...prev[messageId], is_delivered: true }
            }));
        } catch (error) {
            console.error('Error marking message as delivered:', error);
        }
    }, [currentUserId]);

    // Mark message as read
    const markAsRead = useCallback(async (messageId) => {
        if (!messageId || !currentUserId) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_read: true,
                    is_delivered: true, // Auto-mark as delivered when read
                    read_at: new Date().toISOString(),
                    delivered_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .neq('sender_id', currentUserId); // Don't mark own messages

            if (error) throw error;

            // Update local state
            setMessageStatuses(prev => ({
                ...prev,
                [messageId]: { is_delivered: true, is_read: true }
            }));
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }, [currentUserId]);

    // Mark all messages in conversation as read
    const markAllAsRead = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_read: true,
                    is_delivered: true,
                    read_at: new Date().toISOString(),
                    delivered_at: new Date().toISOString()
                })
                .eq('conversation_id', conversationId)
                .eq('is_read', false)
                .neq('sender_id', currentUserId);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all messages as read:', error);
        }
    }, [conversationId, currentUserId]);

    // Subscribe to real-time status updates
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`message-status:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const { id, is_delivered, is_read } = payload.new;
                    setMessageStatuses(prev => ({
                        ...prev,
                        [id]: { is_delivered, is_read }
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    return {
        messageStatuses,
        markAsDelivered,
        markAsRead,
        markAllAsRead
    };
};

/**
 * Hook for group message read receipts
 * Tracks which users have read each message in a group
 */
export const useGroupMessageStatus = (groupId, currentUserId) => {
    const [readReceipts, setReadReceipts] = useState({});

    // Mark group message as read
    const markGroupMessageAsRead = useCallback(async (messageId) => {
        if (!messageId || !currentUserId) return;

        try {
            // Insert read receipt
            const { error } = await supabase
                .from('message_read_receipts')
                .upsert({
                    group_message_id: messageId,
                    user_id: currentUserId,
                    read_at: new Date().toISOString()
                }, {
                    onConflict: 'group_message_id,user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error marking group message as read:', error);
        }
    }, [currentUserId]);

    // Get read receipts for a message
    const getReadReceipts = useCallback(async (messageId) => {
        if (!messageId) return [];

        try {
            const { data, error } = await supabase
                .from('message_read_receipts')
                .select(`
                    user_id,
                    read_at,
                    profiles:user_id (
                        id,
                        username,
                        avatar_url
                    )
                `)
                .eq('group_message_id', messageId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching read receipts:', error);
            return [];
        }
    }, []);

    // Subscribe to real-time read receipt updates
    useEffect(() => {
        if (!groupId) return;

        const channel = supabase
            .channel(`group-receipts:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'message_read_receipts',
                    filter: `group_message_id=in.(SELECT id FROM group_messages WHERE group_id='${groupId}')`
                },
                (payload) => {
                    const { group_message_id, user_id } = payload.new;
                    setReadReceipts(prev => ({
                        ...prev,
                        [group_message_id]: [
                            ...(prev[group_message_id] || []),
                            user_id
                        ]
                    }));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    return {
        readReceipts,
        markGroupMessageAsRead,
        getReadReceipts
    };
};
