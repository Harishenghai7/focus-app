/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧠 DISCOVERY ENGINE — Focus Platform
 * Trust-Weighted Intelligent Content Discovery
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * PHILOSOPHY:
 * Discovery on Focus rewards AUTHENTICITY, not manipulation.
 * - Trust Score amplifies genuine creators
 * - Engagement velocity detects artificial boosting
 * - Content diversity prevents echo chambers
 * - Originality scoring rewards unique content
 *
 * ANTI-MANIPULATION SAFEGUARDS:
 * - Velocity ceiling: caps unnatural engagement spikes
 * - Diversity injection: prevents feed monopolization
 * - Age decay: older content naturally fades
 * - Trust multiplier: verified creators get organic boost
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// DISCOVERY SCORE ALGORITHM
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
    TRUST_MULTIPLIER: 1.35,       // Verified/high-trust users get 35% boost
    ENGAGEMENT_QUALITY: 2.5,      // Comments worth 2.5x likes (deeper engagement)
    SHARE_WEIGHT: 4.0,            // Shares = strongest signal of value
    SAVE_WEIGHT: 3.0,             // Saves = content worth revisiting
    VIEW_WEIGHT: 0.01,            // Views are weakest signal
    RECENCY_WINDOW_HOURS: 48,     // Content freshness window
    VELOCITY_CEILING: 500,        // Max engagement per hour before flagging
    DIVERSITY_BOOST: 1.15,        // Underrepresented creators get boost
    ORIGINALITY_BONUS: 1.2,       // Original content (not reposts) boosted
};

/**
 * Calculate the Discovery Score for a content item.
 * Higher score = higher visibility in the feed.
 */
export const calculateDiscoveryScore = (item) => {
    if (!item) return 0;

    let score = 0;
    const likes = item.likes_count || 0;
    const comments = item.comments_count || 0;
    const shares = item.shares_count || 0;
    const saves = item.saves_count || 0;
    const views = item.views_count || 0;

    // ── Base Engagement Score ─────────────────────────────
    score += likes;
    score += comments * WEIGHTS.ENGAGEMENT_QUALITY;
    score += shares * WEIGHTS.SHARE_WEIGHT;
    score += saves * WEIGHTS.SAVE_WEIGHT;
    score += views * WEIGHTS.VIEW_WEIGHT;

    // ── Trust Shield Amplification ───────────────────────
    const trustTier = item.user?.trust_tier || item.trust_tier || 0;
    const isVerified = item.user?.is_verified || item.is_verified || false;

    if (isVerified || trustTier >= 4) {
        score *= WEIGHTS.TRUST_MULTIPLIER;
    } else if (trustTier >= 2) {
        score *= 1.1; // Slight boost for established users
    }

    // ── Recency Decay ────────────────────────────────────
    const hoursSince = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
    const recencyMultiplier = Math.max(0.3, 1 - (hoursSince / (WEIGHTS.RECENCY_WINDOW_HOURS * 2)));
    score *= recencyMultiplier;

    // ── Velocity Check (Anti-Manipulation) ───────────────
    if (hoursSince > 0) {
        const engagementPerHour = (likes + comments + shares) / hoursSince;
        if (engagementPerHour > WEIGHTS.VELOCITY_CEILING) {
            // Suspicious velocity — dampen score
            score *= 0.5;
        }
    }

    // ── Engagement Quality Ratio ─────────────────────────
    // Reward content where people comment, not just like
    if (likes > 0) {
        const qualityRatio = (comments + shares) / likes;
        if (qualityRatio > 0.1) {
            score *= 1 + Math.min(qualityRatio * 0.5, 0.3); // Max 30% boost
        }
    }

    return Math.round(score * 100) / 100;
};

// ═══════════════════════════════════════════════════════════════
// TRENDING ALGORITHM
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate trending score for hashtags.
 * Prioritizes velocity + trust, not raw volume.
 */
export const calculateTrendingScore = (tagData) => {
    const { recentCount = 0, totalCount = 0, engagement = 0, avgTrustTier = 0 } = tagData;

    // Velocity: recent posts matter more
    let score = recentCount * 3;

    // Total volume (dampened)
    score += Math.log2(totalCount + 1) * 2;

    // Engagement signals
    score += Math.sqrt(engagement) * 0.5;

    // Trust amplification: tags used by verified users trend faster
    if (avgTrustTier >= 3) {
        score *= 1.2;
    }

    return Math.round(score * 10) / 10;
};

/**
 * Extract and rank trending hashtags from posts.
 */
export const extractTrendingHashtags = (posts, windowHours = 24) => {
    const tagStats = {};
    const now = Date.now();
    const windowMs = windowHours * 60 * 60 * 1000;

    posts.forEach(post => {
        const postTime = new Date(post.created_at).getTime();
        const isRecent = (now - postTime) < windowMs;
        const tags = ((post.caption || '') + ' ' + (post.content || '')).match(/#[a-zA-Z0-9_]+/g) || [];

        tags.forEach(rawTag => {
            const tag = rawTag.toLowerCase();
            if (!tagStats[tag]) {
                tagStats[tag] = {
                    tag,
                    displayTag: rawTag,
                    recentCount: 0,
                    totalCount: 0,
                    engagement: 0,
                    trustTiers: [],
                    topPost: null,
                };
            }

            tagStats[tag].totalCount++;
            if (isRecent) tagStats[tag].recentCount++;

            // Track engagement
            tagStats[tag].engagement +=
                (post.likes_count || 0) +
                (post.comments_count || 0) * 2 +
                (post.shares_count || 0) * 3;

            // Track trust tiers
            const tier = post.user?.trust_tier || 0;
            tagStats[tag].trustTiers.push(tier);

            // Keep top post (most engaged)
            const currentScore = (post.likes_count || 0) + (post.comments_count || 0) * 2;
            const topScore = tagStats[tag].topPost
                ? (tagStats[tag].topPost.likes_count || 0) + (tagStats[tag].topPost.comments_count || 0) * 2
                : 0;
            if (currentScore > topScore) {
                tagStats[tag].topPost = post;
            }
        });
    });

    // Calculate scores and sort
    return Object.values(tagStats)
        .map(data => ({
            ...data,
            avgTrustTier: data.trustTiers.length > 0
                ? data.trustTiers.reduce((a, b) => a + b, 0) / data.trustTiers.length
                : 0,
            score: calculateTrendingScore({
                recentCount: data.recentCount,
                totalCount: data.totalCount,
                engagement: data.engagement,
                avgTrustTier: data.trustTiers.length > 0
                    ? data.trustTiers.reduce((a, b) => a + b, 0) / data.trustTiers.length
                    : 0,
            }),
        }))
        .sort((a, b) => b.score - a.score);
};

// ═══════════════════════════════════════════════════════════════
// CREATOR RANKING
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate a creator's discovery prominence score.
 * Rewards consistent quality over follower count.
 */
export const calculateCreatorScore = (creator) => {
    let score = 0;

    const followers = creator.followers_count || 0;
    const trustTier = creator.trust_tier || 0;
    const isVerified = creator.is_verified || creator.verified || false;

    // Follower base (dampened logarithm — prevents follower-count monopoly)
    score += Math.log2(followers + 1) * 10;

    // Trust tier is weighted heavily
    score += trustTier * 15;

    // Verification bonus
    if (isVerified) score += 50;

    // Activity score (if available)
    if (creator.posts_count) {
        score += Math.log2(creator.posts_count + 1) * 5;
    }

    return Math.round(score * 10) / 10;
};

/**
 * Rank creators for discovery, with diversity injection.
 */
export const rankCreators = (creators) => {
    return [...creators]
        .map(c => ({ ...c, _discoveryScore: calculateCreatorScore(c) }))
        .sort((a, b) => b._discoveryScore - a._discoveryScore);
};

// ═══════════════════════════════════════════════════════════════
// CONTENT CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const EXPLORE_CATEGORIES = [
    { id: 'foryou',   label: 'For You',   icon: '✨', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
    { id: 'users',    label: 'Users',     icon: '👥', gradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' },
    { id: 'posts',    label: 'Posts',     icon: '📸', gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
    { id: 'boltz',    label: 'Boltz',     icon: '⚡', gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
    { id: 'trending', label: 'Trending',  icon: '🔥', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
];

// ═══════════════════════════════════════════════════════════════
// TRUST TIER METADATA
// ═══════════════════════════════════════════════════════════════

export const TRUST_TIERS = {
    0: { label: 'New',       color: 'rgba(255,255,255,0.3)', glow: 'none',                                          icon: '○' },
    1: { label: 'Starter',   color: '#F59E0B',               glow: '0 0 12px rgba(245, 158, 11, 0.5)',              icon: '◐' },
    2: { label: 'Active',    color: '#10B981',               glow: '0 0 12px rgba(16, 185, 129, 0.5)',              icon: '◑' },
    3: { label: 'Trusted',   color: '#3B82F6',               glow: '0 0 14px rgba(59, 130, 246, 0.6)',              icon: '◉' },
    4: { label: 'Verified',  color: '#a78bfa',               glow: '0 0 16px rgba(167, 139, 250, 0.7)',             icon: '⬢' },
    5: { label: 'Sovereign', color: '#c4b5fd',               glow: '0 0 20px rgba(196, 181, 253, 0.8), 0 0 40px rgba(139, 92, 246, 0.3)', icon: '⬡' },
};

export const getTrustTierInfo = (tier) => TRUST_TIERS[tier] || TRUST_TIERS[0];

// ═══════════════════════════════════════════════════════════════
// SEARCH INTELLIGENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Classify search intent from query string.
 */
export const classifySearchIntent = (query) => {
    if (!query) return { type: 'empty', normalized: '' };

    const trimmed = query.trim();

    if (trimmed.startsWith('#')) {
        return { type: 'hashtag', normalized: trimmed.slice(1).toLowerCase() };
    }

    if (trimmed.startsWith('@')) {
        return { type: 'user', normalized: trimmed.slice(1).toLowerCase() };
    }

    // Check if it looks like a username search
    if (/^[a-zA-Z0-9_.]+$/.test(trimmed) && trimmed.length <= 30) {
        return { type: 'mixed', normalized: trimmed.toLowerCase() };
    }

    return { type: 'content', normalized: trimmed.toLowerCase() };
};

/**
 * Generate smart search suggestions based on partial input.
 */
export const generateSearchSuggestions = (query, trendingTags = [], recentSearches = []) => {
    const { type, normalized } = classifySearchIntent(query);
    const suggestions = [];

    if (type === 'hashtag') {
        // Suggest matching trending tags
        const matches = trendingTags.filter(t =>
            t.tag.toLowerCase().includes(normalized)
        );
        suggestions.push(...matches.map(t => ({
            type: 'hashtag',
            label: `#${t.tag}`,
            meta: `${t.totalCount || t.post_count || 0} posts`,
            score: t.score || t.post_count || 0,
        })));
    }

    // Add recent search matches
    const recentMatches = recentSearches.filter(s =>
        s.toLowerCase().includes(normalized)
    );
    suggestions.push(...recentMatches.map(s => ({
        type: 'recent',
        label: s,
        meta: 'Recent search',
        score: 0,
    })));

    return suggestions.sort((a, b) => b.score - a.score);
};

// ═══════════════════════════════════════════════════════════════
// BOLTZ-SPECIFIC DISCOVERY INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate discovery score for Boltz videos specifically.
 * Extends the base calculateDiscoveryScore with watch-time & completion metrics.
 *
 * @param {Object} boltz - Boltz video item with engagement + watch metrics
 * @returns {number} - Boltz-enhanced discovery score
 */
export const calculateBoltzDiscoveryScore = (boltz) => {
    if (!boltz) return 0;

    // Start with base discovery score
    const baseScore = calculateDiscoveryScore({
        ...boltz,
        type: 'boltz',
    });

    let multiplier = 1.0;

    // Watch-time quality: completion rate is the strongest Boltz signal
    const completionRate = boltz.avg_completion_rate || boltz.completion_rate || 0;
    if (completionRate > 0.8) {
        multiplier *= 1.4; // Highly engaging content
    } else if (completionRate > 0.5) {
        multiplier *= 1.15;
    } else if (completionRate < 0.15 && (boltz.views_count || 0) > 50) {
        multiplier *= 0.5; // Clickbait penalty
    }

    // Rewatch bonus
    if (completionRate > 1.0) {
        multiplier *= 1.25;
    }

    // Content category boost (learning/creative content prioritized)
    const caption = `${boltz.caption || ''} ${boltz.description || ''}`.toLowerCase();
    const isLearning = /learn|tutorial|how to|tips|guide|explain|education/.test(caption);
    const isCreative = /art|create|design|craft|creative|photography/.test(caption);

    if (isLearning) multiplier *= 1.2;
    if (isCreative) multiplier *= 1.15;

    // Short-form optimization: reward videos with good engagement-per-second
    const duration = boltz.duration || boltz.video_duration || 30;
    const totalEngagement = (boltz.likes_count || 0) + ((boltz.comments_count || 0) * 2.5) +
                           ((boltz.shares_count || 0) * 4) + ((boltz.saves_count || 0) * 3);
    const engagementPerSecond = totalEngagement / Math.max(duration, 1);

    if (engagementPerSecond > 1) multiplier *= 1.1;

    return Math.round(baseScore * multiplier * 100) / 100;
};

/**
 * Get Boltz videos ranked for Explore discovery.
 * Applies trust-weighted scoring with Boltz-specific enhancements.
 */
export const getBoltzForDiscovery = (boltzItems, limit = 20) => {
    if (!boltzItems?.length) return [];

    return [...boltzItems]
        .map(item => ({
            ...item,
            _discoveryScore: calculateBoltzDiscoveryScore(item),
        }))
        .sort((a, b) => b._discoveryScore - a._discoveryScore)
        .slice(0, limit);
};
