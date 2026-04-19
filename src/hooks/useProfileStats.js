/**
 * useProfileStats — Focus App
 *
 * Provides realtime follower, following, and post counts for a user profile.
 * Subscribes to Supabase Realtime for live updates.
 *
 * Usage:
 *   const { followers, following, posts, loading } = useProfileStats(userId);
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useProfileStats = (userId) => {
    const [stats, setStats] = useState({
        followers: 0,
        following: 0,
        posts: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('followers_count, following_count, posts_count')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setStats({
                    followers: data.followers_count ?? 0,
                    following: data.following_count ?? 0,
                    posts: data.posts_count ?? 0,
                });
            }
        } catch (err) {
            console.warn('useProfileStats fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Realtime subscription — listens for profile row updates
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`profile-stats:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`,
                },
                (payload) => {
                    if (payload.new) {
                        setStats({
                            followers: payload.new.followers_count ?? 0,
                            following: payload.new.following_count ?? 0,
                            posts: payload.new.posts_count ?? 0,
                        });
                    }
                }
            )
            // Also listen for follows table changes to catch immediate follow/unfollow
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'follows',
                    filter: `following_id=eq.${userId}`,
                },
                () => {
                    // Refetch to get accurate count
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchStats]);

    return {
        ...stats,
        loading,
        refresh: fetchStats,
    };
};
