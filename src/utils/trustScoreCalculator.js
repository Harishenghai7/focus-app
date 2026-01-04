/**
 * Trust Score Calculator for Focus Trust Shield
 * 
 * Calculates a user's trust score (0-100) based on multiple factors:
 * - Base Score
 * - Email Verification
 * - OAuth Linking
 * - Biometric Verification
 * - Profile Completeness
 * - Account Age
 * - Positive Interactions
 * - Reports/Flags
 */

export const TRUST_SCORE_WEIGHTS = {
    BASE: 20,
    EMAIL_VERIFIED: 20,
    OAUTH_LINKED: 15, // Per provider, capped? Or just for having at least one? Prompt says "OAuth Linked (15)", implies binary or capped. Let's assume binary for "has linked oauth" or maybe additive. Prompt says "Google (+15), Microsoft (+15)..." in section 6. But section 2 says "OAuth Linked (15)". Let's stick to section 2 for the summary calculation, but maybe allow bonus for multiple.
    BIOMETRIC: 10,
    PROFILE_COMPLETE: 10,
    ACCOUNT_AGE: 10, // > 30 days?
    POSITIVE_INTERACTIONS: 10, // > 100 interactions?
    NO_REPORTS: 5
};

export const TRUST_TIERS = {
    RESTRICTED: { min: 0, max: 30, label: 'Restricted', color: '#ef4444' }, // Red
    LIMITED: { min: 31, max: 60, label: 'Limited', color: '#eab308' }, // Yellow
    TRUSTED: { min: 61, max: 80, label: 'Trusted', color: '#22c55e' }, // Green
    HIGHLY_TRUSTED: { min: 81, max: 100, label: 'Highly Trusted', color: '#3b82f6' } // Blue/Gold
};

/**
 * Calculates the trust score for a user.
 * @param {Object} user - The user object containing profile and security data.
 * @param {Object} metrics - Additional metrics like interaction counts, account age.
 * @returns {Object} - { score, tier, breakdown }
 */
export const calculateTrustScore = (user, metrics = {}) => {
    let score = TRUST_SCORE_WEIGHTS.BASE;
    const breakdown = {
        base: TRUST_SCORE_WEIGHTS.BASE,
        email: 0,
        oauth: 0,
        biometric: 0,
        profile: 0,
        age: 0,
        interactions: 0,
        reports: 0
    };

    // Email Verification
    if (user.email_confirmed_at || user.emailVerified) {
        score += TRUST_SCORE_WEIGHTS.EMAIL_VERIFIED;
        breakdown.email = TRUST_SCORE_WEIGHTS.EMAIL_VERIFIED;
    }

    // OAuth Linking (Check if any provider is linked)
    // Assuming user.identities or similar structure from Supabase
    const identities = user.identities || [];
    const hasOAuth = identities.some(id => id.provider !== 'email');
    if (hasOAuth) {
        score += TRUST_SCORE_WEIGHTS.OAUTH_LINKED;
        breakdown.oauth = TRUST_SCORE_WEIGHTS.OAUTH_LINKED;
    }

    // Biometric Verification
    if (user.user_metadata?.biometric_enabled) {
        score += TRUST_SCORE_WEIGHTS.BIOMETRIC;
        breakdown.biometric = TRUST_SCORE_WEIGHTS.BIOMETRIC;
    }

    // Profile Completeness
    const hasAvatar = !!user.user_metadata?.avatar_url;
    const hasBio = !!user.user_metadata?.bio;
    const hasName = !!user.user_metadata?.full_name;
    if (hasAvatar && hasBio && hasName) {
        score += TRUST_SCORE_WEIGHTS.PROFILE_COMPLETE;
        breakdown.profile = TRUST_SCORE_WEIGHTS.PROFILE_COMPLETE;
    }

    // Account Age
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const daysOld = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (daysOld > 30) {
        score += TRUST_SCORE_WEIGHTS.ACCOUNT_AGE;
        breakdown.age = TRUST_SCORE_WEIGHTS.ACCOUNT_AGE;
    }

    // Positive Interactions
    if ((metrics.interactions || 0) > 50) { // Threshold for "positive interactions"
        score += TRUST_SCORE_WEIGHTS.POSITIVE_INTERACTIONS;
        breakdown.interactions = TRUST_SCORE_WEIGHTS.POSITIVE_INTERACTIONS;
    }

    // No Reports
    if ((metrics.reports_count || 0) === 0) {
        score += TRUST_SCORE_WEIGHTS.NO_REPORTS;
        breakdown.reports = TRUST_SCORE_WEIGHTS.NO_REPORTS;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Determine Tier
    let tier = TRUST_TIERS.RESTRICTED;
    if (score >= TRUST_TIERS.HIGHLY_TRUSTED.min) tier = TRUST_TIERS.HIGHLY_TRUSTED;
    else if (score >= TRUST_TIERS.TRUSTED.min) tier = TRUST_TIERS.TRUSTED;
    else if (score >= TRUST_TIERS.LIMITED.min) tier = TRUST_TIERS.LIMITED;

    return { score, tier, breakdown };
};

export const getTrustTier = (score) => {
    if (score >= TRUST_TIERS.HIGHLY_TRUSTED.min) return TRUST_TIERS.HIGHLY_TRUSTED;
    if (score >= TRUST_TIERS.TRUSTED.min) return TRUST_TIERS.TRUSTED;
    if (score >= TRUST_TIERS.LIMITED.min) return TRUST_TIERS.LIMITED;
    return TRUST_TIERS.RESTRICTED;
};
