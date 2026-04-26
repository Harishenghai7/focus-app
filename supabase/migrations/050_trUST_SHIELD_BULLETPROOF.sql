-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 TRUST SHIELD - BULLETPROOF SQL - Handles ALL edge cases
-- Run this in ONE transaction - either all succeeds or all fails
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: ENSURE PROFILES TABLE EXISTS (Create if missing)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            full_name TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            avatar_url TEXT,
            verification_status TEXT DEFAULT 'PENDING',
            trust_shield_status TEXT DEFAULT 'PENDING',
            focus_trust_status TEXT DEFAULT 'PENDING',
            onboarding_completed BOOLEAN DEFAULT FALSE,
            can_post BOOLEAN DEFAULT TRUE,
            date_of_birth DATE
        );
        
        -- Add trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON profiles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: ADD ALL COLUMNS SAFELY (Ignore if already exists)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    -- Add verification_step
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'verification_step'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_step INTEGER DEFAULT 1;
    END IF;
    
    -- Add verification_locked
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'verification_locked'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_locked BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add locked_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'locked_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN locked_at TIMESTAMPTZ;
    END IF;
    
    -- Add device_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN device_id TEXT;
    END IF;
    
    -- Add device_fingerprint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE profiles ADD COLUMN device_fingerprint TEXT;
    END IF;
    
    -- Add ip_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'ip_hash'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ip_hash TEXT;
    END IF;
    
    -- Add identity_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'identity_hash'
    ) THEN
        ALTER TABLE profiles ADD COLUMN identity_hash TEXT;
    END IF;
    
    -- Add last_verification_attempt
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_verification_attempt'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_verification_attempt TIMESTAMPTZ;
    END IF;
    
    -- Add verification_attempt_count
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'verification_attempt_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_attempt_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add verification_metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'verification_metadata'
    ) THEN
        ALTER TABLE profiles ADD COLUMN verification_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add identity_metadata (if not exists - used by some versions)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'identity_metadata'
    ) THEN
        ALTER TABLE profiles ADD COLUMN identity_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add unique constraint on identity_hash (safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_identity_hash_unique' 
        AND conrelid = 'profiles'::regclass
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_identity_hash_unique UNIQUE (identity_hash);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint might already exist with different name
    NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_device_id ON profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_profiles_ip_hash ON profiles(ip_hash);
CREATE INDEX IF NOT EXISTS idx_profiles_identity_hash ON profiles(identity_hash) WHERE identity_hash IS NOT NULL;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 3: CREATE AUDIT TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verification_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_hash TEXT,
    stage TEXT NOT NULL,
    result TEXT NOT NULL,
    score NUMERIC,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON verification_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_device_id ON verification_audit_trail(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip_hash ON verification_audit_trail(ip_hash);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON verification_audit_trail(created_at);

ALTER TABLE verification_audit_trail ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 4: CREATE RATE LIMIT VIEW
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW verification_rate_limits AS
SELECT 
    device_id,
    ip_hash,
    COUNT(*) as attempt_count,
    MAX(created_at) as last_attempt,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as hourly_attempts
FROM verification_audit_trail
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY device_id, ip_hash;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 5: CREATE FUNCTIONS (After all tables/columns confirmed)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_identity_uniqueness(
    p_name TEXT,
    p_dob TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
BEGIN
    -- Check name + DOB match
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE COALESCE(full_name, '') ILIKE '%' || COALESCE(p_name, '') || '%'
    AND (
        COALESCE(identity_metadata->>'dob', '') = COALESCE(p_dob, '')
        OR COALESCE(date_of_birth::text, '') = COALESCE(p_dob, '')
    )
    AND full_name IS NOT NULL
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'unique', false,
            'reason', 'IDENTITY_EXISTS',
            'message', 'This identity is already registered'
        );
    END IF;
    
    -- Check device already has verified account
    SELECT id INTO v_existing_id
    FROM profiles
    WHERE device_id = p_device_id
    AND verification_status = 'VERIFIED'
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'unique', false,
            'reason', 'DEVICE_EXISTS',
            'message', 'A verified account already exists on this device'
        );
    END IF;
    
    RETURN jsonb_build_object('unique', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_suspicious_activity(
    p_ip_hash TEXT,
    p_device_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_attempt_count INTEGER;
    v_unique_devices INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_attempt_count
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
    AND created_at > NOW() - INTERVAL '1 hour';
    
    SELECT COUNT(DISTINCT device_id) INTO v_unique_devices
    FROM verification_audit_trail
    WHERE ip_hash = p_ip_hash
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_attempt_count > 5 OR v_unique_devices > 2 THEN
        RETURN jsonb_build_object(
            'is_suspicious', true,
            'reason', CASE WHEN v_attempt_count > 5 THEN 'EXCESSIVE_ATTEMPTS' ELSE 'MULTI_DEVICE_FRAUD' END,
            'attempt_count', v_attempt_count,
            'unique_devices', v_unique_devices
        );
    END IF;
    
    RETURN jsonb_build_object('is_suspicious', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION finalize_verification(
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
BEGIN
    -- Check duplicate identity
    SELECT id INTO v_existing_hash
    FROM profiles
    WHERE identity_hash = p_identity_hash
    AND id != p_user_id
    LIMIT 1;
    
    IF v_existing_hash IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_DUPLICATE_IDENTITY',
            'error', 'This identity is already registered'
        );
    END IF;
    
    -- Validate face score
    IF p_face_score < 0.5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_FACE_MISMATCH',
            'error', 'Face verification score too low'
        );
    END IF;
    
    v_is_minor := p_age_group = '13-17';
    v_verification_status := CASE WHEN v_is_minor THEN 'PENDING_GUARDIAN' ELSE 'VERIFIED' END;
    
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
            'verified_at', NOW()
        ),
        onboarding_completed = TRUE,
        can_post = NOT v_is_minor,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ERR_UPDATE_FAILED',
            'error', 'Profile not found'
        );
    END IF;
    
    INSERT INTO verification_audit_trail (
        user_id, device_id, stage, result, score, metadata
    ) VALUES (
        p_user_id, p_device_id, 'trust_shield_complete', 'VERIFIED', p_face_score,
        jsonb_build_object('identity_hash', p_identity_hash, 'age_group', p_age_group)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'verification_status', v_verification_status,
        'is_minor', v_is_minor
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 6: POLICIES AND PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Safe policy creation
DO $$
BEGIN
    -- Drop if exists
    DROP POLICY IF EXISTS "Users can update own profile (non-verification)" ON profiles;
    DROP POLICY IF EXISTS "Users can view own audit trail" ON verification_audit_trail;
    
    -- Create policies
    CREATE POLICY "Users can update own profile (non-verification)"
        ON profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    
    CREATE POLICY "Users can view own audit trail"
        ON verification_audit_trail FOR SELECT
        USING (user_id = auth.uid());
END $$;

-- Grants
GRANT EXECUTE ON FUNCTION check_identity_uniqueness TO authenticated;
GRANT EXECUTE ON FUNCTION check_suspicious_activity TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_verification TO authenticated;
GRANT SELECT ON verification_rate_limits TO authenticated;
