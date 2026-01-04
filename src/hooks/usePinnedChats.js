import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for pinning conversations
 * Pin up to 3 favorite chats to the top
 */
export const usePinnedChats = (userId) => {
    const [pinnedChats, setPinnedChats] = useState([]);
    const [loading, setLoading] = useState(false);

    const MAX_PINNED = 3;

    // Load pinned chats
    useEffect(() => {
        if (userId) {
            loadPinnedChats();
        }
    }, [userId]);

    const loadPinnedChats = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('pinned_chats')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setPinnedChats(data.pinned_chats || []);
        } catch (error) {
            console.error('Error loading pinned chats:', error);
        }
    }, [userId]);

    // Pin a chat
    const pinChat = useCallback(async (chatId, chatType = 'conversation') => {
        if (pinnedChats.length >= MAX_PINNED) {
            focusToast.error(`You can only pin up to ${MAX_PINNED} chats`);
            return false;
        }

        setLoading(true);
        try {
            const newPinned = [...pinnedChats, { id: chatId, type: chatType, pinned_at: new Date().toISOString() }];

            const { error } = await supabase
                .from('profiles')
                .update({ pinned_chats: newPinned })
                .eq('id', userId);

            if (error) throw error;

            setPinnedChats(newPinned);
            focusToast.success('Chat pinned');
            return true;
        } catch (error) {
            console.error('Error pinning chat:', error);
            focusToast.error('Failed to pin chat');
            return false;
        } finally {
            setLoading(false);
        }
    }, [pinnedChats, userId]);

    // Unpin a chat
    const unpinChat = useCallback(async (chatId) => {
        setLoading(true);
        try {
            const newPinned = pinnedChats.filter(chat => chat.id !== chatId);

            const { error } = await supabase
                .from('profiles')
                .update({ pinned_chats: newPinned })
                .eq('id', userId);

            if (error) throw error;

            setPinnedChats(newPinned);
            focusToast.success('Chat unpinned');
            return true;
        } catch (error) {
            console.error('Error unpinning chat:', error);
            focusToast.error('Failed to unpin chat');
            return false;
        } finally {
            setLoading(false);
        }
    }, [pinnedChats, userId]);

    // Check if chat is pinned
    const isPinned = useCallback((chatId) => {
        return pinnedChats.some(chat => chat.id === chatId);
    }, [pinnedChats]);

    return {
        pinnedChats,
        loading,
        pinChat,
        unpinChat,
        isPinned,
        canPinMore: pinnedChats.length < MAX_PINNED
    };
};
