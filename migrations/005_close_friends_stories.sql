-- Migration: Close Friends for Stories
-- Date: 2025-11-07
-- Description: Add audience control for stories

-- Add audience field to flashes
ALTER TABLE flashes
ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'everyone' CHECK (audience IN ('everyone', 'close_friends', 'followers'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_flashes_audience ON flashes(audience);

COMMENT ON COLUMN flashes.audience IS 'Story visibility: everyone, close_friends, or followers';

-- Update RLS policy to respect audience
DROP POLICY IF EXISTS "Users can view flashes from followed users" ON flashes;

CREATE POLICY "Users can view flashes based on audience"
  ON flashes FOR SELECT
  USING (
    user_id = auth.uid() OR
    (audience = 'everyone' AND user_id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())) OR
    (audience = 'followers' AND user_id IN (SELECT following_id FROM follows WHERE follower_id = auth.uid())) OR
    (audience = 'close_friends' AND user_id IN (SELECT friend_id FROM close_friends WHERE user_id = auth.uid()))
  );
