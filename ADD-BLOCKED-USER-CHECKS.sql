-- ============================================
-- ADD BLOCKED USER CHECKS - Privacy & Safety
-- ============================================
-- This ensures blocked users cannot see each other's content
-- Critical for user safety and privacy
-- ============================================

-- ============================================
-- 1. UPDATE POSTS POLICY
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;

-- Create new policy with blocked user checks
CREATE POLICY "Posts are viewable respecting blocks" 
ON posts FOR SELECT USING (
  -- Not blocked by post owner
  NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = posts.user_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Haven't blocked the post owner
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = posts.user_id 
    AND blocked_users.blocker_id = auth.uid()
  )
  -- Respect private accounts
  AND (
    posts.user_id = auth.uid() -- Own posts
    OR NOT EXISTS ( -- User is not private
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.user_id 
      AND profiles.is_private = true
    )
    OR EXISTS ( -- Or you follow them
      SELECT 1 FROM follows 
      WHERE follows.following_id = posts.user_id 
      AND follows.follower_id = auth.uid()
    )
  )
);

-- ============================================
-- 2. UPDATE BOLTZ POLICY
-- ============================================

DROP POLICY IF EXISTS "Boltz are viewable by everyone" ON boltz;

CREATE POLICY "Boltz are viewable respecting blocks" 
ON boltz FOR SELECT USING (
  -- Not blocked by boltz owner
  NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = boltz.user_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Haven't blocked the boltz owner
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = boltz.user_id 
    AND blocked_users.blocker_id = auth.uid()
  )
  -- Respect private accounts
  AND (
    boltz.user_id = auth.uid()
    OR NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = boltz.user_id 
      AND profiles.is_private = true
    )
    OR EXISTS (
      SELECT 1 FROM follows 
      WHERE follows.following_id = boltz.user_id 
      AND follows.follower_id = auth.uid()
    )
  )
);

-- ============================================
-- 3. UPDATE FLASHES POLICY
-- ============================================

DROP POLICY IF EXISTS "Flashes are viewable by everyone" ON flashes;

CREATE POLICY "Flashes are viewable respecting blocks" 
ON flashes FOR SELECT USING (
  expires_at > NOW()
  -- Not blocked by flash owner
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = flashes.user_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Haven't blocked the flash owner
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = flashes.user_id 
    AND blocked_users.blocker_id = auth.uid()
  )
  -- Respect close friends setting
  AND (
    flashes.user_id = auth.uid()
    OR (
      flashes.is_close_friends = false
      OR EXISTS (
        SELECT 1 FROM close_friends 
        WHERE close_friends.user_id = flashes.user_id 
        AND close_friends.friend_id = auth.uid()
      )
    )
  )
);

-- ============================================
-- 4. UPDATE COMMENTS POLICY
-- ============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;

CREATE POLICY "Comments are viewable respecting blocks" 
ON comments FOR SELECT USING (
  -- Not blocked by comment author
  NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = comments.user_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Haven't blocked the comment author
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = comments.user_id 
    AND blocked_users.blocker_id = auth.uid()
  )
);

-- ============================================
-- 5. UPDATE PROFILES POLICY
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles are viewable respecting blocks" 
ON profiles FOR SELECT USING (
  -- Not blocked by profile owner
  NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = profiles.id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Haven't blocked the profile owner
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = profiles.id 
    AND blocked_users.blocker_id = auth.uid()
  )
);

-- ============================================
-- 6. PREVENT FOLLOWING BLOCKED USERS
-- ============================================

DROP POLICY IF EXISTS "Users can insert own follows" ON follows;

CREATE POLICY "Users can follow non-blocked users" 
ON follows FOR INSERT WITH CHECK (
  auth.uid() = follower_id
  -- Cannot follow someone who blocked you
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = follows.following_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Cannot follow someone you blocked
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = follows.following_id 
    AND blocked_users.blocker_id = auth.uid()
  )
);

-- ============================================
-- 7. PREVENT MESSAGING BLOCKED USERS
-- ============================================

DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;

CREATE POLICY "Users can send messages to non-blocked users" 
ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND receiver_id IS NOT NULL
  -- Cannot message someone who blocked you
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocker_id = messages.receiver_id 
    AND blocked_users.blocked_id = auth.uid()
  )
  -- Cannot message someone you blocked
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocked_users.blocked_id = messages.receiver_id 
    AND blocked_users.blocker_id = auth.uid()
  )
);

-- ============================================
-- 8. AUTO-UNFOLLOW ON BLOCK
-- ============================================

-- Function to handle blocking
CREATE OR REPLACE FUNCTION handle_user_block()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove all follows between blocked users
  DELETE FROM follows 
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  
  -- Remove from close friends
  DELETE FROM close_friends 
  WHERE (user_id = NEW.blocker_id AND friend_id = NEW.blocked_id)
     OR (user_id = NEW.blocked_id AND friend_id = NEW.blocker_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on block
DROP TRIGGER IF EXISTS trigger_handle_user_block ON blocked_users;
CREATE TRIGGER trigger_handle_user_block
  AFTER INSERT ON blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_block();

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view profile
CREATE OR REPLACE FUNCTION can_view_profile(profile_id UUID, viewer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_private BOOLEAN;
  is_following BOOLEAN;
  is_blocked BOOLEAN;
BEGIN
  -- Check if blocked
  SELECT is_user_blocked(profile_id, viewer_id) INTO is_blocked;
  IF is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Own profile
  IF profile_id = viewer_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if private
  SELECT profiles.is_private INTO is_private
  FROM profiles
  WHERE profiles.id = profile_id;
  
  -- Public profile
  IF NOT is_private THEN
    RETURN TRUE;
  END IF;
  
  -- Check if following
  SELECT EXISTS (
    SELECT 1 FROM follows 
    WHERE following_id = profile_id 
    AND follower_id = viewer_id
  ) INTO is_following;
  
  RETURN is_following;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VERIFICATION
-- ============================================

-- Check all policies were updated
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('posts', 'boltz', 'flashes', 'comments', 'profiles', 'follows', 'messages')
AND policyname LIKE '%block%'
ORDER BY tablename, policyname;

-- Test blocked user check function
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- This should return false if no blocks exist
  SELECT is_user_blocked(
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID
  ) INTO test_result;
  
  RAISE NOTICE 'Block check test result: %', test_result;
END $$;

-- ============================================
-- DONE! ✅
-- ============================================
-- Blocked user checks are now enforced across the app!
-- Users who block each other cannot:
-- - See each other's posts, boltz, or flashes
-- - See each other's comments
-- - View each other's profiles
-- - Follow each other
-- - Message each other
-- 
-- Blocking automatically:
-- - Removes existing follows
-- - Removes from close friends
-- ============================================
