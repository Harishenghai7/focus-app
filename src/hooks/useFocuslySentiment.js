/**
 * useFocuslySentiment.js
 * ======================
 * 🦁  PILLAR 4 — Proactive empathy engine for Focusly AI.
 *
 * Watches a few lightweight signals and, when one fires, asks Focusly to
 * surface with a supportive glassmorphic toast. No heavy NLP; the signals
 * themselves ARE the sentiment:
 *
 *   1. Onboarding stall      — user has been idle on a verification step for
 *                              >45s and hasn't advanced. → motivate()
 *   2. Recent shadow-restrict burst — 2+ posts restricted in last 24h?
 *                              → disappoint() + coach (ties into Pillar 2)
 *   3. First successful login — welcome back. → motivate()
 *
 * These are just sensible defaults — more signals can be added by calling
 * `focusly.motivate/celebrate/disappoint/think` from anywhere in the app.
 *
 * H2 Innovative — Heart in the Machine.
 */

import { useEffect, useRef } from 'react';
import { useFocusly } from '../context/FocuslyContext';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

const STORAGE_KEYS = {
    LAST_WELCOME:        'focusly.lastWelcomeAt',
    LAST_COACH_NUDGE:    'focusly.lastCoachNudgeAt',
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const useFocuslySentiment = () => {
    const { motivate, disappoint } = useFocusly();
    const { user } = useAuth();
    const welcomedRef = useRef(false);

    // ── Signal 1: Welcome-back motivational on sign-in ────────────────────
    useEffect(() => {
        if (!user?.id || welcomedRef.current) return;
        const last = Number(localStorage.getItem(STORAGE_KEYS.LAST_WELCOME) || 0);
        if (Date.now() - last < ONE_DAY_MS) return; // Don't spam same-day logins
        welcomedRef.current = true;
        localStorage.setItem(STORAGE_KEYS.LAST_WELCOME, String(Date.now()));
        // Slight delay so the toast feels reactive to the login, not instant
        const t = setTimeout(() => {
            const firstName = user?.user_metadata?.full_name?.split(' ')?.[0];
            motivate(
                firstName
                    ? `Welcome back, ${firstName}. Today is a great day to be real.`
                    : `Welcome back. Today is a great day to be real.`
            );
        }, 1500);
        return () => clearTimeout(t);
    }, [user, motivate]);

    // ── Signal 2: Shadow-restrict burst → coaching moment (Pillar 2 × 4) ──
    useEffect(() => {
        if (!user?.id) return;
        const last = Number(localStorage.getItem(STORAGE_KEYS.LAST_COACH_NUDGE) || 0);
        if (Date.now() - last < ONE_DAY_MS) return; // one coach nudge per day max

        let cancelled = false;
        (async () => {
            try {
                const since = new Date(Date.now() - ONE_DAY_MS).toISOString();
                const { data, error } = await supabase
                    .from('posts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('moderation_status', 'restricted')
                    .gt('created_at', since);
                if (error || cancelled) return;
                const restrictedCount = data?.length ?? 0;
                // `head: true` returns no rows — we need the count header.
                // Supabase-js exposes it on the response; re-query if needed:
                if (restrictedCount === 0) {
                    const r2 = await supabase
                        .from('posts')
                        .select('id', { count: 'exact' })
                        .eq('user_id', user.id)
                        .eq('moderation_status', 'restricted')
                        .gt('created_at', since);
                    if (r2.error || cancelled) return;
                    const count = r2.count ?? (r2.data?.length ?? 0);
                    if (count >= 2) {
                        localStorage.setItem(STORAGE_KEYS.LAST_COACH_NUDGE, String(Date.now()));
                        setTimeout(() => {
                            if (!cancelled) {
                                disappoint(
                                    `Hey Macha — I noticed ${count} of your recent posts were restricted. Want to chat about what's going on? No judgment.`
                                );
                            }
                        }, 2500);
                    }
                }
            } catch (err) {
                // silent — sentiment is best-effort
                console.debug('[FocuslySentiment] probe failed:', err?.message);
            }
        })();
        return () => { cancelled = true; };
    }, [user, disappoint]);
};

export default useFocuslySentiment;
