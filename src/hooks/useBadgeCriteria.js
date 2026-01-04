import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTrustScore } from './useTrustScore';
import { checkAllBadges, getEligibleBadges, getLockedBadgesWithProgress } from '../utils/badgeCriteriaChecker';
import { fetchUserBadges } from '../utils/supabaseBadges';
import { supabase } from '../lib/supabase';

/**
 * useBadgeCriteria Hook
 * Checks badge eligibility and returns available/locked badges with progress
 */
export const useBadgeCriteria = () => {
    const { user } = useAuth();
    const { score: trustScore } = useTrustScore(user);

    const [metrics, setMetrics] = useState({});
    const [criteria, setCriteria] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadMetrics = async () => {
            try {
                setLoading(true);

                // Fetch user metrics from various sources
                const [
                    { data: profile },
                    { count: postsCount },
                    { count: followersCount },
                    { data: userBadges }
                ] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', user.id).single(),
                    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
                    fetchUserBadges(user.id)
                ]);

                // Calculate account age
                const accountCreatedAt = new Date(user.created_at);
                const now = new Date();
                const accountAgeDays = Math.floor((now - accountCreatedAt) / (1000 * 60 * 60 * 24));

                // Calculate engagement rate (simplified)
                const engagementRate = postsCount > 0 ? (followersCount / postsCount) * 0.1 : 0;

                const userMetrics = {
                    trustScore,
                    accountAgeDays,
                    postsCount: postsCount || 0,
                    followersCount: followersCount || 0,
                    engagementRate,
                    violations: 0, // Would come from moderation system
                    trustScoreDaysMaintained: 0, // Would track this separately
                    accurateReports: 0, // Would come from reporting system
                    moderationScore: 0, // Would come from moderation system
                    helpfulVotes: 0, // Would come from voting system
                    trendingPostsCount: 0 // Would come from trending system
                };

                setMetrics(userMetrics);

                // Check all badge criteria
                const allCriteria = checkAllBadges(user, userMetrics);
                setCriteria(allCriteria);

            } catch (err) {
                console.error('Error loading badge criteria:', err);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, [user, trustScore]);

    const eligibleBadges = getEligibleBadges(user || {}, metrics);
    const lockedBadges = getLockedBadgesWithProgress(user || {}, metrics);

    return {
        criteria,
        metrics,
        eligibleBadges,
        lockedBadges,
        loading
    };
};
