import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for managing message reactions
 * Supports quick reactions like Instagram/WhatsApp
 * Real-time updates via Supabase
 */
export const useMessageReactions = (messageId, currentUserId) => {
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Add or remove reaction
    const toggleReaction = useCallback(async (emoji) => {
        if (!messageId || !currentUserId) return;

        setLoading(true);
        try {
            // Check if user already reacted with this emoji
            const { data: existing, error: fetchError } = await supabase
                .from('message_reactions')
                .select('id')
                .eq('message_id', messageId)
                .eq('user_id', currentUserId)
                .eq('emoji', emoji)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (existing) {
                // Remove reaction
                const { error: deleteError } = await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('id', existing.id);

                if (deleteError) throw deleteError;

                // Update local state
                setReactions(prev => prev.filter(r => r.id !== existing.id));
            } else {
                // Add reaction
                const { data: newReaction, error: insertError } = await supabase
                    .from('message_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: currentUserId,
                        emoji
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Update local state
                setReactions(prev => [...prev, newReaction]);
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            focusToast.error('Failed to add reaction');
        } finally {
            setLoading(false);
        }
    }, [messageId, currentUserId]);

    // Get all reactions for a message
    const fetchReactions = useCallback(async () => {
        if (!messageId) return;

        try {
            const { data, error } = await supabase
                .from('message_reactions')
                .select(`
                    id,
                    emoji,
                    user_id,
                    created_at,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('message_id', messageId);

            if (error) throw error;
            setReactions(data || []);
        } catch (error) {
            console.error('Error fetching reactions:', error);
        }
    }, [messageId]);

    // Group reactions by emoji with counts
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                hasReacted: false
            };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.profiles);
        if (reaction.user_id === currentUserId) {
            acc[reaction.emoji].hasReacted = true;
        }
        return acc;
    }, {});

    return {
        reactions,
        groupedReactions: Object.values(groupedReactions),
        toggleReaction,
        fetchReactions,
        loading
    };
};

/**
 * Hook for group message reactions
 */
export const useGroupMessageReactions = (groupMessageId, currentUserId) => {
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleReaction = useCallback(async (emoji) => {
        if (!groupMessageId || !currentUserId) return;

        setLoading(true);
        try {
            const { data: existing, error: fetchError } = await supabase
                .from('message_reactions')
                .select('id')
                .eq('group_message_id', groupMessageId)
                .eq('user_id', currentUserId)
                .eq('emoji', emoji)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (existing) {
                const { error: deleteError } = await supabase
                    .from('message_reactions')
                    .delete()
                    .eq('id', existing.id);

                if (deleteError) throw deleteError;
                setReactions(prev => prev.filter(r => r.id !== existing.id));
            } else {
                const { data: newReaction, error: insertError } = await supabase
                    .from('message_reactions')
                    .insert({
                        group_message_id: groupMessageId,
                        user_id: currentUserId,
                        emoji
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;
                setReactions(prev => [...prev, newReaction]);
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            focusToast.error('Failed to add reaction');
        } finally {
            setLoading(false);
        }
    }, [groupMessageId, currentUserId]);

    const fetchReactions = useCallback(async () => {
        if (!groupMessageId) return;

        try {
            const { data, error } = await supabase
                .from('message_reactions')
                .select(`
                    id,
                    emoji,
                    user_id,
                    created_at,
                    profiles:user_id (
                        username,
                        avatar_url
                    )
                `)
                .eq('group_message_id', groupMessageId);

            if (error) throw error;
            setReactions(data || []);
        } catch (error) {
            console.error('Error fetching reactions:', error);
        }
    }, [groupMessageId]);

    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                hasReacted: false
            };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.profiles);
        if (reaction.user_id === currentUserId) {
            acc[reaction.emoji].hasReacted = true;
        }
        return acc;
    }, {});

    return {
        reactions,
        groupedReactions: Object.values(groupedReactions),
        toggleReaction,
        fetchReactions,
        loading
    };
};
