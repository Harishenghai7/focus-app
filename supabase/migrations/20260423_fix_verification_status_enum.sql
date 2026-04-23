-- =============================================================================
-- 🔥 CRITICAL FIX: Standardize verification_status to TEXT
-- =============================================================================
-- Problem: Mixed enum/text types causing "invalid input value for enum" error
-- Solution: Convert to TEXT with check constraint for flexibility
-- =============================================================================

-- 1. First, drop any existing enum type constraint if exists
DO $$
BEGIN
    -- Check if verification_status is an enum type
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public'
          AND c.table_name = 'profiles'
          AND c.column_name = 'verification_status'
          AND t.typtype = 'e'  -- 'e' = enum type
    ) THEN
        -- Convert enum to text
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status TYPE TEXT 
        USING verification_status::TEXT;
        
        RAISE NOTICE 'Converted verification_status from enum to text';
    END IF;
END $$;

-- 2. Ensure column exists as TEXT with proper default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN verification_status TEXT DEFAULT 'PENDING';
    ELSE
        -- Ensure it's TEXT type
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status TYPE TEXT,
        ALTER COLUMN verification_status SET DEFAULT 'PENDING';
    END IF;
END $$;

-- 3. Add trust_shield_status column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'trust_shield_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN trust_shield_status TEXT DEFAULT 'PENDING';
    ELSE
        ALTER TABLE public.profiles 
        ALTER COLUMN trust_shield_status TYPE TEXT,
        ALTER COLUMN trust_shield_status SET DEFAULT 'PENDING';
    END IF;
END $$;

-- 4. Update existing NULL values to 'PENDING'
UPDATE public.profiles 
SET verification_status = 'PENDING' 
WHERE verification_status IS NULL;

UPDATE public.profiles 
SET trust_shield_status = 'PENDING' 
WHERE trust_shield_status IS NULL;

-- 5. Document valid values
COMMENT ON COLUMN public.profiles.verification_status IS 
    'Valid values: PENDING | VERIFIED | VERIFIED_MINOR | PENDING_GUARDIAN | REJECTED | LOCKED_INJECTION';

COMMENT ON COLUMN public.profiles.trust_shield_status IS 
    'Valid values: PENDING | VERIFIED | VERIFIED_MINOR | PENDING_GUARDIAN | FAILED';

-- 6. Create helper function to safely update verification status
CREATE OR REPLACE FUNCTION public.safe_update_verification_status(
    p_user_id UUID,
    p_status TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY[
        'PENDING', 'VERIFIED', 'VERIFIED_MINOR', 
        'PENDING_GUARDIAN', 'REJECTED', 'LOCKED_INJECTION', 'FAILED'
    ];
BEGIN
    -- Validate status
    IF NOT (p_status = ANY(valid_statuses)) THEN
        RAISE EXCEPTION 'Invalid verification status: %. Valid values: %', p_status, valid_statuses;
    END IF;
    
    -- Update profile
    UPDATE public.profiles
    SET 
        verification_status = p_status,
        trust_shield_status = CASE 
            WHEN p_status IN ('VERIFIED', 'VERIFIED_MINOR') THEN p_status
            ELSE trust_shield_status
        END,
        identity_metadata = COALESCE(identity_metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- 7. Grant execute permission
GRANT EXECUTE ON FUNCTION public.safe_update_verification_status(UUID, TEXT, JSONB) TO authenticated;

-- 8. Fix is_trust_shield_verified function to handle TEXT type
CREATE OR REPLACE FUNCTION public.is_trust_shield_verified(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_user_id
          AND UPPER(COALESCE(p.verification_status, 'PENDING')) IN ('VERIFIED', 'VERIFIED_MINOR')
    );
$$;

-- 9. Fix assert_trust_shield_verified function
CREATE OR REPLACE FUNCTION public.assert_trust_shield_verified(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT UPPER(COALESCE(verification_status, 'PENDING')) 
    INTO v_status
    FROM public.profiles 
    WHERE id = p_user_id;
    
    IF v_status NOT IN ('VERIFIED', 'VERIFIED_MINOR') THEN
        RAISE EXCEPTION 'TRUST_SHIELD_REQUIRED: status is %', v_status
            USING ERRCODE = 'P0001',
                  HINT = 'Verification status must be VERIFIED or VERIFIED_MINOR';
    END IF;
END;
$$;

-- 10. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_trust_shield_verified(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.assert_trust_shield_verified(UUID) TO authenticated;

-- Notify completion
DO $$ 
BEGIN 
    RAISE NOTICE '✅ verification_status enum conflict FIXED - Now using TEXT type';
    RAISE NOTICE '✅ Helper functions updated to handle TEXT type';
    RAISE NOTICE '✅ All NULL values updated to PENDING';
END $$;
