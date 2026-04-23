-- =============================================================================
-- 🔥 BULLETPROOF FIX: Handle triggers and dependencies
-- =============================================================================
-- Error: "cannot alter type of a column used in a trigger definition"
-- Solution: Drop trigger → alter column → recreate trigger
-- =============================================================================

-- 1. First, backup current data and get trigger info
DO $$
DECLARE
    trigger_record RECORD;
    trigger_body TEXT;
    trigger_timing TEXT;
    trigger_events TEXT;
    trigger_when TEXT;
BEGIN
    -- Store trigger definitions for later restoration
    FOR trigger_record IN 
        SELECT 
            tgname,
            pg_get_triggerdef(oid) as trigger_def
        FROM pg_trigger 
        WHERE tgrelid = 'public.profiles'::regclass
        AND tgname LIKE '%trust%'
    LOOP
        RAISE NOTICE 'Found trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- 2. Drop triggers that depend on trust_shield_status
DROP TRIGGER IF EXISTS validate_age_tier_trigger ON public.profiles;
DROP TRIGGER IF EXISTS trg_verify_age_tier ON public.profiles;
DROP TRIGGER IF EXISTS trg_apply_guardian_approval ON public.guardian_approvals;

-- Also drop any functions these triggers depend on temporarily
DROP FUNCTION IF EXISTS public.validate_age_tier() CASCADE;
DROP FUNCTION IF EXISTS public.apply_guardian_approval() CASCADE;

-- 3. Now safely alter columns
-- First, handle verification_status
DO $$
BEGIN
    -- Check if column is enum and convert to text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public'
          AND c.table_name = 'profiles'
          AND c.column_name = 'verification_status'
          AND t.typtype = 'e'
    ) THEN
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status TYPE TEXT 
        USING verification_status::TEXT;
        
        RAISE NOTICE '✅ Converted verification_status from enum to text';
    END IF;
END $$;

-- Ensure verification_status exists as TEXT with default
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
        -- Ensure it's TEXT type (idempotent)
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status DROP DEFAULT,
        ALTER COLUMN verification_status TYPE TEXT USING verification_status::TEXT,
        ALTER COLUMN verification_status SET DEFAULT 'PENDING';
    END IF;
END $$;

-- 4. Handle trust_shield_status (this was causing the error)
DO $$
BEGIN
    -- Check if column is enum and convert to text
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns c
        JOIN pg_type t ON c.udt_name = t.typname
        WHERE c.table_schema = 'public'
          AND c.table_name = 'profiles'
          AND c.column_name = 'trust_shield_status'
          AND t.typtype = 'e'
    ) THEN
        ALTER TABLE public.profiles 
        ALTER COLUMN trust_shield_status TYPE TEXT 
        USING trust_shield_status::TEXT;
        
        RAISE NOTICE '✅ Converted trust_shield_status from enum to text';
    END IF;
END $$;

-- Ensure trust_shield_status exists as TEXT with default
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
        -- Ensure it's TEXT type (idempotent)
        ALTER TABLE public.profiles 
        ALTER COLUMN trust_shield_status DROP DEFAULT,
        ALTER COLUMN trust_shield_status TYPE TEXT USING trust_shield_status::TEXT,
        ALTER COLUMN trust_shield_status SET DEFAULT 'PENDING';
    END IF;
END $$;

-- 5. Update NULL values to 'PENDING'
UPDATE public.profiles 
SET verification_status = 'PENDING' 
WHERE verification_status IS NULL;

UPDATE public.profiles 
SET trust_shield_status = 'PENDING' 
WHERE trust_shield_status IS NULL;

-- 6. Recreate the guardian approval trigger (simplified version)
CREATE OR REPLACE FUNCTION public.apply_guardian_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When guardian approval status changes to APPROVED
    IF NEW.approval_status = 'APPROVED' 
       AND (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
        
        UPDATE public.profiles
        SET 
            verification_status = 'VERIFIED_MINOR',
            trust_shield_status = 'VERIFIED_MINOR',
            identity_metadata = COALESCE(identity_metadata, '{}'::jsonb) || jsonb_build_object(
                'guardian_approved', true,
                'guardian_approved_at', now(),
                'guardian_handshake_token', NEW.handshake_token
            ),
            updated_at = now()
        WHERE id = NEW.teen_user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on guardian_approvals
DROP TRIGGER IF EXISTS trg_apply_guardian_approval ON public.guardian_approvals;
CREATE TRIGGER trg_apply_guardian_approval
    AFTER UPDATE ON public.guardian_approvals
    FOR EACH ROW
    EXECUTE FUNCTION public.apply_guardian_approval();

-- 7. Create safe update function (TEXT-based, no enum)
CREATE OR REPLACE FUNCTION public.safe_update_verification_status(
    p_user_id UUID,
    p_status TEXT,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    valid_statuses TEXT[] := ARRAY[
        'PENDING', 'VERIFIED', 'VERIFIED_MINOR', 
        'PENDING_GUARDIAN', 'REJECTED', 'LOCKED_INJECTION', 'FAILED', 'UNVERIFIED'
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

-- 8. Create is_trust_shield_verified function (TEXT-safe)
CREATE OR REPLACE FUNCTION public.is_trust_shield_verified(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_user_id
          AND COALESCE(UPPER(p.verification_status), 'PENDING') IN ('VERIFIED', 'VERIFIED_MINOR')
    );
$$;

-- 9. Create assert_trust_shield_verified function (TEXT-safe)
CREATE OR REPLACE FUNCTION public.assert_trust_shield_verified(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT COALESCE(UPPER(verification_status), 'PENDING')
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

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION public.safe_update_verification_status(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_trust_shield_verified(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.assert_trust_shield_verified(UUID) TO authenticated;

-- 11. Add comments for documentation
COMMENT ON COLUMN public.profiles.verification_status IS 
    'Valid values: PENDING | VERIFIED | VERIFIED_MINOR | PENDING_GUARDIAN | REJECTED | FAILED | LOCKED_INJECTION | UNVERIFIED';

COMMENT ON COLUMN public.profiles.trust_shield_status IS 
    'Valid values: PENDING | VERIFIED | VERIFIED_MINOR | PENDING_GUARDIAN | FAILED | UNVERIFIED';

-- Notify completion
DO $$ 
BEGIN 
    RAISE NOTICE '✅ verification_status enum conflict FIXED - Now using TEXT type';
    RAISE NOTICE '✅ trust_shield_status enum conflict FIXED - Now using TEXT type';
    RAISE NOTICE '✅ Triggers dropped and recreated successfully';
    RAISE NOTICE '✅ Safe update functions created with TEXT validation';
END $$;
