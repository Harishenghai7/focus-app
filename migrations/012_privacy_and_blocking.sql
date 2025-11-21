-- Migration: Privacy and Blocking Features
-- Add status column to follows table for follow requests
-- Create blocked_users table
-- Add last_active_at to profiles for activity status

-- Add status column to follows table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'follows' AND column_name = 'status'
  ) THEN
    ALTER TABLE follows ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active'));
    CREATE INDEX idx_follows_status ON follows(status);
  END IF;
END $$;

-- Add last_active_at to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_active_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_active_at TIMESTAMPTZ DEFAULT NOW();
    CREATE INDEX idx_profiles_last_active_at ON profiles(last_active_at);
  END IF;
END $$;

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- Create indexes for blocked_users
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- Enable RLS on blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocked_users
DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
CREATE POLICY "Users can view own blocks" ON blocked_users 
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON blocked_users 
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users 
  FOR DELETE USING (auth.uid() = blocker_id);

-- Update posts RLS policy to respect private accounts and blocks
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts 
  FOR SELECT USING (
    -- Not blocked by post owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = posts.user_id AND blocked_id = auth.uid()
    )
    AND
    -- Not blocking post owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = auth.uid() AND blocked_id = posts.user_id
    )
    AND
    (
      -- Public account OR own posts OR following (for private accounts)
      (SELECT private_account FROM profiles WHERE id = posts.user_id) = false
      OR posts.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = posts.user_id 
        AND status = 'active'
      )
    )
  );

-- Update boltz RLS policy to respect private accounts and blocks
DROP POLICY IF EXISTS "Boltz are viewable by everyone" ON boltz;
CREATE POLICY "Boltz are viewable by everyone" ON boltz 
  FOR SELECT USING (
    -- Not blocked by boltz owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = boltz.user_id AND blocked_id = auth.uid()
    )
    AND
    -- Not blocking boltz owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = auth.uid() AND blocked_id = boltz.user_id
    )
    AND
    (
      -- Public account OR own boltz OR following (for private accounts)
      (SELECT private_account FROM profiles WHERE id = boltz.user_id) = false
      OR boltz.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = boltz.user_id 
        AND status = 'active'
      )
    )
  );

-- Update flash RLS policy to respect blocks
DROP POLICY IF EXISTS "Flash view access" ON flash;
CREATE POLICY "Flash view access" ON flash 
  FOR SELECT USING (
    expires_at > NOW() AND is_archived = false 
    AND
    -- Not blocked by flash owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = flash.user_id AND blocked_id = auth.uid()
    )
    AND
    -- Not blocking flash owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = auth.uid() AND blocked_id = flash.user_id
    )
    AND
    (
      visibility = 'public' OR 
      user_id = auth.uid() OR 
      (visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() 
        AND following_id = flash.user_id
        AND status = 'active'
      ))
    )
  );

-- Update profiles RLS policy to respect blocks
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles 
  FOR SELECT USING (
    -- Not blocked by profile owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = profiles.id AND blocked_id = auth.uid()
    )
    AND
    -- Not blocking profile owner
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE blocker_id = auth.uid() AND blocked_id = profiles.id
    )
  );

-- Update follows policies to handle pending status
DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others" ON follows 
  FOR INSERT WITH CHECK (
    auth.uid() = follower_id
    AND
    -- Cannot follow if blocked
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = follower_id AND blocked_id = following_id)
      OR (blocker_id = following_id AND blocked_id = follower_id)
    )
  );

-- Update messages policies to respect blocks
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    )
    AND
    -- Not blocked
    NOT EXISTS (
      SELECT 1 FROM blocked_users 
      WHERE (blocker_id = messages.sender_id AND blocked_id = auth.uid())
      OR (blocker_id = auth.uid() AND blocked_id = messages.sender_id)
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND
    -- Not blocked
    NOT EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE (blocker_id = c.participant_1 AND blocked_id = c.participant_2)
        OR (blocker_id = c.participant_2 AND blocked_id = c.participant_1)
      )
    )
  );

-- Function to automatically set follow status based on account privacy
CREATE OR REPLACE FUNCTION set_follow_status()
RETURNS TRIGGER AS $$
DECLARE
  is_private BOOLEAN;
BEGIN
  -- Check if the account being followed is private
  SELECT private_account INTO is_private
  FROM profiles
  WHERE id = NEW.following_id;

  -- Set status to pending if private, active if public
  IF is_private THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow status
DROP TRIGGER IF EXISTS set_follow_status_trigger ON follows;
CREATE TRIGGER set_follow_status_trigger
  BEFORE INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION set_follow_status();

-- Function to update follower counts only for active follows
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Increment follower count
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- Increment following count
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    -- Decrement follower count
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    -- Decrement following count
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'active' THEN
    -- Increment counts when request is approved
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follower counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON follows;
CREATE TRIGGER update_follower_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

COMMIT;
