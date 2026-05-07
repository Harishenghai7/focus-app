import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { fetchUserBadges, subscribeToUserBadges } from '../utils/supabaseBadges';
import { formatBadge, sortBadges, getPrimaryBadge } from '../utils/badgeFormatter';

/**
 * useUserBadges Hook
 * Fetches and subscribes to user's badges with real-time updates
 */
export const useUserBadges = (userId = null) => {
    const { user } = useAuth();
    const targetUserId = userId || user?.id;

    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!targetUserId) {
            setLoading(false);
            return;
        }

        const loadBadges = async () => {
            try {
                setLoading(true);
                const data = await fetchUserBadges(targetUserId);
                setBadges(data);
                setError(null);
            } catch (err) {
                console.error('Error loading badges:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadBadges();

        // Subscribe to real-time updates
        const subscription = subscribeToUserBadges(targetUserId, (payload) => {

            loadBadges(); // Reload badges on any change
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [targetUserId]);

    // Formatted badges
    const formattedBadges = badges.map(formatBadge);
    const sortedBadges = sortBadges([...badges]);
    const primaryBadge = getPrimaryBadge(badges);
    const activeBadges = badges.filter(b => b.status === 'active');
    const visibleBadges = activeBadges.filter(b => b.visibility === 'public');

    return {
        badges,
        formattedBadges,
        sortedBadges,
        primaryBadge,
        activeBadges,
        visibleBadges,
        badgeCount: activeBadges.length,
        loading,
        error
    };
};
