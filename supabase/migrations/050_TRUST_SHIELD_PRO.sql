-- ═══════════════════════════════════════════════════════════════════════════════
-- 🛡️ TRUST SHIELD PRO - Optimized & Hardened
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure necessary extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For faster name searching

BEGIN;

-- 1. PROFILES TABLE & CORE TRIGGERS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            full_name TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            avatar_url TEXT,
            verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'PENDING_GUARDIAN')),
            trust_shield_status TEXT DEFAULT 'PENDING',
            focus_trust_status TEXT DEFAULT 'PENDING',
            onboarding_completed BOOLEAN DEFAULT FALSE,
            can_post BOOLEAN DEFAULT TRUE,
            date_of_birth DATE
        );
    END IF;
END $$;

-- 2. IDEMPOTENT COLUMN ADDITION (Helper approach)
DO $$
DECLARE
    _col_name TEXT;
    _col_type TEXT;
    _col_default TEXT;
BEGIN
    -- Format: Array of [column_name, type, default_value]
    -- verification_step
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_step') THEN
        ALTER TABLE profiles ADD COLUMN verification_step INTEGER DEFAULT 1;
    END IF;
    
    -- verification_locked
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_locked') THEN
        ALTER TABLE profiles ADD COLUMN verification_locked BOOLEAN DEFAULT FALSE;
    END IF;

    -- identity_hash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='identity_hash') THEN
        ALTER TABLE profiles ADD COLUMN identity_hash TEXT;
    END IF;

    -- verification_metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_metadata') THEN
        ALTER TABLE profiles ADD COLUMN verification_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- locked_at, device_id, device_fingerprint, ip_hash, last_verification_attempt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='device_id') THEN
        ALTER TABLE profiles ADD COLUMN device_id TEXT, ADD COLUMN device_fingerprint TEXT, ADD COLUMN ip_hash TEXT, ADD COLUMN locked_at TIMESTAMPTZ, ADD COLUMN last_verification_attempt TIMESTAMPTZ;
    END IF;
END $$;

-- 3. INDEXES & CONSTRAINTS
-- Using GIN index for faster name searching if using trgm
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash) WHERE identity_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_device_lookup ON profiles(device_id, ip_hash);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_identity_hash_unique') THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_identity_hash_unique UNIQUE (identity_hash);
    END IF;
END $$;

-- 4. AUDIT & LOGGING
CREATE TABLE IF NOT EXISTS verification_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_hash TEXT,
    stage TEXT NOT NULL,
    result TEXT NOT NULL,
    score NUMERIC,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ADVANCED IDENTITY CHECK FUNCTION
CREATE OR REPLACE FUNCTION check_identity_uniqueness(
    p_name TEXT,
    p_dob TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    -- 1. Check for exact Name + DOB match (Stricter than ILIKE)
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE lower(full_name) = lower(p_name)
    AND (date_of_birth::text = p_dob)
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('unique', false, 'reason', 'IDENTITY_EXISTS');
    END IF;
    
    -- 2. Check device saturation (Anti-bot)
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE device_id = p_device_id AND verification_status = 'VERIFIED'
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('unique', false, 'reason', 'DEVICE_LIMIT_REACHED');
    END IF;
    
    RETURN jsonb_build_object('unique', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FINALIZATION LOGIC (The "Nuclear" Function)
CREATE OR REPLACE FUNCTION finalize_verification(
    p_user_id UUID,
    p_identity_hash TEXT,
    p_device_id TEXT,
    p_ocr_data JSONB,
    p_face_score NUMERIC,
    p_age_group TEXT
) RETURNS JSONB AS $$
DECLARE
    v_is_minor BOOLEAN;
    v_status TEXT;
BEGIN
    -- Final safety check for identity hash collision
    IF EXISTS (SELECT 1 FROM profiles WHERE identity_hash = p_identity_hash AND id != p_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Identity collision detected');
    END IF;

    v_is_minor := (p_age_group = '13-17');
    v_status := CASE WHEN v_is_minor THEN 'PENDING_GUARDIAN' ELSE 'VERIFIED' END;

    UPDATE profiles SET
        verification_status = v_status,
        trust_shield_status = v_status,
        identity_hash = p_identity_hash,
        device_id = p_device_id,
        verification_step = 5,
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        verification_metadata = jsonb_build_object(
            'face_score', p_face_score,
            'age_group', p_age_group,
            'verified_at', NOW()
        ),
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO verification_audit_trail (user_id, device_id, stage, result, score)
    VALUES (p_user_id, p_device_id, 'FINALIZATION', 'SUCCESS', p_face_score);

    RETURN jsonb_build_object('success', true, 'status', v_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
