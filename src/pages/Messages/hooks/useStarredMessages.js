/* ═══════════════════════════════════════════════════════════════════════
   STAR MESSAGES HOOK - Bookmark important messages
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useStarredMessages = (userId) => {
    const [starredMessages, setStarredMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchStarredMessages();
        }
    }, [userId]);

    const fetchStarredMessages = async () => {
        try {
            // Get starred message IDs from user settings
            const { data: settings } = await supabase
                .from('user_settings')
                .select('starred_messages')
                .eq('user_id', userId)
                .single();

            if (settings?.starred_messages) {
                // Fetch actual messages
                const { data: messages } = await supabase
                    .from('messages')
                    .select('*, conversations(*)')
                    .in('id', settings.starred_messages)
                    .order('created_at', { ascending: false });

                setStarredMessages(messages || []);
            }
        } catch (error) {
            console.error('Error fetching starred messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStar = async (messageId) => {
        try {
            // Get current starred messages
            const { data: settings } = await supabase
                .from('user_settings')
                .select('starred_messages')
                .eq('user_id', userId)
                .single();

            let starred = settings?.starred_messages || [];

            // Toggle star
            if (starred.includes(messageId)) {
                starred = starred.filter(id => id !== messageId);
            } else {
                starred = [...starred, messageId];
            }

            // Update database
            await supabase
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    starred_messages: starred
                }, {
                    onConflict: 'user_id'
                });

            // Update local state
            await fetchStarredMessages();

            return true;
        } catch (error) {
            console.error('Error toggling star:', error);
            return false;
        }
    };

    const isStarred = (messageId) => {
        return starredMessages.some(msg => msg.id === messageId);
    };

    return {
        starredMessages,
        loading,
        toggleStar,
        isStarred
    };
};
