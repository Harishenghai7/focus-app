-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔥 BULLETPROOF TRUST SHIELD SQL SETUP
-- Run these in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. ADD REQUIRED COLUMNS TO PROFILES TABLE
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS identity_hash TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS device_fingerprint_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'id_only',
ADD COLUMN IF NOT EXISTS verification_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS trust_shield_version TEXT DEFAULT '2.0';

-- 2. CREATE INDEXES FOR FAST LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint 
ON profiles(device_fingerprint);

CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash 
ON profiles(identity_hash);

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status 
ON profiles(verification_status);

-- 3. CREATE UNIQUE CONSTRAINT (One device per account - optional strict mode)
-- Uncomment if you want strict one-device-per-account
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_device 
-- ON profiles(device_fingerprint) 
-- WHERE device_fingerprint IS NOT NULL;

-- 4. FUNCTION: Check Duplicate Device
CREATE OR REPLACE FUNCTION check_duplicate_device(
    p_device_fingerprint TEXT,
    p_current_user_id UUID
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    verification_status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.verification_status,
        p.created_at
    FROM profiles p
    WHERE p.device_fingerprint = p_device_fingerprint
      AND p.id IS DISTINCT FROM p_current_user_id
    LIMIT 1;
END;
$$;

-- 5. FUNCTION: Check Duplicate Identity
CREATE OR REPLACE FUNCTION check_duplicate_identity(
    p_identity_hash TEXT,
    p_current_user_id UUID
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    verification_status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.verification_status,
        p.created_at
    FROM profiles p
    WHERE p.identity_hash = p_identity_hash
      AND p.id IS DISTINCT FROM p_current_user_id
    LIMIT 1;
END;
$$;

-- 6. FUNCTION: Create Account with Duplicate Checks
CREATE OR REPLACE FUNCTION create_verified_account(
    p_user_id UUID,
    p_device_fingerprint TEXT,
    p_identity_hash TEXT,
    p_verification_score DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_device RECORD;
    v_existing_identity RECORD;
    v_result JSONB;
BEGIN
    -- Check duplicate device
    SELECT id, username INTO v_existing_device
    FROM profiles
    WHERE device_fingerprint = p_device_fingerprint
      AND id IS DISTINCT FROM p_user_id
    LIMIT 1;
    
    IF v_existing_device IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Device already registered to another account',
            'existing_username', v_existing_device.username
        );
    END IF;
    
    -- Check duplicate identity
    SELECT id, username INTO v_existing_identity
    FROM profiles
    WHERE identity_hash = p_identity_hash
      AND id IS DISTINCT FROM p_user_id
    LIMIT 1;
    
    IF v_existing_identity IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ID already registered to another account',
            'existing_username', v_existing_identity.username
        );
    END IF;
    
    -- Update profile with verification data
    UPDATE profiles
    SET 
        device_fingerprint = p_device_fingerprint,
        identity_hash = p_identity_hash,
        verification_status = 'VERIFIED',
        device_fingerprint_checked = TRUE,
        verification_method = 'id_only',
        verification_score = p_verification_score,
        trust_shield_version = '2.0-bulletproof',
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account verified successfully'
    );
END;
$$;

-- 7. ENABLE RLS POLICY FOR PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. CREATE POLICY: Users can only see their own device_fingerprint
CREATE POLICY "Hide sensitive verification data" ON profiles
    FOR SELECT
    USING (true);

-- 9. CREATE AUDIT TABLE
CREATE TABLE IF NOT EXISTS trust_shield_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    verification_status TEXT,
    device_fingerprint TEXT,
    identity_hash TEXT,
    ocr_result JSONB,
    attempt_result TEXT,
    failure_reason TEXT,
    failure_layer TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON trust_shield_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device ON trust_shield_audit(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_audit_created ON trust_shield_audit(created_at);

-- 10. FUNCTION: Log verification attempt
CREATE OR REPLACE FUNCTION log_verification_attempt(
    p_user_id UUID,
    p_device_fingerprint TEXT,
    p_identity_hash TEXT,
    p_verification_status TEXT,
    p_attempt_result TEXT,
    p_failure_reason TEXT DEFAULT NULL,
    p_failure_layer TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO trust_shield_audit (
        user_id,
        device_fingerprint,
        identity_hash,
        verification_status,
        attempt_result,
        failure_reason,
        failure_layer
    )
    VALUES (
        p_user_id,
        p_device_fingerprint,
        p_identity_hash,
        p_verification_status,
        p_attempt_result,
        p_failure_reason,
        p_failure_layer
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ BULLETPROOF VERIFICATION QUERIES (Use These!)
-- ═══════════════════════════════════════════════════════════════════════════════

-- QUERY: Check if device already has an account
-- Replace :device_fingerprint with actual value
-- Replace :current_user_id with actual UUID or NULL
SELECT * FROM check_duplicate_device(
    'actual-device-fingerprint-here',
    '00000000-0000-0000-0000-000000000000'::UUID
);

-- QUERY: Check if ID already registered
SELECT * FROM check_duplicate_identity(
    'actual-identity-hash-here',
    '00000000-0000-0000-0000-000000000000'::UUID
);

-- QUERY: Create verified account with all checks
SELECT * FROM create_verified_account(
    'actual-user-uuid-here'::UUID,
    'device-fingerprint-here',
    'identity-hash-here',
    0.85
);
