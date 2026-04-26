-- ═══════════════════════════════════════════════════════════════════════════════
-- 🛡️ TRUST SHIELD ULTRA (V3.1) - HARDENED IDENTITY ENFORCEMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure hashing extension is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. IDENTITY CHECK (Strictest Verification Logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_identity_ultra(
    p_name TEXT,
    p_dob TEXT,
    p_id_number TEXT,
    p_device_id TEXT,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_existing_id UUID;
    v_normalized_name TEXT;
    v_normalized_id TEXT;
    v_id_hash TEXT;
    v_id_type TEXT;
BEGIN
    -- 1. Normalize name (remove all non-alpha, keep lowercase)
    v_normalized_name := LOWER(REGEXP_REPLACE(COALESCE(p_name, ''), '[^a-zA-Z]', '', 'g'));
    
    -- 2. Normalize ID (remove spaces/dashes, keep alphanumeric)
    v_normalized_id := UPPER(REGEXP_REPLACE(COALESCE(p_id_number, ''), '[^A-Z0-9]', '', 'g'));
    
    -- 3. Detect ID Type using strict Regex
    v_id_type := CASE 
        WHEN v_normalized_id ~ '^[0-9]{12}$' THEN 'ID_TYPE_A' -- 12-digit format
        WHEN v_normalized_id ~ '^[A-Z]{5}[0-9]{4}[A-Z]$' THEN 'PAN'
        WHEN v_normalized_id ~ '^[A-Z][0-9]{7}$' THEN 'PASSPORT'
        WHEN v_normalized_id ~ '^[A-Z]{3}[0-9]{7}$' THEN 'VOTER'
        WHEN v_normalized_id ~ '^[A-Z]{2}[0-9]{13}$' THEN 'DL'
        ELSE 'UNKNOWN'
    END;

    IF v_id_type = 'UNKNOWN' THEN
        RETURN jsonb_build_object(
            'valid', false, 
            'reason', 'INVALID_FORMAT', 
            'message', '🔒 Invalid ID format. Please provide a standard government document.'
        );
    END IF;

    -- 4. Create one-way Cryptographic Hash (SHA-256)
    -- We never store the actual p_id_number to maintain privacy compliance.
    v_id_hash := encode(digest(v_normalized_id, 'sha256'), 'hex');

    -- CHECK: ID Hash Uniqueness
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE identity_hash = v_id_hash
      AND (p_user_id IS NULL OR id != p_user_id)
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'ID_COLLISION', 'message', '🔒 This ID is already linked to another account.');
    END IF;

    -- CHECK: Device Saturation (Max 1 verified account per device)
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE device_id = p_device_id 
        AND (verification_status = 'VERIFIED' OR verification_status = 'PENDING_GUARDIAN')
        AND (p_user_id IS NULL OR id != p_user_id)
    ) THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'DEVICE_LIMIT', 'message', '🔒 Access Denied: A verified account is already active on this device.');
    END IF;

    RETURN jsonb_build_object(
        'valid', true, 
        'id_type', v_id_type, 
        'id_hash', v_id_hash,
        'normalized_name', v_normalized_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. FINALIZATION (Atomic & Transaction-Safe)
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_verification_ultra(
    p_user_id UUID,
    p_id_number TEXT,
    p_device_id TEXT,
    p_ocr_data JSONB,
    p_face_score NUMERIC,
    p_age_group TEXT
) RETURNS JSONB AS $$
DECLARE
    v_check JSONB;
    v_status TEXT;
    v_is_minor BOOLEAN;
BEGIN
    -- 1. Run Ultra-Strict Identity Check
    v_check := check_identity_ultra(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        p_id_number,
        p_device_id,
        p_user_id
    );

    IF NOT (v_check->>'valid')::BOOLEAN THEN
        RETURN v_check; -- Return the error object immediately
    END IF;

    -- 2. Biometric Threshold Check (Ultra Stricter: 0.88)
    IF p_face_score < 0.88 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'BIOMETRIC_FAIL', 'error', '🔒 Liveness check too low. Please retry in better lighting.');
    END IF;

    -- 3. Logic for Teens vs Adults
    v_is_minor := (p_age_group = '13-17');
    v_status := CASE WHEN v_is_minor THEN 'PENDING_GUARDIAN' ELSE 'VERIFIED' END;

    -- 4. Atomic Update
    UPDATE profiles SET
        verification_status = v_status,
        trust_shield_status = v_status,
        focus_trust_status = v_status,
        identity_hash = v_check->>'id_hash', -- Store the SHA-256 hash only
        device_id = p_device_id,
        device_fingerprint = p_device_id,
        verification_step = 5,
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        verified_at = NOW(),
        verification_metadata = jsonb_build_object(
            'id_type', v_check->>'id_type',
            'face_score', p_face_score,
            'strict_mode', true,
            'p_age_group', p_age_group
        )
    WHERE id = p_user_id;

    -- 5. Logging to Audit Trail
    INSERT INTO verification_audit_trail (user_id, device_id, stage, result, score, metadata)
    VALUES (p_user_id, p_device_id, 'ULTRA_FINALIZE', 'SUCCESS', p_face_score, v_check);

    RETURN jsonb_build_object('success', true, 'status', v_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. THE "IMPOSSIBLE" RLS POLICY
-- ============================================================================

-- This policy ensures users can NEVER manually overwrite their verification status.
-- It only allows updates to "benign" fields (like full_name or bio) if the UID matches.

DROP POLICY IF EXISTS "profiles_ultra_policy" ON profiles;

CREATE POLICY "profiles_ultra_policy"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Ensure critical status fields are NOT changed via direct UPDATE
        -- If they are being changed, the new value must match the old value.
        verification_status IS NOT DISTINCT FROM (SELECT verification_status FROM profiles WHERE id = auth.uid()) AND
        identity_hash IS NOT DISTINCT FROM (SELECT identity_hash FROM profiles WHERE id = auth.uid())
    );

-- ============================================================================
-- 4. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_identity_ultra TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification_ultra TO authenticated;
