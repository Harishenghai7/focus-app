-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS APP LAUNCH - STEP 3: FIX FOLLOWER/FOLLOWING COUNTS
-- Creates triggers to keep counts accurate in real-time
-- ═══════════════════════════════════════════════════════════════════════

-- Ensure profiles table has the count columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON follows;
DROP FUNCTION IF EXISTS update_follower_counts();

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count for the user being followed
        UPDATE profiles 
        SET followers_count = COALESCE(followers_count, 0) + 1
        WHERE id = NEW.following_id;
        
        -- Increment following count for the user doing the following
        UPDATE profiles 
        SET following_count = COALESCE(following_count, 0) + 1
        WHERE id = NEW.follower_id;
        
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count for the user being unfollowed
        UPDATE profiles 
        SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
        WHERE id = OLD.following_id;
        
        -- Decrement following count for the user doing the unfollowing
        UPDATE profiles 
        SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
        WHERE id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_update_follower_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- Fix existing counts to match actual data
UPDATE profiles p SET
    followers_count = (
        SELECT COUNT(*) FROM follows 
        WHERE following_id = p.id
    ),
    following_count = (
        SELECT COUNT(*) FROM follows 
        WHERE follower_id = p.id
    );

-- Verify counts are now accurate
SELECT 
    p.id,
    p.username,
    p.followers_count,
    p.following_count,
    (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as actual_followers,
    (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) as actual_following
FROM profiles p
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Follower/Following count triggers created!';
    RAISE NOTICE '   - Counts will update automatically on follow/unfollow';
    RAISE NOTICE '   - Existing counts have been recalculated';
END $$;
