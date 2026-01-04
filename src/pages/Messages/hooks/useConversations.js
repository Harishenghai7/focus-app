// ═══════════════════════════════════════════════════════════════════════
// USE CONVERSATIONS HOOK - Fetch and manage conversations
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { sortConversations } from '../utils/messageHelpers';

export const useConversations = (currentUserId) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch conversations where user is participant
            const { data, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [currentUserId])
                .order('last_message_at', { ascending: false, nullsFirst: false });

            if (fetchError) throw fetchError;

            setConversations(sortConversations(data || []));
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!currentUserId) return;

        fetchConversations();

        // Subscribe to conversations changes
        const subscription = supabase
            .channel(`conversations:${currentUserId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `participants.cs.{${currentUserId}}`
                },
                (payload) => {
                    console.log('Conversation change:', payload);
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUserId]); // Removed fetchConversations from dependencies to prevent infinite loop


    // Get or create conversation with another user
    const getOrCreateConversation = useCallback(async (otherUserId) => {
        try {
            const { data, error } = await supabase
                .rpc('get_or_create_conversation', {
                    user1_id: currentUserId,
                    user2_id: otherUserId
                });

            if (error) throw error;

            // Refresh conversations
            await fetchConversations();

            return data;
        } catch (err) {
            console.error('Error getting/creating conversation:', err);
            throw err;
        }
    }, [currentUserId, fetchConversations]);

    return {
        conversations,
        loading,
        error,
        refetch: fetchConversations,
        getOrCreateConversation
    };
};
