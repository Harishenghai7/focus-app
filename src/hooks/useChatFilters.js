import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for filtering and organizing chats
 * Filter by unread, groups, type, etc.
 */
export const useChatFilters = (userId) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);
    const [groupCount, setGroupCount] = useState(0);

    // Load counts
    useEffect(() => {
        if (userId) {
            loadCounts();
        }
    }, [userId]);

    const loadCounts = useCallback(async () => {
        try {
            // Count unread messages
            const { count: unread } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', userId)
                .is('read_at', null);

            setUnreadCount(unread || 0);

            // Count group chats
            const { count: groups } = await supabase
                .from('group_participants')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            setGroupCount(groups || 0);
        } catch (error) {
            console.error('Error loading counts:', error);
        }
    }, [userId]);

    // Filter conversations
    const filterConversations = useCallback((conversations, filter) => {
        switch (filter) {
            case 'unread':
                return conversations.filter(conv => conv.unread_count > 0);
            case 'groups':
                return conversations.filter(conv => conv.type === 'group');
            case 'personal':
                return conversations.filter(conv => conv.type === 'conversation');
            case 'archived':
                return conversations.filter(conv => conv.is_archived);
            default:
                return conversations;
        }
    }, []);

    return {
        activeFilter,
        setActiveFilter,
        unreadCount,
        groupCount,
        filterConversations,
        loadCounts
    };
};
