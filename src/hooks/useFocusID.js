/**
 * useFocusID — Focus App v2.0
 *
 * Multi-signal Trust Score engine.
 * Upholding the tagline: "Meet the real people; not the fake profiles"
 *
 * Trust Score is computed from signals that are HARD TO FAKE
 * collectively — even without a government ID.
 *
 * Tier Levels:
 * 0 — Starter    (OAuth only)
 * 1 — Real       (phone + profile photo) [25+pts]
 * 2 — Confirmed  (14+ days + bio + not flagged) [50+pts]
 * 3 — Trusted    (cross-social OR community vouched) [70+pts]
 * 4 — Verified   (video liveness OR DigiLocker) [90+pts]
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/* ── Scoring weights ── */
const SCORE_WEIGHTS = {
    phone_verified:           25,
    profile_photo:            15,
    bio_written:              10,
    account_age_7d:           10,
    account_age_30d:          10,
    active_posts:             10,
    not_flagged:              10,
    community_vouched:         5,
    cross_social_linked:       5,
};

const TIER_THRESHOLDS = [0, 25, 50, 70, 90];

export const TIER_LABELS  = ['Starter', 'Real', 'Confirmed', 'Trusted', 'Verified'];
export const TIER_ICONS   = ['⬜', '🟡', '🟢', '🔵', '💜'];
export const TIER_COLORS  = [
    'var(--focusid-0-color)',
    'var(--focusid-1-color)',
    'var(--focusid-2-color)',
    'var(--focusid-3-color)',
    'var(--focusid-4-color)',
];
export const TIER_GLOWS   = [
    'none',
    'var(--focusid-1-glow)',
    'var(--focusid-2-glow)',
    'var(--focusid-3-glow)',
    'var(--focusid-4-glow)',
];

/* ── Compute tier from score ── */
export const getTierFromScore = (score) => {
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
        if (score >= TIER_THRESHOLDS[i]) return i;
    }
    return 0;
};

/* ── Compute score from signals ── */
export const computeScore = (signals = {}) => {
    return Object.entries(SCORE_WEIGHTS).reduce((total, [key, weight]) => {
        return total + (signals[key] ? weight : 0);
    }, 0);
};

/* ── Hook ──────────────────────────────────────────────────── */
export const useFocusID = (targetUserId = null) => {
    const { user } = useAuth();
    const userId = targetUserId || user?.id;

    const [signals, setSignals] = useState(null);
    const [score, setScore]     = useState(0);
    const [tier, setTier]       = useState(0);
    const [loading, setLoading] = useState(true);

    const computeSignals = useCallback(async () => {
        if (!userId) return;
        setLoading(true);

        try {
            /* 1. Fetch profile */
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, bio, created_at, posts_count, is_flagged, phone_verified, cross_social_url')
                .eq('id', userId)
                .single();

            if (!profile) { setLoading(false); return; }

            const now = Date.now();
            const createdAt = new Date(profile.created_at).getTime();
            const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);

            /* 2. Fetch community vouches */
            const { count: vouchCount } = await supabase
                .from('community_vouches')
                .select('*', { count: 'exact', head: true })
                .eq('vouched_user_id', userId);

            /* 3. Compute signals */
            const computedSignals = {
                phone_verified:      profile.phone_verified === true,
                profile_photo:       !!profile.avatar_url,
                bio_written:         (profile.bio || '').trim().length > 0,
                account_age_7d:      daysSinceCreation >= 7,
                account_age_30d:     daysSinceCreation >= 30,
                active_posts:        (profile.posts_count || 0) >= 3,
                not_flagged:         !profile.is_flagged,
                community_vouched:   (vouchCount || 0) >= 3,
                cross_social_linked: !!(profile.cross_social_url),
            };

            const computedScore = computeScore(computedSignals);
            const computedTier  = getTierFromScore(computedScore);

            setSignals(computedSignals);
            setScore(computedScore);
            setTier(computedTier);

            /* Persist score to DB (own profile only) */
            if (!targetUserId && userId === user?.id) {
                await supabase
                    .from('profiles')
                    .update({ trust_score: computedScore, trust_tier: computedTier })
                    .eq('id', userId);
            }
        } catch (err) {
            console.warn('useFocusID error:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, targetUserId, user?.id]);

    useEffect(() => { computeSignals(); }, [computeSignals]);

    /* ── Vouch another user (own account → target) ── */
    const vouchUser = useCallback(async (targetId) => {
        if (!user?.id || targetId === user.id) return;
        try {
            await supabase.from('community_vouches').upsert({
                voucher_user_id: user.id,
                vouched_user_id: targetId,
            });
        } catch (_) {}
    }, [user?.id]);

    return {
        signals,
        score,
        tier,
        loading,
        refresh:    computeSignals,
        vouchUser,

        // Derived info
        tierLabel:  TIER_LABELS[tier],
        tierIcon:   TIER_ICONS[tier],
        tierColor:  TIER_COLORS[tier],
        tierGlow:   TIER_GLOWS[tier],
        nextTierScore: TIER_THRESHOLDS[tier + 1] || 100,
        progressPct: tier < 4
            ? Math.round(((score - TIER_THRESHOLDS[tier]) / (TIER_THRESHOLDS[tier + 1] - TIER_THRESHOLDS[tier])) * 100)
            : 100,
    };
};
