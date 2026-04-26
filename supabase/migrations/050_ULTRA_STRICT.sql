-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 TRUST SHIELD ULTRA - STRICTEST SQL ENFORCEMENT
-- ONE GOVERNMENT ID = ONE PERSON = ONE ACCOUNT
-- ═══════════════════════════════════════════════════════════════════════════════

-- ============================================================================
-- ULTRA STRICT IDENTITY CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION check_identity_ultra(
    p_name TEXT,
    p_dob TEXT,
    p_id_number TEXT,
    p_device_id TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
    v_normalized_name TEXT;
    v_normalized_id TEXT;
    v_id_type TEXT;
BEGIN
    -- Normalize inputs for strict matching
    v_normalized_name := LOWER(REGEXP_REPLACE(COALESCE(p_name, ''), '[^a-zA-Z0-9]', '', 'g'));
    v_normalized_id := UPPER(REGEXP_REPLACE(COALESCE(p_id_number, ''), '[^A-Z0-9]', '', 'g'));
    
    -- Detect ID type
    IF v_normalized_id ~ '^[0-9]{12}$' THEN
        v_id_type := 'AADHAAR';
    ELSIF v_normalized_id ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' THEN
        v_id_type := 'PAN';
    ELSIF v_normalized_id ~ '^[A-Z][0-9]{7}$' THEN
        v_id_type := 'PASSPORT';
    ELSIF v_normalized_id ~ '^[A-Z]{3}[0-9]{7}$' THEN
        v_id_type := 'VOTER';
    ELSIF v_normalized_id ~ '^[A-Z]{2}[0-9]{13}$' THEN
        v_id_type := 'DRIVING_LICENSE';
    ELSE
        v_id_type := 'UNKNOWN';
    END IF;
    
    -- REJECT: Non-government ID
    IF v_id_type = 'UNKNOWN' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'INVALID_ID_TYPE',
            'message', '🔒 GOVERNMENT ID REQUIRED: Acceptable: Aadhaar (12 digits), PAN (ABCDE1234F), Passport (A1234567), Voter ID (ABC1234567)'
        );
    END IF;
    
    -- CHECK 1: Exact ID number match (strictest)
    IF LENGTH(v_normalized_id) > 0 THEN
        SELECT id INTO v_existing_id
        FROM profiles
        WHERE UPPER(REGEXP_REPLACE(COALESCE(identity_hash, ''), '[^A-Z0-9]', '', 'g')) = v_normalized_id
            AND (p_user_id IS NULL OR id != p_user_id)
            AND verification_status IN ('VERIFIED', 'PENDING_GUARDIAN')
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'valid', false,
                'reason', 'EXACT_ID_MATCH',
                'message', '🔒 ONE GOVERNMENT ID = ONE ACCOUNT: This ' || v_id_type || ' is already registered. Contact admin@focusapp.in to recover your account.',
                'id_type', v_id_type
            );
        END IF;
    END IF;
    
    -- CHECK 2: Name + DOB combination (strict match)
    IF LENGTH(v_normalized_name) > 0 AND LENGTH(COALESCE(p_dob, '')) > 0 THEN
        SELECT id INTO v_existing_id
        FROM profiles
        WHERE LOWER(REGEXP_REPLACE(COALESCE(full_name, ''), '[^a-zA-Z0-9]', '', 'g')) = v_normalized_name
            AND (
                COALESCE(date_of_birth::TEXT, '') = p_dob
                OR COALESCE(identity_metadata->>'dob', '') = p_dob
            )
            AND (p_user_id IS NULL OR id != p_user_id)
            AND verification_status IN ('VERIFIED', 'PENDING_GUARDIAN')
        LIMIT 1;
        
        IF v_existing_id IS NOT NULL THEN
            RETURN jsonb_build_object(
                'valid', false,
                'reason', 'NAME_DOB_MATCH',
                'message', '🔒 IDENTITY VERIFIED: Name and Date of Birth combination exists. Use your registered account.',
                'existing_user_id', v_existing_id
            );
        END IF;
    END IF;
    
    -- CHECK 3: Device saturation (anti-bot)
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE device_id = p_device_id
        AND verification_status = 'VERIFIED'
        AND (p_user_id IS NULL OR id != p_user_id)
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'reason', 'DEVICE_LIMIT_REACHED',
            'message', '🔒 DEVICE LOCKED: Verified account exists on this device. One device = One verified account.',
            'existing_user_id', v_existing_id
        );
    END IF;
    
    -- ALL CHECKS PASSED
    RETURN jsonb_build_object(
        'valid', true,
        'id_type', v_id_type,
        'normalized_id', v_normalized_id,
        'message', 'Identity is unique and valid'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ULTRA FINALIZATION - ATOMIC & STRICT
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_verification_ultra(
    p_user_id UUID,
    p_identity_hash TEXT,
    p_device_id TEXT,
    p_ocr_data JSONB,
    p_face_score NUMERIC,
    p_age_group TEXT,
    p_id_number TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_identity_check JSONB;
    v_is_minor BOOLEAN;
    v_status TEXT;
    v_id_type TEXT;
BEGIN
    -- PRE-CHECK: Identity must be unique
    v_identity_check := check_identity_ultra(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        COALESCE(p_id_number, p_identity_hash),
        p_device_id,
        p_user_id
    );
    
    IF NOT (v_identity_check->>'valid')::BOOLEAN THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', v_identity_check->>'reason',
            'error', v_identity_check->>'message',
            'id_type', v_identity_check->>'id_type'
        );
    END IF;
    
    v_id_type := COALESCE(v_identity_check->>'id_type', 'UNKNOWN');
    
    -- PRE-CHECK: Face score must be high
    IF p_face_score < 0.85 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_BIOMETRIC_LOW',
            'error', '🔒 BIOMETRIC VERIFICATION FAILED: Liveness score ' || ROUND(p_face_score::NUMERIC, 2) || ' is below required threshold (0.85). Complete all 3 challenges with proper lighting.',
            'score', p_face_score
        );
    END IF;
    
    -- PRE-CHECK: Required data present
    IF p_ocr_data IS NULL OR p_ocr_data->>'name' IS NULL OR p_ocr_data->>'dob' IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_INCOMPLETE_DATA',
            'error', '🔒 INCOMPLETE VERIFICATION: Name and Date of Birth are required from ID document.'
        );
    END IF;
    
    -- Calculate status
    v_is_minor := p_age_group = '13-17';
    v_status := CASE WHEN v_is_minor THEN 'PENDING_GUARDIAN' ELSE 'VERIFIED' END;
    
    -- ATOMIC UPDATE: All fields in single transaction
    UPDATE profiles SET
        -- Verification status (all three fields must match)
        verification_status = v_status,
        trust_shield_status = v_status,
        focus_trust_status = v_status,
        
        -- Identity lock
        identity_hash = UPPER(REGEXP_REPLACE(COALESCE(p_id_number, p_identity_hash), '[^A-Z0-9]', '', 'g')),
        
        -- Device binding
        device_id = p_device_id,
        device_fingerprint = p_device_id,
        
        -- Step completion
        verification_step = 5,
        verification_locked = FALSE,
        
        -- Metadata
        verification_metadata = jsonb_build_object(
            'ocr_data', p_ocr_data,
            'face_score', p_face_score,
            'age_group', p_age_group,
            'id_type', v_id_type,
            'verified_at', NOW(),
            'verification_method', 'trust_shield_ultra_v3',
            'strict_mode', true
        ),
        
        -- Account status
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        is_teen = v_is_minor,
        age_group = p_age_group,
        verified_at = NOW(),
        
        -- Timestamp
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Verify update occurred
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', '🔒 CRITICAL ERROR: Profile update failed. User not found or already modified.'
        );
    END IF;
    
    -- Audit trail
    INSERT INTO verification_audit_trail (
        user_id,
        device_id,
        ip_hash,
        stage,
        result,
        score,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        p_device_id,
        NULL,
        'ultra_finalization',
        'SUCCESS',
        p_face_score,
        'One Person = One Account enforced',
        jsonb_build_object(
            'id_type', v_id_type,
            'identity_hash', p_identity_hash,
            'age_group', p_age_group,
            'is_minor', v_is_minor,
            'strict_mode', true
        )
    );
    
    -- SUCCESS
    RETURN jsonb_build_object(
        'success', true,
        'verification_status', v_status,
        'is_minor', v_is_minor,
        'id_type', v_id_type,
        'message', '🔒 TRUST SHIELD VERIFIED: Your identity is locked. Welcome to Focus.',
        'strict_mode', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STRICT RLS POLICY - No Direct Updates Allowed
-- ============================================================================

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile (non-verification)" ON profiles;

-- Create ultra-strict policy: Only allow updates to non-verification fields
CREATE POLICY "profiles_ultra_policy"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        -- Prevent direct status changes
        AND verification_status IS NOT DISTINCT FROM (SELECT p2.verification_status FROM profiles p2 WHERE p2.id = auth.uid())
        AND trust_shield_status IS NOT DISTINCT FROM (SELECT p2.trust_shield_status FROM profiles p2 WHERE p2.id = auth.uid())
        AND focus_trust_status IS NOT DISTINCT FROM (SELECT p2.focus_trust_status FROM profiles p2 WHERE p2.id = auth.uid())
        AND identity_hash IS NOT DISTINCT FROM (SELECT p2.identity_hash FROM profiles p2 WHERE p2.id = auth.uid())
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_identity_ultra TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification_ultra TO authenticated;

-- Comments
COMMENT ON FUNCTION check_identity_ultra IS 'ULTRA: Strictest identity check - One Government ID = One Account';
COMMENT ON FUNCTION finalize_verification_ultra IS 'ULTRA: Atomic verification with strictest enforcement';
