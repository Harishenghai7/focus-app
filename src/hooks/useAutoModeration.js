/**
 * useAutoModeration.js
 * ====================
 * 🛡️  PILLAR 2 — Client-side wrapper for the `content-moderator` Edge Function.
 *
 * Usage:
 *   const { moderate, lastVerdict, moderating } = useAutoModeration();
 *   const verdict = await moderate({ text, imageUrls });
 *   if (verdict.moderationStatus === 'restricted') {
 *     // Inform the user their content is shadow-banned; still INSERT the row.
 *   }
 *   // Always write the returned `moderationStatus` into the DB column.
 *   await supabase.from('posts').insert({ ...payload, ...verdict.dbColumns });
 *
 * The returned `verdict.dbColumns` is a ready-to-spread object containing:
 *   moderation_status, moderation_reason, moderation_score,
 *   moderation_categories, moderated_at, moderator_type
 *
 * No blurs. No censors. Just the verdict, written directly to the row.
 *
 * H2 Innovative — Focus Immune System
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_VERDICT = Object.freeze({
    moderationStatus: 'approved',
    toxicityType: 'safe',
    severity: 'none',
    confidence: 0,
    categories: [],
    reason: '',
    suggestion: null,
});

export const useAutoModeration = () => {
    const [moderating, setModerating] = useState(false);
    const [lastVerdict, setLastVerdict] = useState(null);
    const [error, setError] = useState(null);

    /**
     * Run the Gemini-powered moderation.
     * @param {{ text?: string, imageUrls?: string[] }} payload
     * @returns {Promise<{
     *   moderationStatus: 'approved'|'restricted'|'flagged',
     *   toxicityType: string,
     *   severity: string,
     *   confidence: number,
     *   categories: string[],
     *   reason: string,
     *   suggestion: string|null,
     *   dbColumns: Object,        // Spread this into your INSERT payload
     * }>}
     */
    const moderate = useCallback(async ({ text = '', imageUrls = [] } = {}) => {
        setModerating(true);
        setError(null);
        try {
            const { data, error: invokeError } = await supabase.functions.invoke('content-moderator', {
                body: { text, imageUrls },
            });

            if (invokeError) throw invokeError;

            // Defensive merge with defaults — edge function may change shape later
            const verdict = {
                ...DEFAULT_VERDICT,
                ...data,
            };

            // Never trust a response that doesn't explicitly set the status
            if (!['approved', 'restricted', 'flagged'].includes(verdict.moderationStatus)) {
                verdict.moderationStatus = 'flagged';
                verdict.reason = verdict.reason || 'Unknown AI response — queued for manual review.';
            }

            const dbColumns = {
                moderation_status: verdict.moderationStatus,
                moderation_reason: verdict.reason || null,
                moderation_score: typeof verdict.confidence === 'number' ? verdict.confidence : null,
                moderation_categories: Array.isArray(verdict.categories) ? verdict.categories : [],
                moderated_at: new Date().toISOString(),
                moderator_type: 'auto',
            };

            const result = { ...verdict, dbColumns };
            setLastVerdict(result);
            return result;
        } catch (err) {
            // Fail CLOSED per Pillar 2 spec — if AI fails, content is flagged for human review.
            console.error('[useAutoModeration] edge invoke failed:', err);
            setError(err?.message || String(err));
            const flagged = {
                ...DEFAULT_VERDICT,
                moderationStatus: 'flagged',
                reason: 'Moderation service unavailable. Queued for manual review.',
                dbColumns: {
                    moderation_status: 'flagged',
                    moderation_reason: 'Moderation service unavailable. Queued for manual review.',
                    moderation_score: null,
                    moderation_categories: [],
                    moderated_at: new Date().toISOString(),
                    moderator_type: 'auto',
                },
            };
            setLastVerdict(flagged);
            return flagged;
        } finally {
            setModerating(false);
        }
    }, []);

    return { moderate, moderating, lastVerdict, error };
};

export default useAutoModeration;
