-- Migration: Implement follower/following counts with database triggers
-- Task: 9.3 Implement follower/following counts
-- This migration ensures accurate follower/following counts are maintained via triggers

-- Step 1: Ensure count columns exist in profiles table
-- (These should already exist, but we'll add them if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN followers_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'following_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN following_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Step 2: Create or replace the trigger function to update follower/following counts
-- This function handles INSERT and DELETE operations on the follows table
-- It only counts 'active' follows, not 'pending' follow requests
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only increment counts for active follows (not pending requests)
    IF NEW.status = 'active' THEN
      -- Increment follower count for the user being followed
      UPDATE profiles 
      SET followers_count = followers_count + 1 
      WHERE id = NEW.following_id;
      
      -- Increment following count for the user who is following
      UPDATE profiles 
      SET following_count = following_count + 1 
      WHERE id = NEW.follower_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement counts if the deleted follow was active
    IF OLD.status = 'active' THEN
      -- Decrement follower count for the user being unfollowed
      UPDATE profiles 
      SET followers_count = GREATEST(0, followers_count - 1) 
      WHERE id = OLD.following_id;
      
      -- Decrement following count for the user who is unfollowing
      UPDATE profiles 
      SET following_count = GREATEST(0, following_count - 1) 
      WHERE id = OLD.follower_id;
    END IF;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes (e.g., pending -> active when request is approved)
    IF OLD.status != NEW.status THEN
      IF OLD.status = 'pending' AND NEW.status = 'active' THEN
        -- Follow request was approved, increment counts
        UPDATE profiles 
        SET followers_count = followers_count + 1 
        WHERE id = NEW.following_id;
        
        UPDATE profiles 
        SET following_count = following_count + 1 
        WHERE id = NEW.follower_id;
        
      ELSIF OLD.status = 'active' AND NEW.status = 'pending' THEN
        -- Follow was downgraded to pending (rare case), decrement counts
        UPDATE profiles 
        SET followers_count = GREATEST(0, followers_count - 1) 
        WHERE id = NEW.following_id;
        
        UPDATE profiles 
        SET following_count = GREATEST(0, following_count - 1) 
        WHERE id = NEW.follower_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS follow_count_trigger ON follows;
CREATE TRIGGER follow_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Step 4: Recalculate and update all follower/following counts to ensure accuracy
-- This corrects any discrepancies in existing data
UPDATE profiles p
SET 
  followers_count = (
    SELECT COUNT(*) 
    FROM follows 
    WHERE following_id = p.id 
    AND status = 'active'
  ),
  following_count = (
    SELECT COUNT(*) 
    FROM follows 
    WHERE follower_id = p.id 
    AND status = 'active'
  );

-- Step 5: Add indexes for performance optimization
-- These indexes speed up count queries and follow status checks
CREATE INDEX IF NOT EXISTS idx_follows_following_status 
  ON follows(following_id, status);

CREATE INDEX IF NOT EXISTS idx_follows_follower_status 
  ON follows(follower_id, status);

-- Step 6: Add a check constraint to ensure counts are never negative
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS check_followers_count_non_negative;

ALTER TABLE profiles 
  ADD CONSTRAINT check_followers_count_non_negative 
  CHECK (followers_count >= 0);

ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS check_following_count_non_negative;

ALTER TABLE profiles 
  ADD CONSTRAINT check_following_count_non_negative 
  CHECK (following_count >= 0);

-- Step 7: Create a function to manually recalculate counts if needed
-- This can be called if counts ever get out of sync
CREATE OR REPLACE FUNCTION recalculate_follow_counts(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    followers_count = (
      SELECT COUNT(*) 
      FROM follows 
      WHERE following_id = user_id 
      AND status = 'active'
    ),
    following_count = (
      SELECT COUNT(*) 
      FROM follows 
      WHERE follower_id = user_id 
      AND status = 'active'
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Migration complete
-- The follower/following counts are now:
-- 1. Cached in the profiles table for fast access
-- 2. Automatically updated via database triggers
-- 3. Only count 'active' follows (not pending requests)
-- 4. Protected from going negative
-- 5. Can be manually recalculated if needed
