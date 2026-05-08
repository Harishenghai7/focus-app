import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRobustQuery } from './useRobustQuery';

/**
 * useActivityInsights — Fetches 7-day activity data for the insights panel
 * @param {string} userId - Profile user ID
 * @param {boolean} enabled - Whether to fetch (only for own profile)
 */
export const useActivityInsights = (userId, enabled = false) => {
    const fetchInsights = useCallback(async () => {
        if (!userId) throw new Error('No userId');

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const isoStart = sevenDaysAgo.toISOString();

        // Fetch posts in last 7 days
        const { data: recentPosts, error: postsError } = await supabase
            .from('posts')
            .select('id, created_at, likes_count, comments_count, views_count')
            .eq('user_id', userId)
            .gte('created_at', isoStart)
            .order('created_at', { ascending: true });

        if (postsError) {
            console.warn('ActivityInsights: posts fetch error', postsError);
        }

        const posts = recentPosts || [];

        // Calculate daily activity
        const weeklyActivity = Array(7).fill(0);
        posts.forEach(post => {
            const postDate = new Date(post.created_at);
            const dayIdx = Math.floor((postDate - sevenDaysAgo) / (24 * 60 * 60 * 1000));
            if (dayIdx >= 0 && dayIdx < 7) {
                weeklyActivity[dayIdx]++;
            }
        });

        // Aggregate metrics
        const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
        const totalReach = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);
        const totalInteractions = totalLikes + totalComments;
        const engagementRate = totalReach > 0 ? (totalInteractions / totalReach) * 100 : 0;

        // Find top post
        let topPost = null;
        if (posts.length > 0) {
            topPost = posts.reduce((best, p) => {
                const score = (p.likes_count || 0) + (p.comments_count || 0) * 2;
                const bestScore = (best.likes_count || 0) + (best.comments_count || 0) * 2;
                return score > bestScore ? p : best;
            }, posts[0]);
        }

        return {
            weeklyActivity,
            totalPosts: posts.length,
            totalLikes,
            totalComments,
            engagementRate,
            topPost,
            totalReach,
        };
    }, [userId]);

    const { data, loading, error } = useRobustQuery(fetchInsights, {
        enabled: !!userId && enabled,
        retries: 2,
    });

    return {
        insights: data || null,
        loading,
        error,
    };
};
