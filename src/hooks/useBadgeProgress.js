import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBadgeCriteria } from './useBadgeCriteria';
import { useUserBadges } from './useUserBadges';
import { formatBadgeProgress } from '../utils/badgeFormatter';
import { BADGE_DEFINITIONS } from '../utils/badgeRules';

/**
 * useBadgeProgress Hook
 * Tracks progress toward locked badges
 */
export const useBadgeProgress = () => {
    const { user } = useAuth();
    const { criteria, lockedBadges, loading: criteriaLoading } = useBadgeCriteria();
    const { badges, loading: badgesLoading } = useUserBadges();

    const [progress, setProgress] = useState([]);
    const loading = criteriaLoading || badgesLoading;

    useEffect(() => {
        if (!user || loading) return;

        // Get badges user doesn't have
        const earnedBadgeNames = badges.map(b => b.badge?.name);
        const progressData = lockedBadges
            .filter(locked => !earnedBadgeNames.includes(locked.badgeType))
            .map(locked => {
                const definition = BADGE_DEFINITIONS[locked.badgeType];
                const progressPercent = formatBadgeProgress(locked);

                return {
                    badgeType: locked.badgeType,
                    name: definition?.name,
                    description: definition?.description,
                    icon: definition?.icon,
                    color: definition?.color,
                    gradient: definition?.gradient,
                    progress: locked.progress,
                    progressPercent,
                    checks: locked.checks,
                    message: locked.message,
                    requiresApplication: locked.requiresApplication
                };
            })
            .sort((a, b) => b.progressPercent - a.progressPercent); // Sort by progress

        setProgress(progressData);
    }, [user, lockedBadges, badges, loading]);

    // Get next badge to earn (highest progress)
    const nextBadge = progress[0] || null;

    // Get badges close to earning (>50% progress)
    const closeToEarning = progress.filter(p => p.progressPercent >= 50);

    return {
        progress,
        nextBadge,
        closeToEarning,
        loading
    };
};
