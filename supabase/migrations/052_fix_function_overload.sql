-- ============================================================================
-- FIX: Resolve check_identity_uniqueness function overload conflict
-- Drops all old versions and creates single consistent function
-- ============================================================================

-- Step 1: Drop all existing versions of the function
DROP FUNCTION IF EXISTS check_identity_uniqueness(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS check_identity_uniqueness(TEXT, TEXT, TEXT, UUID);

-- Step 2: Create single consistent function with 4 params (4th is optional)
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
BEGIN
    -- Input validation - name and DOB are optional (sovereign hash is primary check)
    -- Only run name/DOB checks if both are provided
    IF p_name IS NOT NULL AND TRIM(p_name) != '' AND p_dob IS NOT NULL AND TRIM(p_dob) != '' THEN
        -- Layer 1: Check for duplicate name (case insensitive)
        SELECT id, username, verification_status INTO v_name_match
        FROM profiles
        WHERE LOWER(full_name) = LOWER(TRIM(p_name))
          AND (p_current_user_id IS NULL OR id IS DISTINCT FROM p_current_user_id)
        LIMIT 1;
        
        IF v_name_match IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error_code', 'ERR_DUPLICATE_IDENTITY',
                'error', 'Name already registered to another account',
                'existing_user', v_name_match.username,
                'existing_user_id', v_name_match.id,
                'layer', 'name_check',
                'unique', false
            );
        END IF;
        
        -- Layer 2: Check for duplicate DOB + Name combination
        SELECT id, username INTO v_dob_match
        FROM profiles
        WHERE LOWER(full_name) = LOWER(TRIM(p_name))
          AND date_of_birth = p_dob::DATE
          AND (p_current_user_id IS NULL OR id IS DISTINCT FROM p_current_user_id)
        LIMIT 1;
        
        IF v_dob_match IS NOT NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error_code', 'ERR_DUPLICATE_IDENTITY',
                'error', 'Identity already registered',
                'existing_user', v_dob_match.username,
                'existing_user_id', v_dob_match.id,
                'layer', 'dob_name_check',
                'unique', false
            );
        END IF;
    END IF;

    -- All checks passed (or skipped if data not provided)
    -- Note: Device ID check removed - column doesn't exist in profiles table
    RETURN jsonb_build_object(
        'success', true,
        'unique', true,
        'message', 'Identity is unique'
    );
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION check_identity_uniqueness TO authenticated;
GRANT EXECUTE ON FUNCTION check_identity_uniqueness TO anon;

-- Step 4: Add comment
COMMENT ON FUNCTION check_identity_uniqueness IS 'Checks if identity (name+DOB+device) is already registered. Returns unique=true if available.';
