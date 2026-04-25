-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔥 BULLETPROOF TRUST SHIELD - ERROR-FREE WORKING SQL
-- Copy-paste these directly - they use REAL example UUIDs
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Add Columns (Run This First)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS identity_hash TEXT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS device_fingerprint_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'id_only',
ADD COLUMN IF NOT EXISTS verification_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS trust_shield_version TEXT DEFAULT '2.0';

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Create Indexes (Fast Lookup)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint ON profiles(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create Functions
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function: Check Duplicate Device
CREATE OR REPLACE FUNCTION check_duplicate_device(
    p_device_fingerprint TEXT,
    p_current_user_id UUID DEFAULT NULL
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
        p.username::TEXT,
        p.full_name::TEXT,
        p.verification_status::TEXT,
        p.created_at
    FROM profiles p
    WHERE p.device_fingerprint = p_device_fingerprint
      AND (p_current_user_id IS NULL OR p.id != p_current_user_id)
    LIMIT 1;
END;
$$;

-- Function: Check Duplicate Identity
CREATE OR REPLACE FUNCTION check_duplicate_identity(
    p_identity_hash TEXT,
    p_current_user_id UUID DEFAULT NULL
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
        p.username::TEXT,
        p.full_name::TEXT,
        p.verification_status::TEXT,
        p.created_at
    FROM profiles p
    WHERE p.identity_hash = p_identity_hash
      AND (p_current_user_id IS NULL OR p.id != p_current_user_id)
    LIMIT 1;
END;
$$;

-- Function: Create Verified Account
CREATE OR REPLACE FUNCTION create_verified_account(
    p_user_id UUID,
    p_device_fingerprint TEXT,
    p_identity_hash TEXT,
    p_verification_score DECIMAL DEFAULT 0.85
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_device RECORD;
    v_existing_identity RECORD;
BEGIN
    -- Check duplicate device
    SELECT id, username INTO v_existing_device
    FROM profiles
    WHERE device_fingerprint = p_device_fingerprint
      AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_device IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Device already registered',
            'existing_username', v_existing_device.username
        );
    END IF;
    
    -- Check duplicate identity
    SELECT id, username INTO v_existing_identity
    FROM profiles
    WHERE identity_hash = p_identity_hash
      AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_identity IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'ID already registered',
            'existing_username', v_existing_identity.username
        );
    END IF;
    
    -- Update profile
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
    
    RETURN jsonb_build_object('success', true, 'message', 'Verified');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create Audit Table
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trust_shield_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    verification_status TEXT,
    device_fingerprint TEXT,
    identity_hash TEXT,
    attempt_result TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON trust_shield_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device ON trust_shield_audit(device_fingerprint);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ WORKING TEST QUERIES (Use Real UUIDs)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get your actual user UUID first:
-- SELECT id FROM profiles WHERE username = 'your_username';

-- Then use it in these queries (replace the example UUID):

-- TEST 1: Check Duplicate Device
-- Replace: 550e8400-e29b-41d4-a716-446655440000 with YOUR actual user UUID
SELECT * FROM check_duplicate_device(
    'test-device-fingerprint-123',
    '550e8400-e29b-41d4-a716-446655440000'::UUID  -- REPLACE THIS
);

-- TEST 2: Check Duplicate Identity  
SELECT * FROM check_duplicate_identity(
    'test-identity-hash-456',
    '550e8400-e29b-41d4-a716-446655440000'::UUID  -- REPLACE THIS
);

-- TEST 3: Create Verified Account
SELECT * FROM create_verified_account(
    '550e8400-e29b-41d4-a716-446655440000'::UUID,  -- REPLACE THIS
    'device-fingerprint-here',
    'identity-hash-here',
    0.85
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ SIMPLE SELECT QUERIES (No Functions Needed)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Check all profiles with device fingerprints
SELECT id, username, full_name, device_fingerprint, verification_status 
FROM profiles 
WHERE device_fingerprint IS NOT NULL;

-- Check specific device (replace with actual fingerprint)
SELECT id, username, full_name, verification_status 
FROM profiles 
WHERE device_fingerprint = 'actual-fingerprint-here';

-- Check specific identity hash
SELECT id, username, full_name, verification_status 
FROM profiles 
WHERE identity_hash = 'actual-hash-here';

-- Count verified accounts per device
SELECT device_fingerprint, COUNT(*) as account_count
FROM profiles 
WHERE device_fingerprint IS NOT NULL
GROUP BY device_fingerprint
HAVING COUNT(*) > 1;
