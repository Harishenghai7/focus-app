import { BADGE_DEFINITIONS } from './badgeRules';

/**
 * Badge Formatter
 * Utilities for formatting badge display data
 */

/**
 * Format badge for display
 */
export const formatBadge = (badgeData) => {
    const definition = BADGE_DEFINITIONS[badgeData.badge?.name] || {};

    return {
        id: badgeData.id,
        name: definition.name || badgeData.badge?.name,
        description: definition.description || badgeData.badge?.description,
        icon: definition.icon,
        color: definition.color,
        gradient: definition.gradient,
        dateAwarded: badgeData.date_awarded,
        visibility: badgeData.visibility,
        status: badgeData.status
    };
};

/**
 * Sort badges by priority (verified first, then by sort order)
 */
export const sortBadges = (badges) => {
    return badges.sort((a, b) => {
        const defA = BADGE_DEFINITIONS[a.badge?.name] || { sortOrder: 999 };
        const defB = BADGE_DEFINITIONS[b.badge?.name] || { sortOrder: 999 };
        return defA.sortOrder - defB.sortOrder;
    });
};

/**
 * Get primary badge (highest priority visible badge)
 */
export const getPrimaryBadge = (badges) => {
    const visibleBadges = badges.filter(b => b.visibility === 'public' && b.status === 'active');
    const sorted = sortBadges(visibleBadges);
    return sorted[0] || null;
};

/**
 * Format badge tooltip text
 */
export const formatBadgeTooltip = (badgeName) => {
    const definition = BADGE_DEFINITIONS[badgeName];
    if (!definition) return 'Badge';

    return `${definition.name}: ${definition.description}`;
};

/**
 * Format badge progress percentage
 */
export const formatBadgeProgress = (progress) => {
    if (!progress) return 0;

    // Calculate overall progress from checks
    const checks = Object.values(progress.checks || {});
    if (checks.length === 0) return 0;

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
};

/**
 * Format date awarded
 */
export const formatDateAwarded = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Get badge count display text
 */
export const formatBadgeCount = (count) => {
    if (count === 0) return 'No badges';
    if (count === 1) return '1 badge';
    return `${count} badges`;
};

/**
 * Format application status
 */
export const formatApplicationStatus = (status) => {
    const statusMap = {
        pending: { label: 'Pending Review', color: '#f59e0b', icon: 'FaClock' },
        under_review: { label: 'Under Review', color: '#3b82f6', icon: 'FaEye' },
        approved: { label: 'Approved', color: '#22c55e', icon: 'FaCheckCircle' },
        rejected: { label: 'Rejected', color: '#ef4444', icon: 'FaTimesCircle' }
    };

    return statusMap[status] || { label: status, color: '#64748b', icon: 'FaQuestion' };
};

/**
 * Group badges by category
 */
export const groupBadgesByCategory = (badges) => {
    const categories = {
        verification: [],
        achievement: [],
        milestone: [],
        social: []
    };

    badges.forEach(badge => {
        const name = badge.badge?.name;
        if (['verified', 'trusted_user', 'biometric_verified'].includes(name)) {
            categories.verification.push(badge);
        } else if (['creator', 'community_guardian', 'trendsetter'].includes(name)) {
            categories.achievement.push(badge);
        } else if (['milestone_100_posts', 'helpful'].includes(name)) {
            categories.milestone.push(badge);
        } else if (['oauth_linked', 'early_adopter'].includes(name)) {
            categories.social.push(badge);
        }
    });

    return categories;
};
