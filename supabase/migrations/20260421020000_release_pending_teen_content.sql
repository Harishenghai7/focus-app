-- =============================================================================
-- 🛡️  PILLAR 3 ADDENDUM — release_pending_teen_content + auto-call from consent
-- Migration: 20260421020000_release_pending_teen_content.sql
-- H2 Innovative — Unlocks queued teen content when guardian approves
-- =============================================================================
-- Depends on 20260421000000_pillar2_stealth_shield.sql (moderation_status)
-- Depends on 20260421010000_pillar3_teen_care_handshake.sql (guardian consent)
--
-- When a teen posts before the guardian has confirmed, Pillar 3's trigger
-- forces every row to moderation_status = 'restricted'. Once the guardian
-- clicks the ack link and confirm_guardian_consent() runs, those queued rows
-- should flip to 'approved' so the teen can finally be seen by the nation.
-- =============================================================================

-- ── 1. Bulk release RPC ────────────────────────────────────────────────────
-- Flips all rows whose ONLY reason for being restricted was the teen lock
-- (moderation_reason LIKE 'Teen account — %') to 'approved'. Does NOT unlock
-- anything Gemini marked as toxic — that stays shadow-banned forever.
CREATE OR REPLACE FUNCTION public.release_pending_teen_content(
    p_teen_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _released_total INTEGER := 0;
    _released       INTEGER;
    _table          TEXT;
    _sql            TEXT;
BEGIN
    -- Only the teen themselves, or the service_role, or an admin, may run this.
    IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_teen_id AND auth.role() IS DISTINCT FROM 'service_role' THEN
        -- Allow admins through the profiles.role check if present
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
            RAISE EXCEPTION 'Not authorised to release pending content for another user.';
        END IF;
    END IF;

    -- Only release if the teen currently has active guardian consent
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
         WHERE id = p_teen_id
           AND is_teen_mode = TRUE
           AND guardian_consent_status = 'active'
           AND can_post = TRUE
    ) THEN
        RAISE EXCEPTION 'Guardian consent is not active for this teen. Cannot release content.';
    END IF;

    -- Flip every content table we know about
    FOR _table IN SELECT unnest(ARRAY['posts', 'boltz', 'flashes', 'stories', 'comments']) LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=_table) THEN
            _sql := format(
                'UPDATE public.%I
                    SET moderation_status = ''approved'',
                        moderation_reason = NULL,
                        moderated_at      = NOW(),
                        moderator_type    = ''appeal''
                  WHERE user_id = $1
                    AND moderation_status = ''restricted''
                    AND (moderation_reason IS NULL OR moderation_reason LIKE ''Teen account %%'')',
                _table
            );
            EXECUTE _sql USING p_teen_id;
            GET DIAGNOSTICS _released = ROW_COUNT;
            _released_total := _released_total + _released;
        END IF;
    END LOOP;

    -- Audit log (best-effort; migration 20260421000000 created this table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='moderation_audit') THEN
        INSERT INTO public.moderation_audit (
            content_type, content_id, user_id,
            old_status, new_status, reason,
            moderator_type, admin_id
        ) VALUES (
            'post', p_teen_id, p_teen_id,
            'restricted', 'approved',
            format('Bulk release: %s rows unlocked after guardian consent.', _released_total),
            'appeal', auth.uid()
        );
    END IF;

    RETURN _released_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_pending_teen_content(UUID) TO authenticated, service_role;

-- ── 2. Update confirm_guardian_consent to auto-call the release ────────────
-- Idempotent REPLACE of the earlier definition.
CREATE OR REPLACE FUNCTION public.confirm_guardian_consent(
    p_token TEXT
) RETURNS TABLE(teen_id UUID, confirmed_at TIMESTAMPTZ, content_released INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _teen_id  UUID;
    _released INTEGER := 0;
BEGIN
    SELECT id INTO _teen_id FROM public.profiles
     WHERE guardian_consent_token = p_token
       AND guardian_consent_status = 'pending'
       AND guardian_consent_sent_at > NOW() - INTERVAL '7 days';

    IF _teen_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired guardian consent token.';
    END IF;

    UPDATE public.profiles
       SET guardian_consent_status = 'active',
           guardian_confirmed_at   = NOW(),
           can_post                = TRUE,
           guardian_consent_token  = NULL
     WHERE id = _teen_id;

    -- Auto-release any content the teen had queued while awaiting consent
    BEGIN
        _released := public.release_pending_teen_content(_teen_id);
    EXCEPTION WHEN OTHERS THEN
        -- Don't fail the consent flow if release fails; log-only
        RAISE NOTICE 'release_pending_teen_content non-fatal failure: %', SQLERRM;
        _released := 0;
    END;

    RETURN QUERY SELECT _teen_id, NOW()::TIMESTAMPTZ, _released;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_guardian_consent(TEXT) TO anon, authenticated;

-- =============================================================================
-- ✅ Pillar 3 addendum complete. Guardian consent now unlocks queued content.
-- =============================================================================
DO $$ BEGIN RAISE NOTICE 'release_pending_teen_content RPC + confirm_guardian_consent upgrade deployed.'; END $$;
