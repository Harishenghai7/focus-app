-- Migration: Close Friends System for Flash Stories
-- This migration adds close friends functionality for private flash stories

-- 1. Create close_friends table
CREATE TABLE IF NOT EXISTS close_friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_close_friend CHECK (user_id != friend_id)
);

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_close_friends_user_id ON close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_friend_id ON close_friends(friend_id);

-- 3. Enable RLS
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for close_friends
DROP POLICY IF EXISTS "Users can view their close friends" ON close_friends;
CREATE POLICY "Users can view their close friends" ON close_friends
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add close friends" ON close_friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove close friends" ON close_friends
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Add is_close_friends column to flash table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash' AND column_name = 'is_close_friends'
  ) THEN
    ALTER TABLE flash ADD COLUMN is_close_friends BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 6. Create index for close friends flashes
CREATE INDEX IF NOT EXISTS idx_flash_close_friends ON flash(is_close_friends) 
  WHERE is_close_friends = true;

-- 7. Update RLS policy for flash to include close friends logic
DROP POLICY IF EXISTS "Flash visibility" ON flash;
CREATE POLICY "Flash visibility" ON flash 
  FOR SELECT 
  USING (
    expires_at > NOW() AND is_archived = false AND (
      -- Public flashes
      visibility = 'public' OR 
      -- Own flashes
      user_id = auth.uid() OR 
      -- Follower flashes (not close friends only)
      (
        visibility = 'followers' AND 
        is_close_friends = false AND
        EXISTS (
          SELECT 1 FROM follows 
          WHERE follower_id = auth.uid() 
            AND following_id = flash.user_id
            AND status = 'active'
        )
      ) OR
      -- Close friends flashes
      (
        is_close_friends = true AND
        EXISTS (
          SELECT 1 FROM close_friends 
          WHERE user_id = flash.user_id 
            AND friend_id = auth.uid()
        )
      )
    )
  );

-- 8. Create function to add close friend
CREATE OR REPLACE FUNCTION add_close_friend(friend_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  is_following BOOLEAN;
BEGIN
  -- Check if user is following the friend
  SELECT EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() 
      AND following_id = friend_user_id
      AND status = 'active'
  ) INTO is_following;

  IF NOT is_following THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You must be following this user to add them as a close friend'
    );
  END IF;

  -- Add to close friends
  INSERT INTO close_friends (user_id, friend_id)
  VALUES (auth.uid(), friend_user_id)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  result := json_build_object(
    'success', true,
    'message', 'Added to close friends',
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to remove close friend
CREATE OR REPLACE FUNCTION remove_close_friend(friend_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_count INTEGER;
BEGIN
  DELETE FROM close_friends
  WHERE user_id = auth.uid() AND friend_id = friend_user_id;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'deleted', deleted_count > 0,
    'message', CASE 
      WHEN deleted_count > 0 THEN 'Removed from close friends'
      ELSE 'User was not in close friends'
    END,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get close friends list
CREATE OR REPLACE FUNCTION get_close_friends()
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN,
  added_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.is_verified,
    cf.created_at as added_at
  FROM close_friends cf
  JOIN profiles p ON cf.friend_id = p.id
  WHERE cf.user_id = auth.uid()
  ORDER BY cf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to check if user is close friend
CREATE OR REPLACE FUNCTION is_close_friend(friend_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_friend BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM close_friends
    WHERE user_id = auth.uid() AND friend_id = friend_user_id
  ) INTO is_friend;

  RETURN is_friend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to get close friends count
CREATE OR REPLACE FUNCTION get_close_friends_count()
RETURNS INTEGER AS $$
DECLARE
  friend_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO friend_count
  FROM close_friends
  WHERE user_id = auth.uid();

  RETURN friend_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create view for close friends flashes
CREATE OR REPLACE VIEW close_friends_flashes AS
SELECT 
  f.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_verified
FROM flash f
JOIN profiles p ON f.user_id = p.id
WHERE f.is_close_friends = true
  AND f.expires_at > NOW()
  AND f.is_archived = false
  AND (
    f.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM close_friends cf
      WHERE cf.user_id = f.user_id AND cf.friend_id = auth.uid()
    )
  );

-- 14. Grant permissions
GRANT EXECUTE ON FUNCTION add_close_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_close_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_close_friends() TO authenticated;
GRANT EXECUTE ON FUNCTION is_close_friend(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_close_friends_count() TO authenticated;
GRANT SELECT ON close_friends_flashes TO authenticated;

-- 15. Add comments for documentation
COMMENT ON TABLE close_friends IS 
  'Stores close friends relationships for private flash story sharing';

COMMENT ON FUNCTION add_close_friend(UUID) IS 
  'Adds a user to the close friends list. User must be following the friend.';

COMMENT ON FUNCTION remove_close_friend(UUID) IS 
  'Removes a user from the close friends list';

COMMENT ON FUNCTION get_close_friends() IS 
  'Returns the list of close friends with their profile information';

COMMENT ON FUNCTION is_close_friend(UUID) IS 
  'Checks if a specific user is in the close friends list';

COMMENT ON COLUMN flash.is_close_friends IS 
  'When true, flash is only visible to users in the creator''s close friends list';

-- 16. Create trigger to validate close friends flash creation
CREATE OR REPLACE FUNCTION validate_close_friends_flash()
RETURNS TRIGGER AS $$
BEGIN
  -- If creating a close friends flash, ensure user has close friends
  IF NEW.is_close_friends = true THEN
    IF NOT EXISTS (
      SELECT 1 FROM close_friends WHERE user_id = NEW.user_id
    ) THEN
      RAISE NOTICE 'Creating close friends flash with no close friends added';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_validate_close_friends_flash ON flash;
CREATE TRIGGER trigger_validate_close_friends_flash
  BEFORE INSERT ON flash
  FOR EACH ROW
  EXECUTE FUNCTION validate_close_friends_flash();
