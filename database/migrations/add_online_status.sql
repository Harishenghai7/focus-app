-- Add last_seen column to profiles for online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create index for efficient online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Update current users' last_seen to now
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;
