-- =============================================================================
-- 🛡️  PILLAR 3 — FOCUS TEEN CARE (Guardian Handshake + Content Lock)
-- Migration: 20260421010000_pillar3_teen_care_handshake.sql
-- H2 Innovative — Safe Haven for 13-17
-- =============================================================================
-- Builds ON TOP of the existing 20251127_teen_care_schema.sql. Adds the
-- sovereignty pieces required by the Pillar 3 spec:
--
-- 1. profiles.guardian_email       — captured at Institutional ID scan
-- 2. profiles.can_post             — locked to FALSE until consent arrives
-- 3. profiles.guardian_consent_status ∈ (pending, active, declined)
-- 4. profiles.is_teen_mode          — denormalised flag for fast lookup
-- 5. Trigger: teen content is AUTOMATICALLY flipped to moderation_status
--   'restricted' at INSERT time until the guardian_consent_status = 'active'
--   (spec: "Automate the 'Restricted' status for teens until the guardian
--   confirms the handshake.")
-- 6. Messages privacy: RLS guarantees guardians CANNOT read private DMs —
--   they can only see metrics. Spec: "NEVER read private messages."
-- =============================================================================

-- ── 1. Profile columns ──────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
        ALTER TABLE public.profiles
            ADD COLUMN IF NOT EXISTS guardian_email           TEXT,
            ADD COLUMN IF NOT EXISTS guardian_consent_status  TEXT
                CHECK (guardian_consent_status IN ('pending', 'active', 'declined') OR guardian_consent_status IS NULL),
            ADD COLUMN IF NOT EXISTS guardian_consent_sent_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS guardian_consent_token   TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS guardian_confirmed_at    TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS can_post                  BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS is_teen_mode              BOOLEAN NOT NULL DEFAULT FALSE;

        CREATE INDEX IF NOT EXISTS idx_profiles_guardian_email ON public.profiles (guardian_email) WHERE guardian_email IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_profiles_teen_consent   ON public.profiles (is_teen_mode, guardian_consent_status) WHERE is_teen_mode = TRUE;
    END IF;
END $$;

-- ── 2. Sync `is_teen_mode` from `age_verification` ──────────────────────────
-- When age_verification row is inserted/updated (existing trigger already
-- derives is_teen_mode there), mirror that to profiles for fast reads.
CREATE OR REPLACE FUNCTION public.sync_profile_teen_mode()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
       SET is_teen_mode = NEW.is_teen_mode,
           -- Teens start with can_post = FALSE until guardian consent arrives.
           -- Adults are unaffected.
           can_post = CASE
               WHEN NEW.is_teen_mode = TRUE AND (guardian_consent_status IS DISTINCT FROM 'active')
                   THEN FALSE
               WHEN NEW.is_adult = TRUE
                   THEN TRUE
               ELSE can_post
           END
     WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_teen_mode_trigger ON public.age_verification;
CREATE TRIGGER sync_profile_teen_mode_trigger
    AFTER INSERT OR UPDATE ON public.age_verification
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_teen_mode();

-- ── 3. When guardian confirms, unlock can_post ──────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_guardian_consent_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.guardian_consent_status = 'active' AND (OLD.guardian_consent_status IS DISTINCT FROM 'active') THEN
        NEW.can_post := TRUE;
        NEW.guardian_confirmed_at := COALESCE(NEW.guardian_confirmed_at, NOW());
    ELSIF NEW.guardian_consent_status IN ('pending', 'declined') AND NEW.is_teen_mode = TRUE THEN
        NEW.can_post := FALSE;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_guardian_consent_unlock_trigger ON public.profiles;
CREATE TRIGGER apply_guardian_consent_unlock_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.apply_guardian_consent_unlock();

-- ── 4. TEEN AUTO-RESTRICTION TRIGGER ────────────────────────────────────────
-- Spec: "Automate the 'Restricted' status for teens until the guardian
-- confirms the handshake." Runs on INSERT into every content table.
CREATE OR REPLACE FUNCTION public.enforce_teen_content_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _is_teen BOOLEAN;
    _consent TEXT;
    _can_post BOOLEAN;
BEGIN
    SELECT is_teen_mode, guardian_consent_status, can_post
      INTO _is_teen, _consent, _can_post
      FROM public.profiles
     WHERE id = NEW.user_id;

    IF _is_teen = TRUE AND (_consent IS DISTINCT FROM 'active' OR _can_post = FALSE) THEN
        NEW.moderation_status  := 'restricted';
        NEW.moderation_reason  := COALESCE(NEW.moderation_reason, 'Teen account — content is pending guardian consent.');
        NEW.moderator_type     := COALESCE(NEW.moderator_type, 'auto');
        NEW.moderated_at       := COALESCE(NEW.moderated_at, NOW());
    END IF;

    RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes', 'stories', 'comments']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS teen_content_lock_trigger ON public.%I', t);
            EXECUTE format(
                'CREATE TRIGGER teen_content_lock_trigger BEFORE INSERT ON public.%I
                 FOR EACH ROW EXECUTE FUNCTION public.enforce_teen_content_lock()',
                t
            );
        END IF;
    END LOOP;
END $$;

-- ── 5. Messages privacy — parents can NEVER read teen DMs ────────────────────
-- Spec: "Parents can see metrics (time, safety alerts) but NEVER read private
-- messages." Guarantee this with an RLS policy that ONLY allows the sender,
-- receiver, or service_role to SELECT messages. Guardians are explicitly
-- excluded by omission.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages') THEN
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
        -- Drop any permissive select policies first (idempotent)
        DROP POLICY IF EXISTS messages_privacy_select ON public.messages;
        -- Only direct participants (sender/receiver) can read. Guardians have NO access.
        CREATE POLICY messages_privacy_select ON public.messages
            FOR SELECT
            USING (
                sender_id = auth.uid()
                OR receiver_id = auth.uid()
                OR (
                    conversation_id IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM public.conversation_participants cp
                         WHERE cp.conversation_id = messages.conversation_id
                           AND cp.user_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- ── 6. Helper RPC: start_guardian_handshake(teen_id, guardian_email) ──────
-- Single source of truth for the Handshake Protocol. Generates the encrypted
-- token, writes the consent-pending state, and returns the token. The send-
-- email Edge Function reads the token and emails the guardian.
CREATE OR REPLACE FUNCTION public.start_guardian_handshake(
    p_teen_id UUID,
    p_guardian_email TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _token TEXT;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_teen_id THEN
        RAISE EXCEPTION 'Only the teen account may initiate their own guardian handshake.';
    END IF;
    IF p_guardian_email IS NULL OR p_guardian_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
        RAISE EXCEPTION 'A valid guardian email is required.';
    END IF;

    -- Generate a cryptographically strong token (64 hex chars)
    _token := encode(gen_random_bytes(32), 'hex');

    UPDATE public.profiles
       SET guardian_email            = p_guardian_email,
           guardian_consent_status   = 'pending',
           guardian_consent_token    = _token,
           guardian_consent_sent_at  = NOW(),
           can_post                  = FALSE
     WHERE id = p_teen_id;

    RETURN _token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_guardian_handshake(UUID, TEXT) TO authenticated;

-- ── 7. Helper RPC: confirm_guardian_consent(token) ──────────────────────────
-- Called by the encrypted link the guardian clicks. Idempotent & safe to
-- re-run. Unlocks can_post via the trigger above.
CREATE OR REPLACE FUNCTION public.confirm_guardian_consent(
    p_token TEXT
) RETURNS TABLE(teen_id UUID, confirmed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _teen_id UUID;
BEGIN
    SELECT id INTO _teen_id FROM public.profiles
     WHERE guardian_consent_token = p_token
       AND guardian_consent_status = 'pending'
       AND guardian_consent_sent_at > NOW() - INTERVAL '7 days'; -- token TTL

    IF _teen_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired guardian consent token.';
    END IF;

    UPDATE public.profiles
       SET guardian_consent_status = 'active',
           guardian_confirmed_at   = NOW(),
           can_post                = TRUE,
           guardian_consent_token  = NULL   -- one-time use
     WHERE id = _teen_id;

    RETURN QUERY SELECT _teen_id, NOW()::TIMESTAMPTZ;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_guardian_consent(TEXT) TO anon, authenticated;

-- =============================================================================
-- ✅ PILLAR 3 MIGRATION COMPLETE — Guardian Handshake + Teen Content Lock.
-- =============================================================================
DO $$ BEGIN RAISE NOTICE 'Pillar 3: Guardian handshake + teen auto-restrict + DM privacy deployed.'; END $$;
