import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for managing pinned messages
 * Supports up to 3 pinned messages per conversation (WhatsApp-style)
 * Auto-expires after 30 days (optional)
 */
export const usePinnedMessages = (conversationId, groupId = null) => {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const MAX_PINNED = 3; // WhatsApp allows 3 pinned messages

    // Fetch pinned messages
    const fetchPinnedMessages = useCallback(async () => {
        if (!conversationId && !groupId) return;

        try {
            const query = supabase
                .from('pinned_messages')
                .select(`
                    *,
                    messages (*),
                    group_messages (*)
                `)
                .order('pinned_at', { ascending: false });

            if (conversationId) {
                query.eq('conversation_id', conversationId);
            } else if (groupId) {
                query.eq('group_id', groupId);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter out expired pins (30 days old)
            const now = new Date();
            const validPins = (data || []).filter(pin => {
                const pinnedDate = new Date(pin.pinned_at);
                const daysDiff = (now - pinnedDate) / (1000 * 60 * 60 * 24);
                return daysDiff <= 30; // 30-day expiry
            });

            setPinnedMessages(validPins);
        } catch (error) {
            console.error('Error fetching pinned messages:', error);
        }
    }, [conversationId, groupId]);

    // Pin a message
    const pinMessage = useCallback(async (messageId, userId, isGroupMessage = false) => {
        if (!messageId || !userId) return false;

        // Check if already at max pins
        if (pinnedMessages.length >= MAX_PINNED) {
            focusToast.error(`You can only pin up to ${MAX_PINNED} messages`);
            return false;
        }

        setLoading(true);
        try {
            const pinData = {
                pinned_by: userId,
                pinned_at: new Date().toISOString()
            };

            if (isGroupMessage) {
                pinData.group_message_id = messageId;
                pinData.group_id = groupId;
            } else {
                pinData.message_id = messageId;
                pinData.conversation_id = conversationId;
            }

            const { data, error } = await supabase
                .from('pinned_messages')
                .insert(pinData)
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Message pinned');
            await fetchPinnedMessages();
            return true;
        } catch (error) {
            console.error('Error pinning message:', error);
            focusToast.error('Failed to pin message');
            return false;
        } finally {
            setLoading(false);
        }
    }, [conversationId, groupId, pinnedMessages.length, fetchPinnedMessages]);

    // Unpin a message
    const unpinMessage = useCallback(async (pinnedMessageId) => {
        if (!pinnedMessageId) return false;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('pinned_messages')
                .delete()
                .eq('id', pinnedMessageId);

            if (error) throw error;

            focusToast.success('Message unpinned');
            await fetchPinnedMessages();
            return true;
        } catch (error) {
            console.error('Error unpinning message:', error);
            focusToast.error('Failed to unpin message');
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchPinnedMessages]);

    // Check if a message is pinned
    const isPinned = useCallback((messageId) => {
        return pinnedMessages.some(pin =>
            pin.message_id === messageId || pin.group_message_id === messageId
        );
    }, [pinnedMessages]);

    // Get pinned message by ID
    const getPinnedMessage = useCallback((messageId) => {
        return pinnedMessages.find(pin =>
            pin.message_id === messageId || pin.group_message_id === messageId
        );
    }, [pinnedMessages]);

    // Unpin all messages
    const unpinAll = useCallback(async () => {
        setLoading(true);
        try {
            const query = supabase.from('pinned_messages').delete();

            if (conversationId) {
                query.eq('conversation_id', conversationId);
            } else if (groupId) {
                query.eq('group_id', groupId);
            }

            const { error } = await query;

            if (error) throw error;

            focusToast.success('All messages unpinned');
            setPinnedMessages([]);
            return true;
        } catch (error) {
            console.error('Error unpinning all messages:', error);
            focusToast.error('Failed to unpin messages');
            return false;
        } finally {
            setLoading(false);
        }
    }, [conversationId, groupId]);

    // Auto-fetch on mount and when IDs change
    useEffect(() => {
        fetchPinnedMessages();
    }, [fetchPinnedMessages]);

    return {
        pinnedMessages,
        loading,
        pinMessage,
        unpinMessage,
        unpinAll,
        isPinned,
        getPinnedMessage,
        fetchPinnedMessages,
        canPinMore: pinnedMessages.length < MAX_PINNED,
        pinnedCount: pinnedMessages.length,
        maxPinned: MAX_PINNED
    };
};
