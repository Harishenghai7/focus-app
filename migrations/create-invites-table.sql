-- Create invites table for tracking sent invitations

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('email', 'sms', 'twitter', 'facebook', 'linkedin', 'whatsapp', 'telegram', 'other')),
  recipient TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_invites_user_id ON invites(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_created_at ON invites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own invites"
  ON invites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invites"
  ON invites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invites"
  ON invites FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_invites_updated_at();

-- Add referral_code to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
    
    -- Generate referral codes for existing users
    UPDATE profiles 
    SET referral_code = LOWER(username) 
    WHERE referral_code IS NULL AND username IS NOT NULL;
  END IF;
END $$;

-- Create index on referral_code
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

COMMENT ON TABLE invites IS 'Tracks invitations sent by users to friends';
COMMENT ON COLUMN invites.method IS 'Method used to send invite: email, sms, or social media platform';
COMMENT ON COLUMN invites.recipient IS 'Email, phone number, or "social" for social media shares';
COMMENT ON COLUMN invites.status IS 'Status of the invitation: sent, accepted, or declined';
