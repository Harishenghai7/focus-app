-- ============================================================================
-- Government ID + Face Verification System
-- Migration: 20251204_government_id_verification
-- Description: Adds DigiLocker verification, face matching, device fingerprinting,
--              and parent consent tables for the Government ID verification feature
-- ============================================================================

-- ============================================================================
-- 1. ADD VERIFICATION FIELDS TO PROFILES TABLE
-- ============================================================================
-- Note: Using 'profiles' table instead of 'users' based on existing schema

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digilocker_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_dob DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS digilocker_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_match_confidence DECIMAL(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS government_id_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_method TEXT CHECK (verification_method IN ('digilocker_adult', 'parent_consent', NULL));

-- Add index for verification queries
CREATE INDEX IF NOT EXISTS idx_profiles_government_verified 
ON profiles(digilocker_verified, face_verified) 
WHERE digilocker_verified = true AND face_verified = true;

-- ============================================================================
-- 2. CREATE DEVICE FINGERPRINTING TABLE
-- ============================================================================
-- Prevents multi-account abuse by tracking device fingerprints

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one device can only be verified for one account
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_fingerprint_unique 
ON user_devices(device_fingerprint) 
WHERE is_active = true;

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
ON user_devices(user_id);

-- RLS Policies for user_devices
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
ON user_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
ON user_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
ON user_devices FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- 3. CREATE VERIFICATION LOGS TABLE
-- ============================================================================
-- Audit trail for all verification attempts

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('digilocker', 'face_liveness', 'face_match', 'parent_consent')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user verification history
CREATE INDEX IF NOT EXISTS idx_verification_logs_user 
ON verification_logs(user_id, created_at DESC);

-- Index for admin monitoring
CREATE INDEX IF NOT EXISTS idx_verification_logs_status 
ON verification_logs(status, created_at DESC);

-- RLS Policies for verification_logs
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification logs"
ON verification_logs FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. CREATE PARENT VERIFICATIONS TABLE
-- ============================================================================
-- Handles parent/guardian consent for teen users (13-17 years old)

CREATE TABLE IF NOT EXISTS parent_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_email TEXT NOT NULL,
  parent_digilocker_verified BOOLEAN DEFAULT false,
  consent_given BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMP WITH TIME ZONE,
  verification_token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_parent_verifications_token 
ON parent_verifications(verification_token) 
WHERE verification_token IS NOT NULL;

-- Index for child user lookups
CREATE INDEX IF NOT EXISTS idx_parent_verifications_child 
ON parent_verifications(child_user_id);

-- RLS Policies for parent_verifications
ALTER TABLE parent_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own parent verification requests"
ON parent_verifications FOR SELECT
USING (auth.uid() = child_user_id OR auth.uid() = parent_user_id);

CREATE POLICY "Users can create parent verification requests"
ON parent_verifications FOR INSERT
WITH CHECK (auth.uid() = child_user_id);

CREATE POLICY "Parents can update their verification status"
ON parent_verifications FOR UPDATE
USING (auth.uid() = parent_user_id OR auth.uid() = child_user_id);

-- ============================================================================
-- 5. ADD "VERIFIED HUMAN" BADGE
-- ============================================================================
-- Insert the new badge into badge_definitions table

INSERT INTO badge_definitions (
  name,
  display_name,
  description,
  icon,
  color,
  category,
  points,
  type,
  sort_order,
  is_active
) VALUES (
  'verified_human',
  'Verified Human',
  'Verified real identity through government ID and face verification',
  'verified_shield',
  '#00D4AA',
  'verification',
  50,
  'automatic',
  1,
  true
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 6. CREATE TRUST SCORE INCREMENT FUNCTION
-- ============================================================================
-- RPC function to increment user's trust score

CREATE OR REPLACE FUNCTION increment_trust_score(
  target_user_id UUID,
  points INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET trust_score = COALESCE(trust_score, 0) + points
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_trust_score(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if device fingerprint is already used
CREATE OR REPLACE FUNCTION is_device_fingerprint_used(
  fingerprint TEXT,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  device_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_devices
    WHERE device_fingerprint = fingerprint
    AND is_active = true
    AND (exclude_user_id IS NULL OR user_id != exclude_user_id)
  ) INTO device_exists;
  
  RETURN device_exists;
END;
$$;

-- Function to get verification attempt count in last 24 hours
CREATE OR REPLACE FUNCTION get_verification_attempts_count(
  target_user_id UUID,
  hours INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM verification_logs
  WHERE user_id = target_user_id
  AND created_at >= NOW() - (hours || ' hours')::INTERVAL;
  
  RETURN attempt_count;
END;
$$;

-- ============================================================================
-- 8. CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp on user_devices
CREATE OR REPLACE FUNCTION update_user_devices_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_devices_updated_at
BEFORE UPDATE ON user_devices
FOR EACH ROW
EXECUTE FUNCTION update_user_devices_timestamp();

-- Trigger to update updated_at timestamp on parent_verifications
CREATE OR REPLACE FUNCTION update_parent_verifications_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER parent_verifications_updated_at
BEFORE UPDATE ON parent_verifications
FOR EACH ROW
EXECUTE FUNCTION update_parent_verifications_timestamp();

-- ============================================================================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_devices IS 'Tracks device fingerprints to prevent multi-account abuse';
COMMENT ON TABLE verification_logs IS 'Audit trail for all government ID verification attempts';
COMMENT ON TABLE parent_verifications IS 'Parent/guardian consent records for teen users (13-17)';
COMMENT ON FUNCTION increment_trust_score IS 'Increments user trust score by specified points';
COMMENT ON FUNCTION is_device_fingerprint_used IS 'Checks if a device fingerprint is already associated with an active verified account';
COMMENT ON FUNCTION get_verification_attempts_count IS 'Returns number of verification attempts in the last N hours';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Deploy Edge Functions (digilocker-verify, verify-face-match, send-parent-consent-email)
-- 2. Install frontend dependencies (face-api.js, @fingerprintjs/fingerprintjs)
-- 3. Download face-api.js models to public/models/
-- 4. Create GovernmentIDVerification React component
-- 5. Update VerificationCenter to include new verification method
-- ============================================================================
