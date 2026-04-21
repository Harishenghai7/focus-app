/**
 * useGuardianHandshake.js
 * =======================
 * 🛡️  PILLAR 3 — Client wrapper for the Guardian Handshake RPCs.
 *
 * Two-call protocol:
 *
 *   1. startHandshake({ guardianEmail }) — called from the Teen Trust Shield
 *      step after OCR confirms a student ID. Invokes the Supabase RPC
 *      `start_guardian_handshake(teen_id, guardian_email)` which:
 *         - sets profiles.guardian_email
 *         - sets guardian_consent_status = 'pending'
 *         - generates a cryptographically-strong consent token
 *         - flips can_post = FALSE
 *         - returns the token (to be emailed by the edge function)
 *      Then invokes the edge function `send-parent-consent-email` with the
 *      token + email so the guardian receives the encrypted ack link.
 *
 *   2. confirmConsent(token) — called from the `/guardian/confirm?t=<token>`
 *      public route when the guardian clicks the email link. Invokes
 *      `confirm_guardian_consent(token)` which flips the teen's status to
 *      'active' and unlocks can_post.
 *
 * H2 Innovative — Safe Haven.
 */

import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useGuardianHandshake = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Start the guardian handshake. Call this immediately after a teen's
     * Institutional ID passes OCR + liveness.
     * @param {{ guardianEmail: string }} params
     * @returns {Promise<{ token: string, emailQueued: boolean }>}
     */
    const startHandshake = useCallback(async ({ guardianEmail }) => {
        setLoading(true);
        setError(null);
        try {
            if (!user?.id) throw new Error('You must be signed in.');

            // 1. Write consent-pending state + mint the token (server-side RPC)
            const { data: token, error: rpcErr } = await supabase.rpc(
                'start_guardian_handshake',
                { p_teen_id: user.id, p_guardian_email: guardianEmail }
            );
            if (rpcErr) throw rpcErr;
            if (!token) throw new Error('Guardian handshake failed to mint a token.');

            // 2. Ask the Edge Function to send the encrypted ack link
            let emailQueued = false;
            try {
                const { error: fnErr } = await supabase.functions.invoke(
                    'send-parent-consent-email',
                    { body: { teenId: user.id, guardianEmail, token } }
                );
                emailQueued = !fnErr;
                if (fnErr) console.warn('[guardianHandshake] edge email error:', fnErr);
            } catch (fnErr) {
                console.warn('[guardianHandshake] edge invoke failed:', fnErr);
            }

            return { token, emailQueued };
        } catch (err) {
            setError(err?.message || String(err));
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user]);

    /**
     * Confirm the guardian consent — called from the `/guardian/confirm`
     * public route when the parent clicks the email link.
     * @param {string} token
     */
    const confirmConsent = useCallback(async (token) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcErr } = await supabase.rpc(
                'confirm_guardian_consent',
                { p_token: token }
            );
            if (rpcErr) throw rpcErr;
            return Array.isArray(data) ? data[0] : data;
        } catch (err) {
            setError(err?.message || String(err));
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Check the current user's guardian consent state.
     * @returns {Promise<{ is_teen_mode: boolean, guardian_consent_status: string|null,
     *                    can_post: boolean, guardian_email: string|null }>}
     */
    const getMyConsentStatus = useCallback(async () => {
        if (!user?.id) return null;
        const { data, error: sErr } = await supabase
            .from('profiles')
            .select('is_teen_mode, guardian_consent_status, can_post, guardian_email, guardian_confirmed_at')
            .eq('id', user.id)
            .maybeSingle();
        if (sErr) throw sErr;
        return data;
    }, [user]);

    return { startHandshake, confirmConsent, getMyConsentStatus, loading, error };
};

export default useGuardianHandshake;
