import {
    FaCheckCircle,
    FaShieldAlt,
    FaStar,
    FaBolt,
    FaLink,
    FaFingerprint,
    FaFire,
    FaHeart,
    FaChartLine
} from 'react-icons/fa';

/**
 * Badge Rules and Definitions
 * Central source of truth for all badge types, criteria, and display properties
 */

export const BADGE_TYPES = {
    VERIFIED: 'verified',
    TRUSTED_USER: 'trusted_user',
    CREATOR: 'creator',
    EARLY_ADOPTER: 'early_adopter',
    COMMUNITY_GUARDIAN: 'community_guardian',
    OAUTH_LINKED: 'oauth_linked',
    BIOMETRIC_VERIFIED: 'biometric_verified',
    MILESTONE_100_POSTS: 'milestone_100_posts',
    HELPFUL: 'helpful',
    TRENDSETTER: 'trendsetter'
};

export const BADGE_DEFINITIONS = {
    [BADGE_TYPES.VERIFIED]: {
        name: 'Verified',
        description: 'Verified authentic public figure or brand account',
        icon: FaCheckCircle,
        color: '#1DA1F2',
        gradient: 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)',
        isManual: true,
        requiresApplication: true,
        sortOrder: 1,
        criteria: {
            type: 'manual',
            description: 'Requires identity verification and admin approval'
        }
    },
    [BADGE_TYPES.TRUSTED_USER]: {
        name: 'Trusted User',
        description: 'Highly trusted community member with consistent positive behavior',
        icon: FaShieldAlt,
        color: '#22c55e',
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 2,
        criteria: {
            trustScoreMin: 80,
            daysMaintained: 30,
            accountAgeDays: 90,
            noViolations: true,
            description: 'Trust Score 80+ for 30 days, account age 90+ days, no violations'
        }
    },
    [BADGE_TYPES.CREATOR]: {
        name: 'Creator',
        description: 'Active content creator with engaged audience',
        icon: FaStar,
        color: '#a855f7',
        gradient: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        isManual: false,
        requiresApplication: true,
        sortOrder: 3,
        criteria: {
            followersMin: 1000,
            postsMin: 50,
            engagementRateMin: 0.05,
            description: '1,000+ followers, 50+ posts, 5%+ engagement rate'
        }
    },
    [BADGE_TYPES.EARLY_ADOPTER]: {
        name: 'Early Adopter',
        description: 'Joined Focus during the early days',
        icon: FaBolt,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 4,
        criteria: {
            accountCreatedBefore: '2025-03-01',
            verified: true,
            description: 'Joined before March 2025 with verified email'
        }
    },
    [BADGE_TYPES.COMMUNITY_GUARDIAN]: {
        name: 'Community Guardian',
        description: 'Outstanding community moderator and reporter',
        icon: FaShieldAlt,
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
        isManual: true,
        requiresApplication: true,
        sortOrder: 5,
        criteria: {
            accurateReportsMin: 100,
            moderationScoreMin: 90,
            description: '100+ accurate reports, 90%+ moderation score'
        }
    },
    [BADGE_TYPES.OAUTH_LINKED]: {
        name: 'OAuth Linked',
        description: 'Connected multiple social accounts',
        icon: FaLink,
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 6,
        criteria: {
            oauthProvidersMin: 2,
            description: 'Linked 2+ social accounts (Google, GitHub, Discord, etc.)'
        }
    },
    [BADGE_TYPES.BIOMETRIC_VERIFIED]: {
        name: 'Biometric Verified',
        description: 'Enabled biometric authentication',
        icon: FaFingerprint,
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 7,
        criteria: {
            biometricEnabled: true,
            description: 'Completed biometric verification (FaceID/TouchID)'
        }
    },
    [BADGE_TYPES.MILESTONE_100_POSTS]: {
        name: '100 Posts',
        description: 'Created 100 posts',
        icon: FaFire,
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 8,
        criteria: {
            postsCount: 100,
            description: 'Published 100 posts or boltz'
        }
    },
    [BADGE_TYPES.HELPFUL]: {
        name: 'Helpful',
        description: 'Received many helpful votes',
        icon: FaHeart,
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 9,
        criteria: {
            helpfulVotesMin: 50,
            description: 'Received 50+ helpful votes from community'
        }
    },
    [BADGE_TYPES.TRENDSETTER]: {
        name: 'Trendsetter',
        description: 'Created trending content',
        icon: FaChartLine,
        color: '#06b6d4',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        isManual: false,
        requiresApplication: false,
        sortOrder: 10,
        criteria: {
            trendingPostsCount: 5,
            description: 'Had 5+ posts reach trending page'
        }
    }
};

/**
 * Get badge definition by type
 */
export const getBadgeDefinition = (badgeType) => {
    return BADGE_DEFINITIONS[badgeType] || null;
};

/**
 * Get all badge definitions sorted by sort order
 */
export const getAllBadgeDefinitions = () => {
    return Object.values(BADGE_DEFINITIONS).sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Get manual badges (require application)
 */
export const getManualBadges = () => {
    return Object.values(BADGE_DEFINITIONS)
        .filter(badge => badge.isManual)
        .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Get automatic badges
 */
export const getAutomaticBadges = () => {
    return Object.values(BADGE_DEFINITIONS)
        .filter(badge => !badge.isManual)
        .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Application form fields for manual badges
 */
export const BADGE_APPLICATION_FIELDS = {
    [BADGE_TYPES.VERIFIED]: [
        {
            name: 'full_name',
            label: 'Full Legal Name',
            type: 'text',
            required: true,
            placeholder: 'Your full legal name'
        },
        {
            name: 'verification_type',
            label: 'Account Type',
            type: 'select',
            required: true,
            options: [
                { value: 'individual', label: 'Individual/Public Figure' },
                { value: 'brand', label: 'Brand/Organization' },
                { value: 'media', label: 'Media/News Outlet' }
            ]
        },
        {
            name: 'identity_document',
            label: 'Identity Document',
            type: 'file',
            required: true,
            accept: 'image/*,.pdf',
            description: 'Government-issued ID or business registration'
        },
        {
            name: 'social_links',
            label: 'Official Social Media Links',
            type: 'textarea',
            required: true,
            placeholder: 'List your official social media profiles (one per line)'
        },
        {
            name: 'reason',
            label: 'Reason for Verification',
            type: 'textarea',
            required: true,
            placeholder: 'Why should your account be verified?'
        }
    ],
    [BADGE_TYPES.CREATOR]: [
        {
            name: 'portfolio_url',
            label: 'Portfolio/Website',
            type: 'url',
            required: false,
            placeholder: 'https://your-portfolio.com'
        },
        {
            name: 'best_content',
            label: 'Best Content Examples',
            type: 'textarea',
            required: true,
            placeholder: 'Links to your best posts or boltz on Focus'
        },
        {
            name: 'content_type',
            label: 'Content Type',
            type: 'select',
            required: true,
            options: [
                { value: 'educational', label: 'Educational' },
                { value: 'entertainment', label: 'Entertainment' },
                { value: 'art', label: 'Art/Design' },
                { value: 'tech', label: 'Technology' },
                { value: 'lifestyle', label: 'Lifestyle' },
                { value: 'other', label: 'Other' }
            ]
        },
        {
            name: 'motivation',
            label: 'Why Creator Badge?',
            type: 'textarea',
            required: true,
            placeholder: 'Tell us about your content creation journey'
        }
    ],
    [BADGE_TYPES.COMMUNITY_GUARDIAN]: [
        {
            name: 'moderation_experience',
            label: 'Moderation Experience',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your experience with community moderation'
        },
        {
            name: 'report_examples',
            label: 'Report Examples',
            type: 'textarea',
            required: true,
            placeholder: 'Provide examples of accurate reports you\'ve submitted'
        },
        {
            name: 'commitment',
            label: 'Commitment Statement',
            type: 'textarea',
            required: true,
            placeholder: 'How will you help maintain a safe community?'
        }
    ]
};
