// ═══════════════════════════════════════════════════════════════════════
// MESSAGE REACTIONS HOOK - Real-time reactions with Supabase
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '😢'];

export const useMessageReactions = (messageId, currentUserId) => {
    const [reactions, setReactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userReaction, setUserReaction] = useState(null);

    // Fetch reactions for message
    useEffect(() => {
        if (!messageId) return;

        const fetchReactions = async () => {
            try {
                const { data, error } = await supabase
                    .from('message_reactions')
                    .select(`
                        *,
                        user:profiles!user_id(id, username, avatar_url)
                    `)
                    .eq('message_id', messageId);

                if (error) throw error;

                setReactions(data || []);

                // Find current user's reaction
                const myReaction = data?.find(r => r.user_id === currentUserId);
                setUserReaction(myReaction?.reaction || null);
            } catch (err) {
                console.error('Error fetching reactions:', err);
            }
        };

        fetchReactions();

        // Subscribe to reaction changes
        const channel = supabase
            .channel(`reactions:${messageId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'message_reactions',
                    filter: `message_id=eq.${messageId}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        // Fetch full reaction with user data
                        const { data } = await supabase
                            .from('message_reactions')
                            .select(`
                                *,
                                user:profiles!user_id(id, username, avatar_url)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (data) {
                            setReactions(prev => {
                                const existing = prev.findIndex(r => r.id === data.id);
                                if (existing >= 0) {
                                    const updated = [...prev];
                                    updated[existing] = data;
                                    return updated;
                                }
                                return [...prev, data];
                            });

                            if (data.user_id === currentUserId) {
                                setUserReaction(data.reaction);
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setReactions(prev => prev.filter(r => r.id !== payload.old.id));
                        if (payload.old.user_id === currentUserId) {
                            setUserReaction(null);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [messageId, currentUserId]);

    // Add or update reaction
    const addReaction = useCallback(async (emoji) => {
        if (!messageId || !currentUserId || !REACTION_EMOJIS.includes(emoji)) {
            return;
        }

        setLoading(true);
        try {
            // Check if user already has a reaction
            const existingReaction = reactions.find(r => r.user_id === currentUserId);

            if (existingReaction) {
                if (existingReaction.reaction === emoji) {
                    // Remove reaction if clicking same emoji
                    await supabase
                        .from('message_reactions')
                        .delete()
                        .eq('id', existingReaction.id);
                } else {
                    // Update to new emoji
                    await supabase
                        .from('message_reactions')
                        .update({ reaction: emoji })
                        .eq('id', existingReaction.id);
                }
            } else {
                // Add new reaction
                await supabase
                    .from('message_reactions')
                    .insert({
                        message_id: messageId,
                        user_id: currentUserId,
                        reaction: emoji
                    });
            }
        } catch (err) {
            console.error('Error adding reaction:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [messageId, currentUserId, reactions]);

    // Remove reaction
    const removeReaction = useCallback(async () => {
        if (!messageId || !currentUserId) return;

        setLoading(true);
        try {
            await supabase
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId)
                .eq('user_id', currentUserId);
        } catch (err) {
            console.error('Error removing reaction:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [messageId, currentUserId]);

    // Group reactions by emoji with counts
    const groupedReactions = reactions.reduce((acc, reaction) => {
        const emoji = reaction.reaction;
        if (!acc[emoji]) {
            acc[emoji] = {
                emoji,
                count: 0,
                users: []
            };
        }
        acc[emoji].count++;
        acc[emoji].users.push(reaction.user);
        return acc;
    }, {});

    return {
        reactions,
        groupedReactions: Object.values(groupedReactions),
        userReaction,
        loading,
        addReaction,
        removeReaction,
        availableEmojis: REACTION_EMOJIS
    };
};
