-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 GOD-LEVEL TRUST SHIELD SCHEMA - Sovereign Architect Edition
-- Layer 1-4: Persistent State + 6-Layer Enforcement + Atomic Account Creation
-- BULLETPROOF VERSION - Run this entire file in ONE transaction
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: CREATE AUDIT TRAIL TABLE FIRST (Referenced by functions)
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- Indexes for audit trail queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON verification_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device_id ON verification_audit_trail(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip_hash ON verification_audit_trail(ip_hash);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON verification_audit_trail(created_at);

-- Enable RLS on audit table
ALTER TABLE verification_audit_trail ENABLE ROW LEVEL SECURITY;

-- Only allow system to insert, users can only view their own
CREATE POLICY "Users can view own audit trail"
    ON verification_audit_trail FOR SELECT
    USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: ADD COLUMNS TO PROFILES TABLE (All columns before functions)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add all verification columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verification_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS ip_hash TEXT,
ADD COLUMN IF NOT EXISTS identity_hash TEXT,
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint separately (safer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_identity_hash_key' 
        AND conrelid = 'profiles'::regclass
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_identity_hash_key UNIQUE (identity_hash);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Create index for device-based rate limiting queries
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ip_hash ON profiles(ip_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash) WHERE identity_hash IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: CREATE RATE LIMITING VIEW (After tables exist)
-- ═══════════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: CREATE FUNCTIONS (After all tables/columns exist)
-- ═══════════════════════════════════════════════════════════════════════════════

-- LAYER 2.5: IDENTITY UNIQUENESS CHECK FUNCTION
CREATE OR REPLACE FUNCTION check_identity_uniqueness(
    p_name TEXT,
    p_dob TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
    v_existing_device TEXT;
BEGIN
    -- Check for existing identity by normalized name + DOB
    SELECT id, device_id 
    INTO v_existing_id, v_existing_device
    FROM profiles
    WHERE (
        -- Normalize and compare name + DOB combination
        LOWER(REPLACE(REPLACE(COALESCE(full_name, ''), ' ', ''), '-', '')) = 
        LOWER(REPLACE(REPLACE(p_name, ' ', ''), '-', ''))
        AND (
            COALESCE(identity_metadata->>'dob', '') = p_dob
            OR COALESCE(date_of_birth::text, '') = p_dob
        )
    )
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        v_result := jsonb_build_object(
            'unique', false,
            'existing_user_id', v_existing_id,
            'reason', 'IDENTITY_EXISTS',
            'message', 'This identity is already registered'
        );
        RETURN v_result;
    END IF;
    
    -- Check for device-level duplicate (prevent multi-accounting)
    SELECT id 
    INTO v_existing_id
    FROM profiles
    WHERE device_id = p_device_id
        AND verification_status = 'VERIFIED'
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        v_result := jsonb_build_object(
            'unique', false,
            'existing_user_id', v_existing_id,
            'reason', 'DEVICE_EXISTS',
            'message', 'A verified account already exists on this device'
        );
        RETURN v_result;
    END IF;
    
    -- Identity is unique
    v_result := jsonb_build_object(
        'unique', true,
        'existing_user_id', null,
        'reason', null
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- LAYER 2.6: SUSPICIOUS ACTIVITY DETECTION
CREATE OR REPLACE FUNCTION check_suspicious_activity(
    p_ip_hash TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_attempt_count INTEGER;
    v_unique_devices INTEGER;
    v_time_window TIMESTAMPTZ;
BEGIN
    v_time_window := NOW() - INTERVAL '1 hour';
    
    -- Count attempts from this IP in last hour
    SELECT COUNT(*) 
    INTO v_attempt_count
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
        AND created_at > v_time_window;
    
    -- Count unique devices from this IP
    SELECT COUNT(DISTINCT device_id)
    INTO v_unique_devices
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
        AND created_at > v_time_window;
    
    -- Suspicious if > 5 attempts or > 2 devices from same IP
    IF v_attempt_count > 5 OR v_unique_devices > 2 THEN
        v_result := jsonb_build_object(
            'is_suspicious', true,
            'reason', CASE 
                WHEN v_attempt_count > 5 THEN 'EXCESSIVE_ATTEMPTS'
                ELSE 'MULTI_DEVICE_FRAUD'
            END,
            'attempt_count', v_attempt_count,
            'unique_devices', v_unique_devices
        );
    ELSE
        v_result := jsonb_build_object(
            'is_suspicious', false,
            'attempt_count', v_attempt_count,
            'unique_devices', v_unique_devices
        );
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- LAYER 3: ATOMIC ACCOUNT CREATION - finalize_verification RPC
CREATE OR REPLACE FUNCTION finalize_verification(
    p_user_id UUID,
    p_identity_hash TEXT,
    p_device_id TEXT,
    p_ocr_data JSONB,
    p_face_score NUMERIC,
    p_age_group TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_hash UUID;
    v_is_minor BOOLEAN;
    v_verification_status TEXT;
    v_uniqueness_check JSONB;
BEGIN
    -- PHASE 1: DUPLICATE CHECK (CRITICAL - One Person = One Account)
    
    -- Check if identity hash already exists (excluding current user)
    SELECT id INTO v_existing_hash
    FROM profiles
    WHERE identity_hash = p_identity_hash
        AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_hash IS NOT NULL THEN
        v_result := jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'This identity is already registered to another account'
        );
        RETURN v_result;
    END IF;
    
    -- Run full uniqueness check
    v_uniqueness_check := check_identity_uniqueness(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        p_device_id
    );
    
    IF NOT (v_uniqueness_check->>'unique')::boolean THEN
        v_result := jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', v_uniqueness_check->>'message'
        );
        RETURN v_result;
    END IF;
    
    -- PHASE 2: VALIDATION
    
    -- Validate face score
    IF p_face_score < 0.5 THEN
        v_result := jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
        RETURN v_result;
    END IF;
    
    -- Determine verification status based on age group
    v_is_minor := p_age_group = '13-17';
    v_verification_status := CASE 
        WHEN v_is_minor THEN 'PENDING_GUARDIAN'
        ELSE 'VERIFIED'
    END;
    
    -- PHASE 3: ATOMIC UPDATE
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
            'verified_at', NOW(),
            'verification_method', 'trust_shield_v2'
        ),
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Verify update succeeded
    IF NOT FOUND THEN
        v_result := jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Failed to update profile'
        );
        RETURN v_result;
    END IF;
    
    -- PHASE 4: AUDIT LOG
    INSERT INTO verification_audit_trail (
        user_id,
        device_id,
        stage,
        result,
        score,
        metadata
    ) VALUES (
        p_user_id,
        p_device_id,
        'trust_shield_complete',
        'VERIFIED',
        p_face_score,
        jsonb_build_object(
            'identity_hash', p_identity_hash,
            'ocr_data', p_ocr_data,
            'age_group', p_age_group,
            'is_minor', v_is_minor
        )
    );
    
    -- Success
    v_result := jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor,
        'user_id', p_user_id
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 5: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure profiles table has proper RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile (non-verification)" ON profiles;

-- Policy: Users can only update their own non-critical fields
CREATE POLICY "Users can update own profile (non-verification)"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND verification_status IS NOT DISTINCT FROM (SELECT verification_status FROM profiles WHERE id = auth.uid())
        AND identity_hash IS NOT DISTINCT FROM (SELECT identity_hash FROM profiles WHERE id = auth.uid())
    );

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 6: TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to auto-update attempt count
CREATE OR REPLACE FUNCTION update_verification_attempt_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_verification_attempt := NOW();
    NEW.verification_attempt_count := COALESCE(NEW.verification_attempt_count, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Increment attempt count on verification_step change
DROP TRIGGER IF EXISTS trg_verification_attempt ON profiles;
CREATE TRIGGER trg_verification_attempt
    BEFORE UPDATE OF verification_step ON profiles
    FOR EACH ROW
    WHEN (OLD.verification_step IS DISTINCT FROM NEW.verification_step)
    EXECUTE FUNCTION update_verification_attempt_count();

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 7: GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION check_identity_uniqueness TO authenticated;
GRANT EXECUTE ON FUNCTION check_suspicious_activity TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification TO authenticated;
GRANT SELECT ON verification_rate_limits TO authenticated;

-- Comments
COMMENT ON FUNCTION check_identity_uniqueness IS 'Layer 2.5: Validates that identity is not already registered';
COMMENT ON FUNCTION check_suspicious_activity IS 'Layer 2.6: Detects automated bypass attempts';
COMMENT ON FUNCTION finalize_verification IS 'Layer 3: ATOMIC account verification - ONLY way to become verified';
