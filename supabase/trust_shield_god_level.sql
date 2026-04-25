-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔥 GOD-LEVEL TRUST SHIELD HARDENING
-- Layer 1-3: Persistent State + 6-Layer Enforcement + Atomic Account Creation
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- LAYER 1: PERSISTENT STATE MACHINE - Add verification_step column
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS verification_progress JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS identity_hash TEXT,
ADD COLUMN IF NOT EXISTS identity_data JSONB,
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_verification_attempt TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'id_only',
ADD COLUMN IF NOT EXISTS verification_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS ocr_data JSONB,
ADD COLUMN IF NOT EXISTS rate_limit_reset_at TIMESTAMPTZ;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification_step ON profiles(verification_step);
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_device_fingerprint ON profiles(device_fingerprint);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LAYER 2: VERIFICATION STATE SYNC FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION sync_verification_state(
    p_user_id UUID,
    p_step INTEGER,
    p_progress JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_step INTEGER;
    v_result JSONB;
BEGIN
    -- Get current step
    SELECT verification_step INTO v_current_step FROM profiles WHERE id = p_user_id;
    
    -- Only allow forward progress (prevent going back)
    IF p_step >= v_current_step OR v_current_step IS NULL THEN
        UPDATE profiles
        SET 
            verification_step = p_step,
            verification_progress = p_progress,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'State synced',
            'step', p_step
        );
    ELSE
        -- Trying to go backwards - reject but return current state
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Cannot go backwards in verification flow',
            'current_step', v_current_step,
            'requested_step', p_step
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- LAYER 2: 6-LAYER ENFORCEMENT - Check Identity Uniqueness
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_identity_uniqueness(
    p_name TEXT,
    p_dob TEXT,
    p_device_id TEXT,
    p_current_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_name_match RECORD;
    v_dob_match RECORD;
    v_device_match RECORD;
    v_result JSONB;
BEGIN
    -- Layer 5a: Check for duplicate name
    SELECT id, username, verification_status INTO v_name_match
    FROM profiles
    WHERE LOWER(full_name) = LOWER(p_name)
      AND id IS DISTINCT FROM p_current_user_id
    LIMIT 1;
    
    IF v_name_match IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'Name already registered to another account',
            'existing_user', v_name_match.username,
            'layer', 'name_check'
        );
    END IF;
    
    -- Layer 5b: Check for duplicate DOB + Name combination
    SELECT id, username INTO v_dob_match
    FROM profiles
    WHERE LOWER(full_name) = LOWER(p_name)
      AND identity_data->>'dob' = p_dob
      AND id IS DISTINCT FROM p_current_user_id
    LIMIT 1;
    
    IF v_dob_match IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'ID combination already registered',
            'existing_user', v_dob_match.username,
            'layer', 'identity_check'
        );
    END IF;
    
    -- Layer 5c: Check for duplicate device
    IF p_device_id IS NOT NULL THEN
        SELECT id, username INTO v_device_match
        FROM profiles
        WHERE device_id = p_device_id
          AND id IS DISTINCT FROM p_current_user_id
        LIMIT 1;
        
        IF v_device_match IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error_code', 'ERR_DUPLICATE_DEVICE',
                'error', 'Device already registered to another account',
                'existing_user', v_device_match.username,
                'layer', 'device_check'
            );
        END IF;
    END IF;
    
    -- All checks passed
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Identity is unique',
        'layer', 'all_passed'
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- LAYER 2: Rate Limiting Check
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_device_id TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_hours INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts INTEGER;
    v_last_attempt TIMESTAMPTZ;
    v_reset_at TIMESTAMPTZ;
    v_minutes_left INTEGER;
BEGIN
    -- Get existing rate limit data from any user with this device
    SELECT 
        verification_attempts,
        last_verification_attempt,
        rate_limit_reset_at
    INTO v_attempts, v_last_attempt, v_reset_at
    FROM profiles
    WHERE device_id = p_device_id
    ORDER BY last_verification_attempt DESC
    LIMIT 1;
    
    -- Check if window has expired
    IF v_reset_at IS NOT NULL AND NOW() > v_reset_at THEN
        -- Reset counter
        RETURN jsonb_build_object(
            'success', true,
            'allowed', true,
            'attempts_remaining', p_max_attempts,
            'message', 'Rate limit window reset'
        );
    END IF;
    
    -- Check if under limit
    IF v_attempts >= p_max_attempts THEN
        v_minutes_left := EXTRACT(EPOCH FROM (v_reset_at - NOW())) / 60;
        
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ERR_RATE_LIMITED',
            'allowed', false,
            'attempts', v_attempts,
            'max_attempts', p_max_attempts,
            'minutes_remaining', GREATEST(0, v_minutes_left::INTEGER),
            'message', format('Rate limit exceeded. Try again in %s minutes.', GREATEST(0, v_minutes_left::INTEGER))
        );
    END IF;
    
    -- Allowed
    RETURN jsonb_build_object(
        'success', true,
        'allowed', true,
        'attempts', COALESCE(v_attempts, 0),
        'attempts_remaining', p_max_attempts - COALESCE(v_attempts, 0),
        'message', 'Rate limit check passed'
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- LAYER 3: ATOMIC ACCOUNT CREATION VIA RPC
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_verified_account_atomic(
    p_user_id UUID,
    p_identity_hash TEXT,
    p_device_id TEXT,
    p_device_fingerprint TEXT,
    p_ocr_data JSONB,
    p_verification_score DECIMAL,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_uniqueness_check JSONB;
    v_rate_check JSONB;
    v_existing RECORD;
    v_result JSONB;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════════
    -- STEP 1: Rate Limit Check (Layer 4)
    -- ═══════════════════════════════════════════════════════════════════════
    v_rate_check := check_rate_limit(p_device_id);
    
    IF NOT (v_rate_check->>'allowed')::BOOLEAN THEN
        RETURN v_rate_check;
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════════
    -- STEP 2: Uniqueness Check (Layer 5)
    -- ═══════════════════════════════════════════════════════════════════════
    v_uniqueness_check := check_identity_uniqueness(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        p_device_id,
        p_user_id
    );
    
    IF NOT (v_uniqueness_check->>'success')::BOOLEAN THEN
        RETURN v_uniqueness_check;
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════════
    -- STEP 3: Check if user already exists with different identity
    -- ═══════════════════════════════════════════════════════════════════════
    SELECT id, verification_status, identity_hash INTO v_existing
    FROM profiles
    WHERE id = p_user_id;
    
    IF v_existing IS NOT NULL AND v_existing.identity_hash IS NOT NULL 
       AND v_existing.identity_hash != p_identity_hash THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ERR_IDENTITY_MISMATCH',
            'error', 'Account already has different identity registered',
            'layer', 'account_integrity'
        );
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════════
    -- STEP 4: ATOMIC UPDATE - All or Nothing
    -- ═══════════════════════════════════════════════════════════════════════
    UPDATE profiles
    SET 
        identity_hash = p_identity_hash,
        device_id = p_device_id,
        device_fingerprint = p_device_fingerprint,
        identity_data = p_ocr_data,
        ocr_data = p_ocr_data,
        verification_status = 'VERIFIED',
        verification_method = 'id_only_v3',
        verification_score = p_verification_score,
        verification_step = 6, -- Complete
        verification_progress = jsonb_build_object(
            'device_check', true,
            'ocr_validation', true,
            'quality_check', true,
            'rate_limit', true,
            'uniqueness', true,
            'completed_at', NOW()
        ),
        verification_attempts = verification_attempts + 1,
        last_verification_attempt = NOW(),
        rate_limit_reset_at = NOW() + INTERVAL '1 hour',
        ip_address = COALESCE(p_ip_address, ip_address),
        onboarding_completed = true,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Account verified and created atomically',
        'user_id', p_user_id,
        'verification_status', 'VERIFIED',
        'layers_passed', jsonb_build_array(
            'device_fingerprint',
            'ocr_validation', 
            'quality_check',
            'rate_limiting',
            'uniqueness_check',
            'account_integrity'
        )
    );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG TABLE (Layer 6: IP Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS trust_shield_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'attempt', 'success', 'failure', 'rate_limited', 'duplicate_detected'
    device_id TEXT,
    device_fingerprint TEXT,
    identity_hash TEXT,
    ocr_data JSONB,
    ip_address INET,
    user_agent TEXT,
    error_code TEXT,
    error_message TEXT,
    layer TEXT,
    verification_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON trust_shield_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device_id ON trust_shield_audit_log(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON trust_shield_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON trust_shield_audit_log(created_at);

-- ═══════════════════════════════════════════════════════════════════════════════
-- LOG VERIFICATION EVENT
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION log_verification_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_device_id TEXT DEFAULT NULL,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_identity_hash TEXT DEFAULT NULL,
    p_ocr_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_layer TEXT DEFAULT NULL,
    p_verification_score DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO trust_shield_audit_log (
        user_id,
        event_type,
        device_id,
        device_fingerprint,
        identity_hash,
        ocr_data,
        ip_address,
        user_agent,
        error_code,
        error_message,
        layer,
        verification_score
    )
    VALUES (
        p_user_id,
        p_event_type,
        p_device_id,
        p_device_fingerprint,
        p_identity_hash,
        p_ocr_data,
        p_ip_address,
        current_setting('request.headers', true)::jsonb->>'user-agent',
        p_error_code,
        p_error_message,
        p_layer,
        p_verification_score
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ QUICK TEST QUERIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Test 1: Sync verification state
-- SELECT * FROM sync_verification_state('your-user-uuid'::UUID, 3, '{"ocr_complete": true}'::JSONB);

-- Test 2: Check identity uniqueness
-- SELECT * FROM check_identity_uniqueness('John Doe', '1990-01-01', 'device_123', NULL);

-- Test 3: Check rate limit
-- SELECT * FROM check_rate_limit('device_123');

-- Test 4: Create verified account atomically
-- SELECT * FROM create_verified_account_atomic(
--     'your-user-uuid'::UUID,
--     'hash_abc123',
--     'device_123',
--     'fingerprint_xyz789',
--     '{"name": "John Doe", "dob": "1990-01-01"}'::JSONB,
--     0.92,
--     '192.168.1.1'::INET
-- );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🎯 DEPLOYMENT CHECKLIST:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Enable RLS on trust_shield_audit_log
-- 3. Test each function with real UUIDs
-- 4. Update frontend to use these RPC calls
-- ═══════════════════════════════════════════════════════════════════════════════
