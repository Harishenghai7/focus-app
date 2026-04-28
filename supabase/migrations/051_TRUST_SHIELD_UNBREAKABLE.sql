-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 TRUST SHIELD UNBREAKABLE - Aadhaar & Student ID Deduplication
-- ONE ID = ONE ACCOUNT - Bulletproof Implementation
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add columns to store raw ID numbers for duplicate detection
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS id_type TEXT, -- 'aadhaar', 'pan', 'passport', 'voter', 'dl', 'school', 'college'
ADD COLUMN IF NOT EXISTS id_number_hash TEXT UNIQUE; -- Hashed for privacy, UNIQUE for dedup

-- Create index for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_profiles_id_number_hash ON profiles(id_number_hash) WHERE id_number_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_id_type ON profiles(id_type) WHERE id_type IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Check if ID already exists (for early detection at Step 1)
-- Returns existing user info so we can redirect with alert
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_id_duplicate(
    p_id_number TEXT,
    p_id_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing RECORD;
    v_id_hash TEXT;
BEGIN
    -- Validate input
    IF p_id_number IS NULL OR LENGTH(TRIM(p_id_number)) < 4 THEN
        RETURN jsonb_build_object(
            'exists', false,
            'error', 'Invalid ID number provided'
        );
    END IF;
    
    -- Compute hash of the ID number (consistent with how we store it)
    v_id_hash := encode(digest(lower(regexp_replace(p_id_number, '\s', '', 'g')), 'sha256'), 'hex');
    
    -- Check if this ID already exists
    SELECT id, full_name, verification_status, created_at
    INTO v_existing
    FROM profiles
    WHERE id_number_hash = v_id_hash
    LIMIT 1;
    
    IF v_existing IS NOT NULL THEN
        v_result := jsonb_build_object(
            'exists', true,
            'existing_user_id', v_existing.id,
            'existing_user_name', v_existing.full_name,
            'verification_status', v_existing.verification_status,
            'created_at', v_existing.created_at,
            'message', 'This ID is already registered to another account. One ID can only be used for one Focus account.',
            'redirect_to', '/auth',
            'alert_type', 'ID_ALREADY_REGISTERED'
        );
        RETURN v_result;
    END IF;
    
    -- ID is unique
    RETURN jsonb_build_object(
        'exists', false,
        'message', 'ID is available for registration'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Store ID number with hash (called during verification)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION store_id_number(
    p_user_id UUID,
    p_id_number TEXT,
    p_id_type TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_id_hash TEXT;
    v_existing_id UUID;
BEGIN
    -- Validate
    IF p_id_number IS NULL OR LENGTH(TRIM(p_id_number)) < 4 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid ID number'
        );
    END IF;
    
    -- Compute hash
    v_id_hash := encode(digest(lower(regexp_replace(p_id_number, '\s', '', 'g')), 'sha256'), 'hex');
    
    -- Check if already exists (excluding current user)
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE id_number_hash = v_id_hash
        AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This ID is already registered to another account',
            'code', 'ERR_DUPLICATE_ID'
        );
    END IF;
    
    -- Store the ID (hash is UNIQUE, raw is stored masked for display)
    UPDATE profiles SET
        id_number = CASE 
            WHEN p_id_type = 'aadhaar' THEN 'XXXX-XXXX-' || RIGHT(p_id_number, 4)
            ELSE LEFT(p_id_number, 4) || '...' || RIGHT(p_id_number, 4)
        END,
        id_type = p_id_type,
        id_number_hash = v_id_hash,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'ID stored successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Enhanced finalize_verification with ID storage
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION finalize_verification_v2(
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
    v_id_number TEXT;
    v_id_type TEXT;
    v_id_store_result JSONB;
BEGIN
    -- Extract ID info from OCR data
    v_id_number := p_ocr_data->>'idNumber';
    v_id_type := COALESCE(p_ocr_data->>'idType', 'unknown');
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- PHASE 1: DUPLICATE CHECK (CRITICAL - One Person = One Account)
    -- ═══════════════════════════════════════════════════════════════════════════
    
    -- Check if identity hash already exists
    SELECT id INTO v_existing_hash
    FROM profiles
    WHERE identity_hash = p_identity_hash
        AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_hash IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'This identity is already registered to another account'
        );
    END IF;
    
    -- Check ID number duplicate if available
    IF v_id_number IS NOT NULL AND v_id_type IS NOT NULL THEN
        v_id_store_result := store_id_number(p_user_id, v_id_number, v_id_type);
        IF NOT (v_id_store_result->>'success')::boolean THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', v_id_store_result->>'code',
                'error', v_id_store_result->>'error'
            );
        END IF;
    END IF;
    
    -- Run full uniqueness check
    v_uniqueness_check := check_identity_uniqueness(
        p_ocr_data->>'name',
        p_ocr_data->>'dob',
        p_device_id
    );
    
    IF NOT (v_uniqueness_check->>'unique')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', v_uniqueness_check->>'message'
        );
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- PHASE 2: VALIDATION
    -- ═══════════════════════════════════════════════════════════════════════════
    
    -- Validate face score
    IF p_face_score < 0.5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
    END IF;
    
    -- Determine verification status
    v_is_minor := p_age_group = '13-17';
    v_verification_status := CASE 
        WHEN v_is_minor THEN 'PENDING_GUARDIAN'
        ELSE 'VERIFIED'
    END;
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- PHASE 3: ATOMIC UPDATE
    -- ═══════════════════════════════════════════════════════════════════════════
    
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
            'verification_method', 'trust_shield_v3',
            'id_type', v_id_type,
            'id_stored', v_id_number IS NOT NULL
        ),
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Verify update succeeded
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Failed to update profile'
        );
    END IF;
    
    -- ═══════════════════════════════════════════════════════════════════════════
    -- PHASE 4: AUDIT LOG
    -- ═══════════════════════════════════════════════════════════════════════════
    
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
        'trust_shield_complete_v2',
        v_verification_status,
        p_face_score,
        jsonb_build_object(
            'identity_hash', p_identity_hash,
            'ocr_data', p_ocr_data,
            'age_group', p_age_group,
            'is_minor', v_is_minor,
            'id_type', v_id_type
        )
    );
    
    -- Success
    RETURN jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor,
        'user_id', p_user_id,
        'id_type', v_id_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Check for Student ID duplicates (for 13-17 tier)
-- Similar to Aadhaar check but for School/College IDs
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_student_id_duplicate(
    p_student_id TEXT,
    p_institution_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing RECORD;
    v_combined_hash TEXT;
BEGIN
    -- Validate input
    IF p_student_id IS NULL OR LENGTH(TRIM(p_student_id)) < 3 THEN
        RETURN jsonb_build_object(
            'exists', false,
            'error', 'Invalid Student ID provided'
        );
    END IF;
    
    -- Create combined hash of student ID + institution
    v_combined_hash := encode(digest(
        lower(regexp_replace(p_student_id, '\s', '', 'g')) || 
        COALESCE(lower(regexp_replace(p_institution_name, '\s', '', 'g')), ''),
        'sha256'
    ), 'hex');
    
    -- Check if this student ID already exists
    SELECT id, full_name, verification_status, created_at, verification_metadata->>'institution' as institution
    INTO v_existing
    FROM profiles
    WHERE id_number_hash = v_combined_hash
        AND (id_type = 'school' OR id_type = 'college')
    LIMIT 1;
    
    IF v_existing IS NOT NULL THEN
        v_result := jsonb_build_object(
            'exists', true,
            'existing_user_id', v_existing.id,
            'existing_user_name', v_existing.full_name,
            'institution', v_existing.institution,
            'verification_status', v_existing.verification_status,
            'created_at', v_existing.created_at,
            'message', 'This Student ID is already registered. One student can only have one Focus account.',
            'redirect_to', '/auth',
            'alert_type', 'STUDENT_ID_ALREADY_REGISTERED'
        );
        RETURN v_result;
    END IF;
    
    -- ID is unique
    RETURN jsonb_build_object(
        'exists', false,
        'message', 'Student ID is available for registration'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Store Student ID (for 13-17 tier)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION store_student_id(
    p_user_id UUID,
    p_student_id TEXT,
    p_institution_name TEXT,
    p_id_type TEXT -- 'school' or 'college'
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_combined_hash TEXT;
    v_existing_id UUID;
BEGIN
    -- Validate
    IF p_student_id IS NULL OR LENGTH(TRIM(p_student_id)) < 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid Student ID'
        );
    END IF;
    
    -- Create combined hash
    v_combined_hash := encode(digest(
        lower(regexp_replace(p_student_id, '\s', '', 'g')) || 
        COALESCE(lower(regexp_replace(p_institution_name, '\s', '', 'g')), ''),
        'sha256'
    ), 'hex');
    
    -- Check if already exists
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE id_number_hash = v_combined_hash
        AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'This Student ID is already registered to another account',
            'code', 'ERR_DUPLICATE_STUDENT_ID'
        );
    END IF;
    
    -- Store the student ID
    UPDATE profiles SET
        id_number = LEFT(p_student_id, 3) || '...' || RIGHT(p_student_id, 3),
        id_type = p_id_type,
        id_number_hash = v_combined_hash,
        verification_metadata = COALESCE(verification_metadata, '{}'::jsonb) || jsonb_build_object(
            'institution', p_institution_name,
            'student_id_stored_at', NOW()
        ),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Student ID stored successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FUNCTION: Check MASKED Aadhaar duplicate (for DigiLocker documents)
-- Uses Name + DOB + Last 4 digits as composite key
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_masked_aadhaar_duplicate(
    p_name TEXT,
    p_dob TEXT,
    p_last4 TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing RECORD;
    v_composite_hash TEXT;
BEGIN
    -- Validate input
    IF p_name IS NULL OR p_dob IS NULL OR p_last4 IS NULL OR LENGTH(p_last4) != 4 THEN
        RETURN jsonb_build_object(
            'exists', false,
            'error', 'Invalid input for masked Aadhaar check'
        );
    END IF;
    
    -- Create composite hash: normalized name + dob + last4
    v_composite_hash := encode(digest(
        lower(regexp_replace(p_name, '\s', '', 'g')) || 
        regexp_replace(p_dob, '[^0-9]', '', 'g') ||
        p_last4,
        'sha256'
    ), 'hex');
    
    -- Check for existing masked Aadhaar with same Name + DOB + Last4
    SELECT id, full_name, verification_status, created_at
    INTO v_existing
    FROM profiles
    WHERE id_type = 'aadhaar_masked'
        AND id_number LIKE '%' || p_last4
        AND (
            LOWER(REPLACE(REPLACE(full_name, ' ', ''), '-', '')) = 
            LOWER(REPLACE(REPLACE(p_name, ' ', ''), '-', ''))
            OR verification_metadata->>'ocr_data'->>'name' = p_name
        )
        AND (
            verification_metadata->>'ocr_data'->>'dob' = p_dob
            OR verification_metadata->>'ocr_data'->>'last4' = p_last4
        )
    LIMIT 1;
    
    -- Also check full Aadhaar records (if someone tries to register same person with full Aadhaar later)
    IF v_existing IS NULL THEN
        SELECT id, full_name, verification_status, created_at
        INTO v_existing
        FROM profiles
        WHERE id_type = 'aadhaar'
            AND id_number LIKE '%' || p_last4
            AND (
                LOWER(REPLACE(REPLACE(full_name, ' ', ''), '-', '')) = 
                LOWER(REPLACE(REPLACE(p_name, ' ', ''), '-', ''))
            )
        LIMIT 1;
    END IF;
    
    IF v_existing IS NOT NULL THEN
        v_result := jsonb_build_object(
            'exists', true,
            'existing_user_id', v_existing.id,
            'existing_user_name', v_existing.full_name,
            'verification_status', v_existing.verification_status,
            'created_at', v_existing.created_at,
            'message', 'This Aadhaar (ending in ' || p_last4 || ') is already registered. One Aadhaar can only be used for one Focus account.',
            'redirect_to', '/auth',
            'alert_type', 'ID_ALREADY_REGISTERED'
        );
        RETURN v_result;
    END IF;
    
    -- Not found - this Aadhaar is available
    RETURN jsonb_build_object(
        'exists', false,
        'message', 'Masked Aadhaar is available for registration'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_id_duplicate TO authenticated;
GRANT EXECUTE ON FUNCTION store_id_number TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION check_student_id_duplicate TO authenticated;
GRANT EXECUTE ON FUNCTION store_student_id TO authenticated;
GRANT EXECUTE ON FUNCTION check_masked_aadhaar_duplicate TO authenticated;

-- Comments
COMMENT ON FUNCTION check_id_duplicate IS 'Check if Aadhaar/PAN/Passport already registered - for early detection at Step 1';
COMMENT ON FUNCTION store_id_number IS 'Store ID number with hash - enforces one ID = one account';
COMMENT ON FUNCTION finalize_verification_v2 IS 'Enhanced verification finalization with ID deduplication';
COMMENT ON FUNCTION check_student_id_duplicate IS 'Check if Student ID already registered';
COMMENT ON FUNCTION store_student_id IS 'Store Student ID with institution - enforces one student = one account';
COMMENT ON FUNCTION check_masked_aadhaar_duplicate IS 'Check if masked Aadhaar (Name+DOB+Last4) already registered - for DigiLocker';
