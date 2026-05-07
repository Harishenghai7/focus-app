-- ============================================================================
-- 🏛️ SOVEREIGN FIX: Complete Trust Shield System - Frontend + Backend
-- ============================================================================
-- This migration ensures proper verification flow for both 18+ and 13-17 tiers
-- Fixes: age_group tracking, verification_status consistency, guardian flow
-- ============================================================================

-- ============================================================================
-- 1. ENSURE PROFILES TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Add age_group column if not exists (stores the selected age tier)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'age_group'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN age_group text;
        COMMENT ON COLUMN public.profiles.age_group IS 'Selected age tier: 13-17 or 18+';
    END IF;
END $$;

-- Ensure verification_metadata has proper age_group tracking
COMMENT ON COLUMN public.profiles.verification_metadata IS 'JSON with ocr_data, face_score, age_group, verified_at, etc.';

-- ============================================================================
-- 2. CREATE/REPLACE GUARDIAN VERIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.guardian_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    guardian_email text NOT NULL,
    guardian_name text,
    guardian_phone text,
    verified boolean DEFAULT false,
    verification_token text UNIQUE,
    created_at timestamptz DEFAULT now(),
    verified_at timestamptz,
    expires_at timestamptz DEFAULT (now() + interval '7 days'),
    metadata jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.guardian_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Guardian verifications viewable by user"
    ON public.guardian_verifications FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Guardian verifications manageable by service"
    ON public.guardian_verifications FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 3. FIXED FINALIZE VERIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.finalize_verification_v2(
    p_user_id uuid,
    p_identity_hash text,
    p_device_id text,
    p_ocr_data jsonb,
    p_face_score numeric,
    p_age_group text
) RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_existing_hash uuid;
    v_is_minor boolean;
    v_verification_status text;
    v_uniqueness_check jsonb;
    v_id_number text;
    v_id_type text;
    v_id_store_result jsonb;
BEGIN
    v_id_number := p_ocr_data->>'idNumber';
    v_id_type := coalesce(p_ocr_data->>'idType', 'unknown');

    -- Check for duplicate identity
    SELECT id INTO v_existing_hash
    FROM public.profiles
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

    -- Store ID number if provided
    IF v_id_number IS NOT NULL AND v_id_type IS NOT NULL THEN
        IF v_id_type IN ('student', 'school', 'college') THEN
            v_id_store_result := public.store_student_id(
                p_user_id,
                v_id_number,
                coalesce(p_ocr_data->>'institution', ''),
                v_id_type
            );
        ELSE
            v_id_store_result := public.store_id_number(p_user_id, v_id_number, v_id_type);
        END IF;
        
        IF NOT (v_id_store_result->>'success')::boolean THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', v_id_store_result->>'code',
                'error', v_id_store_result->>'error'
            );
        END IF;
    END IF;

    -- Check uniqueness
    v_uniqueness_check := public.check_identity_uniqueness(
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

    -- Face score check
    IF p_face_score < 0.5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
    END IF;

    -- Determine verification status based on age group
    v_is_minor := (p_age_group = '13-17');
    v_verification_status := CASE
        WHEN v_is_minor THEN 'PENDING_GUARDIAN'
        ELSE 'VERIFIED'
    END;

    -- Update profile with all verification data
    UPDATE public.profiles SET
        verification_status = v_verification_status,
        trust_shield_status = v_verification_status,
        focus_trust_status = v_verification_status,
        age_group = p_age_group,  -- 🏛️ SOVEREIGN FIX: Store age_group
        verification_step = 5,
        verification_locked = false,
        identity_hash = p_identity_hash,
        device_id = p_device_id,
        device_fingerprint = p_device_id,
        is_verified = (v_verification_status = 'VERIFIED'),
        trust_tier = CASE 
            WHEN v_verification_status = 'VERIFIED' THEN greatest(coalesce(trust_tier, 0), 4) 
            ELSE coalesce(trust_tier, 0) 
        END,
        verification_metadata = jsonb_build_object(
            'ocr_data', p_ocr_data,
            'face_score', p_face_score,
            'age_group', p_age_group,  -- 🏛️ SOVEREIGN FIX: Store age_group in metadata
            'verified_at', now(),
            'verification_method', 'trust_shield_v3',
            'id_type', v_id_type,
            'id_stored', v_id_number IS NOT NULL
        ),
        onboarding_completed = true,
        can_post = NOT v_is_minor,
        updated_at = now()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Failed to update profile'
        );
    END IF;

    -- Log to audit trail
    INSERT INTO public.verification_audit_trail (
        user_id, device_id, stage, result, score, metadata
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

    -- 🏛️ SOVEREIGN FIX: If teen, create guardian handshake record
    IF v_is_minor THEN
        INSERT INTO public.guardian_verifications (
            user_id,
            guardian_email,
            verification_token,
            metadata
        ) VALUES (
            p_user_id,
            coalesce(p_ocr_data->>'guardian_email', ''),
            encode(gen_random_bytes(32), 'hex'),
            jsonb_build_object(
                'student_name', p_ocr_data->>'name',
                'student_id', v_id_number,
                'institution', p_ocr_data->>'institution'
            )
        )
        ON CONFLICT (user_id) WHERE NOT verified
        DO UPDATE SET
            verification_token = encode(gen_random_bytes(32), 'hex'),
            metadata = jsonb_build_object(
                'student_name', p_ocr_data->>'name',
                'student_id', v_id_number,
                'institution', p_ocr_data->>'institution'
            ),
            created_at = now(),
            expires_at = now() + interval '7 days';
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor,
        'age_group', p_age_group,  -- 🏛️ SOVEREIGN FIX: Return age_group
        'user_id', p_user_id,
        'id_type', v_id_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE/REPLACE VERIFY GUARDIAN TOKEN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_guardian_token(p_token text)
RETURNS jsonb AS $$
DECLARE
    v_record record;
    v_teen_id uuid;
BEGIN
    -- Find and validate token
    SELECT * INTO v_record
    FROM public.guardian_verifications
    WHERE verification_token = p_token
        AND NOT verified
        AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'error', 'Invalid or expired token'
        );
    END IF;

    v_teen_id := v_record.user_id;

    -- Mark guardian verification as complete
    UPDATE public.guardian_verifications SET
        verified = true,
        verified_at = now()
    WHERE id = v_record.id;

    -- Update teen's profile to VERIFIED
    UPDATE public.profiles SET
        verification_status = 'VERIFIED',
        trust_shield_status = 'VERIFIED',
        focus_trust_status = 'VERIFIED',
        is_verified = true,
        trust_tier = greatest(coalesce(trust_tier, 0), 3),
        can_post = true,
        guardian_consent_status = 'approved',
        verification_metadata = verification_metadata || jsonb_build_object(
            'guardian_approved_at', now(),
            'guardian_verification_id', v_record.id
        ),
        updated_at = now()
    WHERE id = v_teen_id;

    RETURN jsonb_build_object(
        'success', true,
        'valid', true,
        'teen_user_id', v_teen_id,
        'guardian_email', v_record.guardian_email,
        'message', 'Guardian approval successful. Teen account activated.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE FUNCTION TO GET USER VERIFICATION STATUS (FOR FRONTEND)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_verification_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_profile record;
    v_guardian record;
BEGIN
    SELECT 
        id,
        verification_status,
        trust_shield_status,
        focus_trust_status,
        age_group,
        trust_tier,
        is_verified,
        can_post,
        verification_metadata,
        guardian_consent_status
    INTO v_profile
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_profile IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;

    -- Get pending guardian verification if teen
    IF v_profile.age_group = '13-17' AND NOT v_profile.is_verified THEN
        SELECT * INTO v_guardian
        FROM public.guardian_verifications
        WHERE user_id = p_user_id
            AND NOT verified
            AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'verification_status', v_profile.verification_status,
        'trust_shield_status', v_profile.trust_shield_status,
        'focus_trust_status', v_profile.focus_trust_status,
        'age_group', v_profile.age_group,  -- 🏛️ SOVEREIGN FIX: Return age_group
        'trust_tier', v_profile.trust_tier,
        'is_verified', v_profile.is_verified,
        'can_post', v_profile.can_post,
        'guardian_consent_status', v_profile.guardian_consent_status,
        'pending_guardian_token', v_guardian.verification_token,
        'guardian_email', v_guardian.guardian_email,
        'metadata', v_profile.verification_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_age_group ON public.profiles(age_group) 
    WHERE age_group IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

CREATE INDEX IF NOT EXISTS idx_guardian_verifications_user_id ON public.guardian_verifications(user_id);

CREATE INDEX IF NOT EXISTS idx_guardian_verifications_token ON public.guardian_verifications(verification_token);

-- ============================================================================
-- 7. ADD REAL-TIME SUBSCRIPTION SUPPORT
-- ============================================================================

-- Enable publication for real-time updates (idempotent - only add if not already member)
DO $$
BEGIN
    -- Add profiles to realtime publication if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
    
    -- Add guardian_verifications to realtime publication if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'guardian_verifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.guardian_verifications;
    END IF;
END $$;

COMMENT ON TABLE public.guardian_verifications IS 
'Parent/guardian approval records for teen users (13-17). Links to profiles table.';

-- ============================================================================
-- 8. ADD IDENTITY DNA HASH COLUMN (Required for trust-shield-dna Edge Function)
-- ============================================================================

-- Add identity_dna_hash column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'identity_dna_hash'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN identity_dna_hash text UNIQUE;
        COMMENT ON COLUMN public.profiles.identity_dna_hash IS 'HMAC-SHA256 hash of ID number for duplicate detection';
    END IF;
END $$;

-- Create index for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_profiles_identity_dna_hash 
    ON public.profiles(identity_dna_hash) 
    WHERE identity_dna_hash IS NOT NULL;

-- ============================================================================
-- 9. DATA MIGRATION: Backfill age_group from verification_metadata
-- ============================================================================

-- For existing users who have age_group stored in metadata but not in the column
UPDATE public.profiles 
SET age_group = verification_metadata->>'age_group'
WHERE age_group IS NULL 
    AND verification_metadata->>'age_group' IS NOT NULL
    AND verification_status IN ('VERIFIED', 'PENDING_GUARDIAN', 'pending_guardian');

-- ============================================================================
-- 🏛️ SOVEREIGN FIX COMPLETE
-- ============================================================================
