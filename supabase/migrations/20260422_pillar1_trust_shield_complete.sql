-- =============================================================================
-- 🛡️  PILLAR 1 — TRUST SHIELD (Identity Verification)
-- Migration: 20260422_pillar1_trust_shield_complete.sql
-- H2 Innovative — Focus Identity Verification System
-- =============================================================================
-- Biometric identity gate with:
--   - Identity DNA (SHA-256 hashing)
--   - Verification status tracking
--   - Guardian approval system (for teens)
--   - Complete audit trail
-- =============================================================================

-- =============================================================================
-- 1. TRUST SHIELD STATUS ENUM
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_shield_status') THEN
        CREATE TYPE trust_shield_status AS ENUM (
            'unverified',           -- New user, no verification attempted
            'pending',              -- Verification in progress
            'verified',             -- Fully verified adult (18+)
            'teen_pending',         -- Teen waiting for guardian consent
            'teen_verified',        -- Teen with guardian approval
            'rejected',             -- Verification failed, can retry
            'locked',               -- Hard reset triggered, requires re-verification
            'banned'                -- Permanent ban (duplicate identity, underage, etc.)
        );
    ELSE
        -- Ensure all values exist
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'unverified'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'pending'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'verified'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'teen_pending'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'teen_verified'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'rejected'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'locked'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE trust_shield_status ADD VALUE IF NOT EXISTS 'banned'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- =============================================================================
-- 2. DOCUMENT TIER ENUM (Govt ID vs Student ID)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_tier') THEN
        CREATE TYPE document_tier AS ENUM ('adult', 'teen');
    END IF;
END $$;

-- =============================================================================
-- 3. VERIFICATION METHOD ENUM
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
        CREATE TYPE verification_method AS ENUM (
            'govt_id',              -- Aadhaar, Passport, Driver's License
            'student_id',           -- School/College ID
            'biometric_only',       -- Liveness only (fallback)
            'guardian_override'     -- Emergency guardian approval
        );
    END IF;
END $$;

-- =============================================================================
-- 4. PROFILES TABLE ENHANCEMENTS (Trust Shield Columns)
-- =============================================================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS trust_shield_status trust_shield_status NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS identity_hash TEXT,                        -- SHA256(ID_Number + Salt)
    ADD COLUMN IF NOT EXISTS id_document_type TEXT,                     -- 'aadhaar', 'passport', 'student_id'
    ADD COLUMN IF NOT EXISTS id_document_tier document_tier,            -- 'adult' or 'teen'
    ADD COLUMN IF NOT EXISTS id_number_masked TEXT,                     -- Last 4 digits only
    ADD COLUMN IF NOT EXISTS verification_method verification_method,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_verification_attempt_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS age_group TEXT CHECK (age_group IN ('13-17', '18+') OR age_group IS NULL),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS is_teen_mode BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS biometric_face_score NUMERIC(3,2),         -- Liveness confidence 0.00-1.00
    ADD COLUMN IF NOT EXISTS biometric_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(4,3),               -- OCR confidence 0.000-1.000
    ADD COLUMN IF NOT EXISTS hard_reset_count INTEGER DEFAULT 0,        -- Track resets
    ADD COLUMN IF NOT EXISTS last_hard_reset_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS hard_reset_reason TEXT,                    -- ERR_TIER_MISMATCH, ERR_UNDERAGE, etc.
    ADD COLUMN IF NOT EXISTS guardian_consent_status TEXT CHECK (guardian_consent_status IN ('none', 'pending', 'active', 'expired', 'revoked') OR guardian_consent_status IS NULL) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS guardian_consent_granted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guardian_consent_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS guardian_email TEXT,
    ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
    ADD COLUMN IF NOT EXISTS guardian_name TEXT,
    ADD COLUMN IF NOT EXISTS can_post BOOLEAN DEFAULT TRUE,             -- Posting restrictions
    ADD COLUMN IF NOT EXISTS restriction_reason TEXT;                   -- Why posting is blocked

-- Indexes for Trust Shield queries
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON public.profiles (identity_hash) WHERE identity_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_trust_status ON public.profiles (trust_shield_status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified_at ON public.profiles (verified_at DESC) WHERE verified_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_teen_mode ON public.profiles (is_teen_mode, guardian_consent_status) WHERE is_teen_mode = TRUE;

-- =============================================================================
-- 5. IDENTITY HASH DEDUPLICATION CHECK
-- =============================================================================
-- Critical: Prevent duplicate identities (one user, one account)
CREATE OR REPLACE FUNCTION public.check_identity_hash_unique()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if identity_hash is NULL (not yet verified)
    IF NEW.identity_hash IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if hash exists on another account
    IF EXISTS (
        SELECT 1 FROM public.profiles
        WHERE identity_hash = NEW.identity_hash
        AND id != NEW.id
        AND trust_shield_status NOT IN ('banned', 'locked')
    ) THEN
        -- Log the attempt
        INSERT INTO public.verification_audit_trail (
            user_id, event_type, event_data, ip_address, status
        ) VALUES (
            NEW.id,
            'duplicate_identity_attempt',
            jsonb_build_object(
                'identity_hash_prefix', LEFT(NEW.identity_hash, 16),
                'attempted_at', NOW()
            ),
            NULL,
            'blocked'
        );

        -- Raise exception to block the update
        RAISE EXCEPTION 'ERR_DUPLICATE_IDENTITY: This identity is already registered. One User, One Account.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce unique identity hash
DROP TRIGGER IF EXISTS enforce_identity_hash_unique ON public.profiles;
CREATE TRIGGER enforce_identity_hash_unique
    BEFORE INSERT OR UPDATE OF identity_hash ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_identity_hash_unique();

-- =============================================================================
-- 6. VERIFICATION AUDIT TRAIL
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.verification_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- 'ocr_extracted', 'biometric_complete', 'tier_mismatch', 'hard_reset', etc.
    event_data JSONB DEFAULT '{}',
    status TEXT CHECK (status IN ('success', 'failed', 'blocked', 'flagged')),
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_user ON public.verification_audit_trail (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_audit_event ON public.verification_audit_trail (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_audit_status ON public.verification_audit_trail (status) WHERE status IN ('blocked', 'flagged');

-- RLS for audit trail (users see their own, admins see all)
ALTER TABLE public.verification_audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_audit_user_read ON public.verification_audit_trail;
CREATE POLICY verification_audit_user_read ON public.verification_audit_trail
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- =============================================================================
-- 7. GUARDIAN APPROVALS TABLE (For Teen Accounts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.guardian_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guardian_email TEXT NOT NULL,
    guardian_phone TEXT,
    guardian_name TEXT,
    consent_token TEXT UNIQUE NOT NULL,  -- Secure token for consent link
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_granted_at TIMESTAMPTZ,
    consent_expires_at TIMESTAMPTZ,
    consent_ip INET,
    consent_user_agent TEXT,
    teen_dob_verified DATE,  -- DOB extracted from teen's ID
    id_document_tier document_tier,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_consent_period CHECK (consent_expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_guardian_approvals_teen ON public.guardian_approvals (teen_user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_approvals_token ON public.guardian_approvals (consent_token);
CREATE INDEX IF NOT EXISTS idx_guardian_approvals_status ON public.guardian_approvals (status);

ALTER TABLE public.guardian_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guardian_approvals_teen_read ON public.guardian_approvals;
CREATE POLICY guardian_approvals_teen_read ON public.guardian_approvals
    FOR SELECT USING (
        teen_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR auth.role() = 'service_role'
    );

-- =============================================================================
-- 8. AGE/TIER VALIDATION FUNCTION (The Hard Reset Trigger)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.validate_age_tier_match()
RETURNS TRIGGER AS $$
DECLARE
    v_age INTEGER;
    v_tier document_tier;
BEGIN
    -- Only check on verification completion
    IF NEW.trust_shield_status NOT IN ('verified', 'teen_verified') THEN
        RETURN NEW;
    END IF;

    -- Calculate age if DOB available
    IF NEW.date_of_birth IS NOT NULL THEN
        v_age := EXTRACT(YEAR FROM AGE(NEW.date_of_birth));

        -- Under 13 = BAN
        IF v_age < 13 THEN
            NEW.trust_shield_status := 'banned';
            NEW.restriction_reason := 'ERR_UNDERAGE: Focus is not available for anyone under 13.';
            NEW.can_post := FALSE;

            -- Log the ban
            INSERT INTO public.verification_audit_trail (user_id, event_type, event_data, status)
            VALUES (NEW.id, 'underage_ban', jsonb_build_object('detected_age', v_age), 'blocked');

            RETURN NEW;
        END IF;

        -- Check tier/age mismatch
        IF NEW.id_document_tier = 'adult' AND v_age < 18 THEN
            -- Adult tier selected but teen ID uploaded
            NEW.trust_shield_status := 'locked';
            NEW.hard_reset_count := COALESCE(NEW.hard_reset_count, 0) + 1;
            NEW.last_hard_reset_at := NOW();
            NEW.hard_reset_reason := 'ERR_TIER_MISMATCH: Adult tier selected but under 18 ID provided';
            NEW.can_post := FALSE;

            INSERT INTO public.verification_audit_trail (user_id, event_type, event_data, status)
            VALUES (NEW.id, 'hard_reset_tier_mismatch', jsonb_build_object(
                'age', v_age,
                'selected_tier', 'adult',
                'detected_tier', 'teen'
            ), 'blocked');

        ELSIF NEW.id_document_tier = 'teen' AND v_age >= 18 THEN
            -- Teen tier selected but adult ID uploaded
            NEW.trust_shield_status := 'locked';
            NEW.hard_reset_count := COALESCE(NEW.hard_reset_count, 0) + 1;
            NEW.last_hard_reset_at := NOW();
            NEW.hard_reset_reason := 'ERR_TIER_MISMATCH: Teen tier selected but 18+ ID provided';
            NEW.can_post := FALSE;

            INSERT INTO public.verification_audit_trail (user_id, event_type, event_data, status)
            VALUES (NEW.id, 'hard_reset_tier_mismatch', jsonb_build_object(
                'age', v_age,
                'selected_tier', 'teen',
                'detected_tier', 'adult'
            ), 'blocked');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for age/tier validation
DROP TRIGGER IF EXISTS validate_age_tier_trigger ON public.profiles;
CREATE TRIGGER validate_age_tier_trigger
    BEFORE UPDATE OF trust_shield_status, date_of_birth, id_document_tier ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_age_tier_match();

-- =============================================================================
-- 9. POSTING PERMISSION CHECK FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.can_user_post(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = p_user_id
        AND can_post = TRUE
        AND trust_shield_status IN ('verified', 'teen_verified')
    );
$$;

-- =============================================================================
-- 10. PROFILES RLS POLICY UPDATE (Trust Shield Aware)
-- =============================================================================
-- Allow users to update their own profile during verification
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Prevent users from manually setting verified status
        AND (
            trust_shield_status IS NULL
            OR trust_shield_status IN ('unverified', 'pending', 'teen_pending', 'rejected', 'locked')
        )
    );

-- =============================================================================
-- ✅ PILLAR 1 MIGRATION COMPLETE
-- =============================================================================
DO $$ BEGIN
    RAISE NOTICE 'Pillar 1: Trust Shield columns, enums, audit trail, and validation functions deployed.';
END $$;
