-- Migration: Add account deletion grace period support
-- This allows users to schedule account deletion with a 30-day grace period

-- Add deletion tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_date TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying of accounts scheduled for deletion
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_date 
ON profiles(deletion_date) 
WHERE deletion_date IS NOT NULL;

-- Function to permanently delete accounts after grace period
CREATE OR REPLACE FUNCTION delete_expired_accounts()
RETURNS void AS $$
BEGIN
  -- Delete profiles where deletion_date has passed
  DELETE FROM profiles
  WHERE deletion_date IS NOT NULL 
    AND deletion_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel account deletion (when user logs back in)
CREATE OR REPLACE FUNCTION cancel_account_deletion(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET deletion_scheduled_at = NULL,
      deletion_date = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on columns
COMMENT ON COLUMN profiles.deletion_scheduled_at IS 'Timestamp when account deletion was requested';
COMMENT ON COLUMN profiles.deletion_date IS 'Date when account will be permanently deleted (30 days after request)';

-- Note: In production, you would set up a cron job or scheduled task to run:
-- SELECT delete_expired_accounts();
-- This should run daily to clean up expired accounts
