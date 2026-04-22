-- =============================================================================
-- 🛡️  MASTER MIGRATION: PILLAR 1 + PILLAR 2
-- Migration: 20260422_master_pillar1_pillar2_complete.sql
-- H2 Innovative — Focus Trust Shield + Immune System
-- =============================================================================
-- RUN THIS SINGLE FILE TO DEPLOY BOTH PILLARS
-- =============================================================================

-- =============================================================================
-- PART 1: ENUMS (Shared and Specific)
-- =============================================================================

-- Trust Shield Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_shield_status') THEN
        CREATE TYPE trust_shield_status AS ENUM (
            'unverified', 'pending', 'verified', 'teen_pending', 'teen_verified',
            'rejected', 'locked', 'banned'
        );
    END IF;
END $$;

-- Document Tier (Adult vs Teen IDs)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_tier') THEN
        CREATE TYPE document_tier AS ENUM ('adult', 'teen');
    END IF;
END $$;

-- Verification Method
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
        CREATE TYPE verification_method AS ENUM (
            'govt_id', 'student_id', 'biometric_only', 'guardian_override'
        );
    END IF;
END $$;

-- Moderation Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
        CREATE TYPE moderation_status AS ENUM ('approved', 'restricted', 'flagged');
    END IF;
END $$;

-- Toxicity Type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toxicity_type') THEN
        CREATE TYPE toxicity_type AS ENUM (
            'safe', 'nsfw', 'hate', 'violence', 'self_harm',
            'bullying', 'misinformation', 'spam', 'negative_loop'
        );
    END IF;
END $$;

-- Moderator Type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderator_type') THEN
        CREATE TYPE moderator_type AS ENUM ('auto', 'admin', 'appeal');
    END IF;
END $$;

-- =============================================================================
-- PART 2: PILLAR 1 — TRUST SHIELD (Profiles Enhancement)
-- =============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS trust_shield_status trust_shield_status NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS identity_hash TEXT,
    ADD COLUMN IF NOT EXISTS id_document_type TEXT,
    ADD COLUMN IF NOT EXISTS id_document_tier document_tier,
    ADD COLUMN IF NOT EXISTS id_number_masked TEXT,
    ADD COLUMN IF NOT EXISTS verification_method verification_method,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_verification_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('13-17', '18+') OR age_group IS NULL),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS is_teen_mode BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS biometric_face_score NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS biometric_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(4,3),
    ADD COLUMN IF NOT EXISTS hard_reset_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_hard_reset_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hard_reset_reason TEXT,
    ADD COLUMN IF NOT EXISTS guardian_consent_status TEXT DEFAULT 'none' CHECK (guardian_consent_status IN ('none', 'pending', 'active', 'expired', 'revoked')),
    ADD COLUMN IF NOT EXISTS guardian_consent_granted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guardian_consent_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guardian_email TEXT,
    ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
    ADD COLUMN IF NOT EXISTS guardian_name TEXT,
    ADD COLUMN IF NOT EXISTS can_post BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS restriction_reason TEXT;

-- Trust Shield Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON public.profiles (identity_hash) WHERE identity_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trust_status ON public.profiles (trust_shield_status);
CREATE INDEX IF NOT EXISTS idx_profiles_teen_mode ON public.profiles (is_teen_mode, guardian_consent_status) WHERE is_teen_mode = TRUE;

-- =============================================================================
-- PART 3: PILLAR 1 — IDENTITY DEDUPLICATION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_identity_hash_unique()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.identity_hash IS NULL THEN RETURN NEW; END IF;
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE identity_hash = NEW.identity_hash AND id != NEW.id
        AND trust_shield_status NOT IN ('banned', 'locked')
    ) THEN
        RAISE EXCEPTION 'ERR_DUPLICATE_IDENTITY: This identity is already registered. One User, One Account.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_identity_hash_unique ON public.profiles;
CREATE TRIGGER enforce_identity_hash_unique
    BEFORE INSERT OR UPDATE OF identity_hash ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_identity_hash_unique();

-- =============================================================================
-- PART 4: PILLAR 1 — VERIFICATION AUDIT TRAIL
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.verification_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('success', 'failed', 'blocked', 'flagged')),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_user ON public.verification_audit_trail (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_audit_event ON public.verification_audit_trail (event_type, created_at DESC);

ALTER TABLE public.verification_audit_trail ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS verification_audit_user_read ON public.verification_audit_trail;
CREATE POLICY verification_audit_user_read ON public.verification_audit_trail
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- =============================================================================
-- PART 5: PILLAR 1 — GUARDIAN APPROVALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.guardian_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    guardian_phone TEXT,
    guardian_name TEXT,
    consent_token TEXT UNIQUE NOT NULL,
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_granted_at TIMESTAMPTZ,
    consent_expires_at TIMESTAMPTZ,
    consent_ip INET,
    consent_user_agent TEXT,
    teen_dob_verified DATE,
    id_document_tier document_tier,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_approvals_teen ON public.guardian_approvals (teen_user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_approvals_token ON public.guardian_approvals (consent_token);

ALTER TABLE public.guardian_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS guardian_approvals_teen_read ON public.guardian_approvals;
CREATE POLICY guardian_approvals_teen_read ON public.guardian_approvals
    FOR SELECT USING (
        teen_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- =============================================================================
-- PART 6: PILLAR 1 — AGE/TIER VALIDATION (Hard Reset)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_age_tier_match()
RETURNS TRIGGER AS $$
DECLARE v_age INTEGER;
BEGIN
    IF NEW.trust_shield_status NOT IN ('verified', 'teen_verified') THEN RETURN NEW; END IF;
    IF NEW.date_of_birth IS NOT NULL THEN
        v_age := EXTRACT(YEAR FROM AGE(NEW.date_of_birth));
        IF v_age < 13 THEN
            NEW.trust_shield_status := 'banned';
            NEW.restriction_reason := 'ERR_UNDERAGE: Focus is not available for anyone under 13.';
            NEW.can_post := FALSE;
            RETURN NEW;
        END IF;
        IF NEW.id_document_tier = 'adult' AND v_age < 18 THEN
            NEW.trust_shield_status := 'locked';
            NEW.hard_reset_count := COALESCE(NEW.hard_reset_count, 0) + 1;
            NEW.last_hard_reset_at := NOW();
            NEW.hard_reset_reason := 'ERR_TIER_MISMATCH: Adult tier selected but under 18 ID provided';
            NEW.can_post := FALSE;
        ELSIF NEW.id_document_tier = 'teen' AND v_age >= 18 THEN
            NEW.trust_shield_status := 'locked';
            NEW.hard_reset_count := COALESCE(NEW.hard_reset_count, 0) + 1;
            NEW.last_hard_reset_at := NOW();
            NEW.hard_reset_reason := 'ERR_TIER_MISMATCH: Teen tier selected but 18+ ID provided';
            NEW.can_post := FALSE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS validate_age_tier_trigger ON public.profiles;
CREATE TRIGGER validate_age_tier_trigger
    BEFORE UPDATE OF trust_shield_status, date_of_birth, id_document_tier ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.validate_age_tier_match();

-- =============================================================================
-- PART 7: PILLAR 2 — MODERATION COLUMNS ON CONTENT TABLES
-- =============================================================================

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes', 'comments']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_status moderation_status NOT NULL DEFAULT ''approved''', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS toxicity_type toxicity_type', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_severity TEXT CHECK (moderation_severity IN (''none'', ''low'', ''medium'', ''high'', ''critical''))', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_score NUMERIC(4,3)', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_categories TEXT[]', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_reason TEXT', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderator_type moderator_type DEFAULT ''auto''', t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_moderation ON public.%I (moderation_status) WHERE moderation_status != ''approved''', t, t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_mod ON public.%I (user_id, moderation_status)', t, t);
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- PART 8: PILLAR 2 — THE STEALTH SHIELD
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_content_visible(p_status moderation_status, p_owner_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT p_status = 'approved' OR p_owner_id = auth.uid(); $$;

DO $$
DECLARE t TEXT; policy_name TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            policy_name := 'stealth_shield_select_' || t;
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_content_visible(moderation_status, user_id))', policy_name, t);
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- PART 9: PILLAR 2 — PUBLIC VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.v_visible_posts AS
    SELECT * FROM public.posts WHERE public.is_content_visible(moderation_status, user_id);

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boltz') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_boltz AS SELECT * FROM public.boltz WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashes') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_flashes AS SELECT * FROM public.flashes WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
END $$;

-- =============================================================================
-- PART 10: PILLAR 2 — MODERATION AUDIT LOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.moderation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'boltz', 'flash', 'comment', 'message')),
    content_id UUID NOT NULL,
    content_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_status moderation_status,
    new_status moderation_status NOT NULL,
    toxicity_type toxicity_type,
    severity TEXT,
    score NUMERIC(4,3),
    categories TEXT[],
    reason TEXT,
    moderator_type moderator_type NOT NULL,
    moderator_id UUID,
    ai_model TEXT,
    ai_raw_response JSONB,
    client_ip INET,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_content ON public.moderation_audit (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_user ON public.moderation_audit (content_user_id, created_at DESC);

ALTER TABLE public.moderation_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS moderation_audit_read ON public.moderation_audit;
CREATE POLICY moderation_audit_read ON public.moderation_audit
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR content_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================================================
-- PART 11: PILLAR 2 — ADMIN MODERATION QUEUE
-- =============================================================================

CREATE OR REPLACE VIEW public.v_moderation_queue AS
    SELECT 'post' as content_type, p.id as content_id, p.user_id as content_user_id,
           u.username, u.full_name, p.caption as content_preview, p.moderation_status,
           p.toxicity_type, p.moderation_score, p.moderation_categories, p.moderation_reason,
           p.moderated_at, p.moderation_appealed, p.media_url
    FROM public.posts p JOIN public.profiles u ON p.user_id = u.id
    WHERE p.moderation_status IN ('flagged', 'restricted')
    UNION ALL
    SELECT 'boltz', b.id, b.user_id, u.username, u.full_name, b.description, b.moderation_status,
           b.toxicity_type, b.moderation_score, b.moderation_categories, b.moderation_reason,
           b.moderated_at, b.moderation_appealed, b.video_url
    FROM public.boltz b JOIN public.profiles u ON b.user_id = u.id
    WHERE b.moderation_status IN ('flagged', 'restricted')
    ORDER BY moderated_at DESC;

-- =============================================================================
-- PART 12: PILLAR 2 — ADMIN FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_approve_content(p_content_type TEXT, p_content_id UUID, p_admin_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    IF p_content_type = 'post' THEN UPDATE public.posts SET moderation_status = 'approved', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_notes, 'Approved by admin') WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN UPDATE public.boltz SET moderation_status = 'approved', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_notes, 'Approved by admin') WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN UPDATE public.flashes SET moderation_status = 'approved', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_notes, 'Approved by admin') WHERE id = p_content_id;
    END IF;
    INSERT INTO public.moderation_audit (content_type, content_id, old_status, new_status, moderator_type, moderator_id, reason)
    VALUES (p_content_type, p_content_id, 'flagged', 'approved', 'admin', p_admin_id, COALESCE(p_notes, 'Approved by admin'));
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_restrict_content(p_content_type TEXT, p_content_id UUID, p_admin_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    IF p_content_type = 'post' THEN UPDATE public.posts SET moderation_status = 'restricted', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_reason, 'Restricted by admin') WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN UPDATE public.boltz SET moderation_status = 'restricted', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_reason, 'Restricted by admin') WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN UPDATE public.flashes SET moderation_status = 'restricted', moderator_type = 'admin', moderator_id = p_admin_id, moderation_reviewed_at = NOW(), moderation_reason = COALESCE(p_reason, 'Restricted by admin') WHERE id = p_content_id;
    END IF;
    INSERT INTO public.moderation_audit (content_type, content_id, old_status, new_status, moderator_type, moderator_id, reason)
    VALUES (p_content_type, p_content_id, 'approved', 'restricted', 'admin', p_admin_id, COALESCE(p_reason, 'Restricted by admin'));
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- PART 13: PILLAR 2 — USER APPEAL
-- =============================================================================

CREATE OR REPLACE FUNCTION public.appeal_content_moderation(p_content_type TEXT, p_content_id UUID, p_appeal_reason TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID; v_current_status moderation_status;
BEGIN
    v_user_id := auth.uid();
    IF p_content_type = 'post' THEN SELECT moderation_status, user_id INTO v_current_status, v_user_id FROM public.posts WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN SELECT moderation_status, user_id INTO v_current_status, v_user_id FROM public.boltz WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN SELECT moderation_status, user_id INTO v_current_status, v_user_id FROM public.flashes WHERE id = p_content_id;
    END IF;
    IF v_user_id != auth.uid() THEN RAISE EXCEPTION 'Unauthorized: Can only appeal own content'; END IF;
    IF v_current_status NOT IN ('restricted', 'flagged') THEN RAISE EXCEPTION 'Cannot appeal: Content is not restricted or flagged'; END IF;
    IF p_content_type = 'post' THEN UPDATE public.posts SET moderation_appealed = TRUE, moderation_appealed_at = NOW(), moderation_status = 'flagged' WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN UPDATE public.boltz SET moderation_appealed = TRUE, moderation_appealed_at = NOW(), moderation_status = 'flagged' WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN UPDATE public.flashes SET moderation_appealed = TRUE, moderation_appealed_at = NOW(), moderation_status = 'flagged' WHERE id = p_content_id;
    END IF;
    INSERT INTO public.moderation_audit (content_type, content_id, content_user_id, old_status, new_status, reason, moderator_type)
    VALUES (p_content_type, p_content_id, v_user_id, v_current_status, 'flagged', p_appeal_reason, 'appeal');
    RETURN TRUE;
END;
$$;

-- =============================================================================
-- PART 14: MIGRATE EXISTING DATA
-- =============================================================================

DO $$
BEGIN
    UPDATE public.posts SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.boltz SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.flashes SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.comments SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    RAISE NOTICE 'Migrated existing content to approved status';
END $$;

-- =============================================================================
-- ✅ MASTER MIGRATION COMPLETE
-- =============================================================================
DO $$ BEGIN
    RAISE NOTICE 'PILLAR 1 + PILLAR 2: Trust Shield and Immune System deployed successfully!';
END $$;
