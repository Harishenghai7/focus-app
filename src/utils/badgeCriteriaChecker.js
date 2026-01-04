import { BADGE_TYPES, BADGE_DEFINITIONS } from './badgeRules';

/**
 * Badge Criteria Checker
 * Determines if a user meets the criteria for specific badges
 */

/**
 * Check if user meets criteria for Verified badge
 */
export const checkVerifiedCriteria = (user, application) => {
    // Verified is manual only - requires admin approval
    return {
        eligible: false,
        requiresApplication: true,
        progress: null,
        message: 'Apply for verification with identity documents'
    };
};

/**
 * Check if user meets criteria for Trusted User badge
 */
export const checkTrustedUserCriteria = (user, metrics = {}) => {
    const criteria = BADGE_DEFINITIONS[BADGE_TYPES.TRUSTED_USER].criteria;

    const trustScore = metrics.trustScore || 0;
    const accountAgeDays = metrics.accountAgeDays || 0;
    const hasViolations = metrics.violations > 0;
    const daysMaintained = metrics.trustScoreDaysMaintained || 0;

    const checks = {
        trustScore: trustScore >= criteria.trustScoreMin,
        accountAge: accountAgeDays >= criteria.accountAgeDays,
        noViolations: !hasViolations,
        maintained: daysMaintained >= criteria.daysMaintained
    };

    const eligible = Object.values(checks).every(check => check);

    return {
        eligible,
        requiresApplication: false,
        progress: {
            trustScore: `${trustScore}/${criteria.trustScoreMin}`,
            accountAge: `${accountAgeDays}/${criteria.accountAgeDays} days`,
            daysMaintained: `${daysMaintained}/${criteria.daysMaintained} days`,
            violations: hasViolations ? 'Has violations' : 'No violations'
        },
        checks,
        message: eligible ? 'Eligible for Trusted User badge' : 'Keep building trust'
    };
};

/**
 * Check if user meets criteria for Creator badge
 */
export const checkCreatorCriteria = (user, metrics = {}) => {
    const criteria = BADGE_DEFINITIONS[BADGE_TYPES.CREATOR].criteria;

    const followers = metrics.followersCount || 0;
    const posts = metrics.postsCount || 0;
    const engagementRate = metrics.engagementRate || 0;

    const checks = {
        followers: followers >= criteria.followersMin,
        posts: posts >= criteria.postsMin,
        engagement: engagementRate >= criteria.engagementRateMin
    };

    const eligible = Object.values(checks).every(check => check);

    return {
        eligible,
        requiresApplication: true,
        progress: {
            followers: `${followers}/${criteria.followersMin}`,
            posts: `${posts}/${criteria.postsMin}`,
            engagement: `${(engagementRate * 100).toFixed(1)}%/${(criteria.engagementRateMin * 100)}%`
        },
        checks,
        message: eligible ? 'Apply for Creator badge' : 'Keep creating content'
    };
};

/**
 * Check if user meets criteria for Early Adopter badge
 */
export const checkEarlyAdopterCriteria = (user, metrics = {}) => {
    const criteria = BADGE_DEFINITIONS[BADGE_TYPES.EARLY_ADOPTER].criteria;

    const accountCreatedAt = new Date(user.created_at);
    const cutoffDate = new Date(criteria.accountCreatedBefore);
    const emailVerified = !!user.email_confirmed_at;

    const checks = {
        earlyJoin: accountCreatedAt < cutoffDate,
        verified: emailVerified
    };

    const eligible = Object.values(checks).every(check => check);

    return {
        eligible,
        requiresApplication: false,
        progress: {
            joinDate: accountCreatedAt.toLocaleDateString(),
            verified: emailVerified ? 'Email verified' : 'Email not verified'
        },
        checks,
        message: eligible ? 'Eligible for Early Adopter badge' : 'Not an early adopter'
    };
};

/**
 * Check if user meets criteria for Community Guardian badge
 */
export const checkCommunityGuardianCriteria = (user, metrics = {}) => {
    const criteria = BADGE_DEFINITIONS[BADGE_TYPES.COMMUNITY_GUARDIAN].criteria;

    const accurateReports = metrics.accurateReports || 0;
    const moderationScore = metrics.moderationScore || 0;

    const checks = {
        reports: accurateReports >= criteria.accurateReportsMin,
        score: moderationScore >= criteria.moderationScoreMin
    };

    const eligible = Object.values(checks).every(check => check);

    return {
        eligible,
        requiresApplication: true,
        progress: {
            reports: `${accurateReports}/${criteria.accurateReportsMin}`,
            score: `${moderationScore}/${criteria.moderationScoreMin}%`
        },
        checks,
        message: eligible ? 'Apply for Community Guardian badge' : 'Keep reporting violations'
    };
};

/**
 * Check if user meets criteria for OAuth Linked badge
 */
export const checkOAuthLinkedCriteria = (user, metrics = {}) => {
    const criteria = BADGE_DEFINITIONS[BADGE_TYPES.OAUTH_LINKED].criteria;

    const identities = user.identities || [];
    const oauthProviders = identities.filter(id => id.provider !== 'email').length;

    const eligible = oauthProviders >= criteria.oauthProvidersMin;

    return {
        eligible,
        requiresApplication: false,
        progress: {
            providers: `${oauthProviders}/${criteria.oauthProvidersMin} linked`
        },
        checks: { providers: eligible },
        message: eligible ? 'Eligible for OAuth Linked badge' : 'Link more social accounts'
    };
};

/**
 * Check if user meets criteria for Biometric Verified badge
 */
export const checkBiometricVerifiedCriteria = (user, metrics = {}) => {
    const biometricEnabled = user.user_metadata?.biometric_enabled ||
        localStorage.getItem('biometric_lock_enabled') === 'true';

    return {
        eligible: biometricEnabled,
        requiresApplication: false,
        progress: {
            status: biometricEnabled ? 'Enabled' : 'Not enabled'
        },
        checks: { biometric: biometricEnabled },
        message: biometricEnabled ? 'Eligible for Biometric badge' : 'Enable biometric lock'
    };
};

/**
 * Check if user meets criteria for 100 Posts milestone
 */
export const check100PostsCriteria = (user, metrics = {}) => {
    const postsCount = metrics.postsCount || 0;
    const eligible = postsCount >= 100;

    return {
        eligible,
        requiresApplication: false,
        progress: {
            posts: `${postsCount}/100`
        },
        checks: { posts: eligible },
        message: eligible ? 'Eligible for 100 Posts badge' : `${100 - postsCount} posts to go`
    };
};

/**
 * Check if user meets criteria for Helpful badge
 */
export const checkHelpfulCriteria = (user, metrics = {}) => {
    const helpfulVotes = metrics.helpfulVotes || 0;
    const eligible = helpfulVotes >= 50;

    return {
        eligible,
        requiresApplication: false,
        progress: {
            votes: `${helpfulVotes}/50`
        },
        checks: { votes: eligible },
        message: eligible ? 'Eligible for Helpful badge' : `${50 - helpfulVotes} votes to go`
    };
};

/**
 * Check if user meets criteria for Trendsetter badge
 */
export const checkTrendsetterCriteria = (user, metrics = {}) => {
    const trendingPosts = metrics.trendingPostsCount || 0;
    const eligible = trendingPosts >= 5;

    return {
        eligible,
        requiresApplication: false,
        progress: {
            trending: `${trendingPosts}/5`
        },
        checks: { trending: eligible },
        message: eligible ? 'Eligible for Trendsetter badge' : `${5 - trendingPosts} trending posts to go`
    };
};

/**
 * Main criteria checker - routes to specific badge checker
 */
export const checkBadgeCriteria = (badgeType, user, metrics = {}) => {
    switch (badgeType) {
        case BADGE_TYPES.VERIFIED:
            return checkVerifiedCriteria(user, metrics);
        case BADGE_TYPES.TRUSTED_USER:
            return checkTrustedUserCriteria(user, metrics);
        case BADGE_TYPES.CREATOR:
            return checkCreatorCriteria(user, metrics);
        case BADGE_TYPES.EARLY_ADOPTER:
            return checkEarlyAdopterCriteria(user, metrics);
        case BADGE_TYPES.COMMUNITY_GUARDIAN:
            return checkCommunityGuardianCriteria(user, metrics);
        case BADGE_TYPES.OAUTH_LINKED:
            return checkOAuthLinkedCriteria(user, metrics);
        case BADGE_TYPES.BIOMETRIC_VERIFIED:
            return checkBiometricVerifiedCriteria(user, metrics);
        case BADGE_TYPES.MILESTONE_100_POSTS:
            return check100PostsCriteria(user, metrics);
        case BADGE_TYPES.HELPFUL:
            return checkHelpfulCriteria(user, metrics);
        case BADGE_TYPES.TRENDSETTER:
            return checkTrendsetterCriteria(user, metrics);
        default:
            return {
                eligible: false,
                requiresApplication: false,
                progress: null,
                message: 'Unknown badge type'
            };
    }
};

/**
 * Check all badges for a user and return eligibility status
 */
export const checkAllBadges = (user, metrics = {}) => {
    const results = {};

    Object.keys(BADGE_TYPES).forEach(key => {
        const badgeType = BADGE_TYPES[key];
        results[badgeType] = checkBadgeCriteria(badgeType, user, metrics);
    });

    return results;
};

/**
 * Get eligible badges for a user
 */
export const getEligibleBadges = (user, metrics = {}) => {
    const allResults = checkAllBadges(user, metrics);
    return Object.entries(allResults)
        .filter(([_, result]) => result.eligible)
        .map(([badgeType, result]) => ({
            badgeType,
            ...result
        }));
};

/**
 * Get locked badges with progress
 */
export const getLockedBadgesWithProgress = (user, metrics = {}) => {
    const allResults = checkAllBadges(user, metrics);
    return Object.entries(allResults)
        .filter(([_, result]) => !result.eligible)
        .map(([badgeType, result]) => ({
            badgeType,
            definition: BADGE_DEFINITIONS[badgeType],
            ...result
        }));
};
