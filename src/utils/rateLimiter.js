import { TRUST_TIERS, getTrustTier } from './trustScoreCalculator';

/**
 * Rate Limiter
 * 
 * Manages action limits based on user trust tiers.
 * Uses localStorage for client-side tracking (server-side is better for security, 
 * but this serves as the frontend gatekeeper).
 */

const LIMITS = {
    [TRUST_TIERS.RESTRICTED.label]: {
        follows: { limit: 5, window: 3600000 }, // 1 hour
        likes: { limit: 10, window: 3600000 },
        comments: { limit: 3, window: 3600000 },
        posts: { limit: 1, window: 86400000 }, // 24 hours
        dms: { limit: 0, window: 3600000 }
    },
    [TRUST_TIERS.LIMITED.label]: {
        follows: { limit: 20, window: 3600000 },
        likes: { limit: 50, window: 3600000 },
        comments: { limit: 20, window: 3600000 },
        posts: { limit: 5, window: 86400000 },
        dms: { limit: 10, window: 3600000 }
    },
    [TRUST_TIERS.TRUSTED.label]: {
        follows: { limit: 100, window: 3600000 },
        likes: { limit: Infinity, window: 3600000 },
        comments: { limit: Infinity, window: 3600000 },
        posts: { limit: 20, window: 86400000 },
        dms: { limit: Infinity, window: 3600000 }
    },
    [TRUST_TIERS.HIGHLY_TRUSTED.label]: {
        follows: { limit: 200, window: 3600000 },
        likes: { limit: Infinity, window: 3600000 },
        comments: { limit: Infinity, window: 3600000 },
        posts: { limit: 50, window: 86400000 },
        dms: { limit: Infinity, window: 3600000 }
    }
};

export const checkRateLimit = (actionType, trustScore) => {
    const tier = getTrustTier(trustScore);
    const limits = LIMITS[tier.label];

    if (!limits || !limits[actionType]) return { allowed: true }; // Unknown action, allow

    const rule = limits[actionType];
    if (rule.limit === Infinity) return { allowed: true };
    if (rule.limit === 0) return { allowed: false, error: 'Action not allowed for your trust level.' };

    // Check storage
    const key = `rate_limit_${actionType}`;
    const now = Date.now();
    let history = JSON.parse(localStorage.getItem(key) || '[]');

    // Filter out old events
    history = history.filter(timestamp => now - timestamp < rule.window);

    if (history.length >= rule.limit) {
        return {
            allowed: false,
            error: `Rate limit exceeded. Try again later.`,
            nextAvailable: history[0] + rule.window
        };
    }

    return { allowed: true };
};

export const recordAction = (actionType) => {
    const key = `rate_limit_${actionType}`;
    const now = Date.now();
    let history = JSON.parse(localStorage.getItem(key) || '[]');
    history.push(now);
    localStorage.setItem(key, JSON.stringify(history));
};
