-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 TRUST SHIELD - FINAL BULLETPROOF SQL
-- Copy this ENTIRE file into Supabase SQL Editor and click RUN ONCE
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- STEP 1: ADD COLUMNS TO PROFILES (One at a time, will skip if exists)
-- ============================================================================

-- Add verification_step column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS verification_step INTEGER DEFAULT 1;

-- Add verification_locked column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS verification_locked BOOLEAN DEFAULT FALSE;

-- Add locked_at column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Add device_id column (the one that was missing)
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add device_fingerprint column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Add ip_hash column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Add identity_hash column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS identity_hash TEXT;

-- Add last_verification_attempt column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ;

-- Add verification_attempt_count column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS verification_attempt_count INTEGER DEFAULT 0;

-- Add verification_metadata column
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS verification_metadata JSONB DEFAULT '{}'::jsonb;

-- Add identity_metadata column (for backward compatibility)
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS identity_metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- STEP 2: ADD UNIQUE CONSTRAINT (safely)
-- ============================================================================

ALTER TABLE IF EXISTS profiles 
ADD CONSTRAINT IF NOT EXISTS profiles_identity_hash_unique 
UNIQUE (identity_hash);

-- ============================================================================
-- STEP 3: CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ip_hash ON profiles(ip_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash) WHERE identity_hash IS NOT NULL;

-- ============================================================================
-- STEP 4: ENABLE RLS ON PROFILES
-- ============================================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE AUDIT TABLE
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON verification_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device_id ON verification_audit_trail(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip_hash ON verification_audit_trail(ip_hash);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON verification_audit_trail(created_at);

ALTER TABLE IF EXISTS verification_audit_trail ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RATE LIMIT VIEW
-- ============================================================================

CREATE OR REPLACE VIEW verification_rate_limits AS
SELECT 
    device_id,
    ip_hash,
    COUNT(*) as attempt_count,
    MAX(created_at) as last_attempt,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as hourly_attempts
FROM verification_audit_trail
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY device_id, ip_hash;

-- ============================================================================
-- STEP 7: CREATE FUNCTIONS
-- ============================================================================

-- Function 1: Check identity uniqueness
CREATE OR REPLACE FUNCTION check_identity_uniqueness(
    p_name TEXT,
    p_dob TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_existing_id UUID;
BEGIN
    -- Check name + DOB
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE LOWER(COALESCE(full_name, '')) = LOWER(COALESCE(p_name, ''))
    AND (
        COALESCE(identity_metadata->>'dob', '') = COALESCE(p_dob, '')
        OR COALESCE(date_of_birth::text, '') = COALESCE(p_dob, '')
    )
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'unique', false,
            'reason', 'IDENTITY_EXISTS',
            'message', 'This identity is already registered'
        );
    END IF;
    
    -- Check device
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE device_id = p_device_id
    AND verification_status = 'VERIFIED'
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'unique', false,
            'reason', 'DEVICE_EXISTS',
            'message', 'A verified account already exists on this device'
        );
    END IF;
    
    RETURN jsonb_build_object('unique', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Check suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity(
    p_ip_hash TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_attempt_count INTEGER;
    v_unique_devices INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_attempt_count
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
    AND created_at > NOW() - INTERVAL '1 hour';
    
    SELECT COUNT(DISTINCT device_id) INTO v_unique_devices
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_attempt_count > 5 OR v_unique_devices > 2 THEN
        RETURN jsonb_build_object(
            'is_suspicious', true,
            'reason', CASE WHEN v_attempt_count > 5 THEN 'EXCESSIVE_ATTEMPTS' ELSE 'MULTI_DEVICE_FRAUD' END,
            'attempt_count', v_attempt_count,
            'unique_devices', v_unique_devices
        );
    END IF;
    
    RETURN jsonb_build_object('is_suspicious', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Finalize verification (ATOMIC)
CREATE OR REPLACE FUNCTION finalize_verification(
    p_user_id UUID,
    p_identity_hash TEXT,
    p_device_id TEXT,
    p_ocr_data JSONB,
    p_face_score NUMERIC,
    p_age_group TEXT
) RETURNS JSONB AS $$
DECLARE
    v_existing_hash UUID;
    v_is_minor BOOLEAN;
    v_verification_status TEXT;
BEGIN
    -- Check duplicate
    SELECT id INTO v_existing_hash
    FROM profiles
    WHERE identity_hash = p_identity_hash
    AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_hash IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'This identity is already registered'
        );
    END IF;
    
    -- Check face score
    IF p_face_score < 0.5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
    END IF;
    
    v_is_minor := p_age_group = '13-17';
    v_verification_status := CASE WHEN v_is_minor THEN 'PENDING_GUARDIAN' ELSE 'VERIFIED' END;
    
    -- Atomic update
    UPDATE profiles SET
        verification_status = v_verification_status,
        trust_shield_status = v_verification_status,
        focus_trust_status = v_verification_status,
        verification_step = 5,
        verification_locked = FALSE,
        identity_hash = p_identity_hash,
        device_id = p_device_id,
        device_fingerprint = p_device_id,
        verification_metadata = jsonb_build_object(
            'ocr_data', p_ocr_data,
            'face_score', p_face_score,
            'age_group', p_age_group,
            'verified_at', NOW()
        ),
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Profile not found'
        );
    END IF;
    
    -- Audit log
    INSERT INTO verification_audit_trail (
        user_id, device_id, stage, result, score, metadata
    ) VALUES (
        p_user_id, p_device_id, 'trust_shield_complete', 'VERIFIED', p_face_score,
        jsonb_build_object('identity_hash', p_identity_hash, 'age_group', p_age_group)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: RLS POLICIES
-- ============================================================================

-- Drop existing policies (ignore errors if don't exist)
DROP POLICY IF EXISTS "Users can update own profile (non-verification)" ON profiles;
DROP POLICY IF EXISTS "Users can view own audit trail" ON verification_audit_trail;

-- Create new policies
CREATE POLICY "Users can update own profile (non-verification)"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own audit trail"
    ON verification_audit_trail FOR SELECT
    USING (user_id = auth.uid());

-- ============================================================================
-- STEP 9: GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_identity_uniqueness TO authenticated;
GRANT EXECUTE ON FUNCTION check_suspicious_activity TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification TO authenticated;
GRANT SELECT ON verification_rate_limits TO authenticated;
