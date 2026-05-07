-- ============================================================================
-- FIX: Create verify_unique_identity function (was missing!)
-- This function is called by the frontend to check if identity hash is unique
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_unique_identity(
    p_hash TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing RECORD;
BEGIN
    -- Input validation
    IF p_hash IS NULL OR TRIM(p_hash) = '' THEN
        RETURN jsonb_build_object(
            'unique', false,
            'message', 'Identity hash is required'
        );
    END IF;
    
    -- Check if hash already exists (excluding current user)
    SELECT id, username, verification_status 
    INTO v_existing
    FROM profiles
    WHERE identity_hash = p_hash
      AND (p_user_id IS NULL OR id IS DISTINCT FROM p_user_id)
    LIMIT 1;
    
    IF v_existing IS NOT NULL THEN
        RETURN jsonb_build_object(
            'unique', false,
            'message', 'Identity already linked to another account.',
            'existing_user', v_existing.username,
            'existing_user_id', v_existing.id,
            'redirect', '/auth'
        );
    END IF;
    
    -- Hash is unique
    RETURN jsonb_build_object(
        'unique', true,
        'message', 'Identity hash is unique'
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION verify_unique_identity TO authenticated;
GRANT EXECUTE ON FUNCTION verify_unique_identity TO anon;

-- Add comment
COMMENT ON FUNCTION verify_unique_identity IS 'Verifies that an identity hash is unique across all accounts. Returns unique=true if available.';
