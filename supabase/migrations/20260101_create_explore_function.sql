-- ============================================================================
-- COMPLETE EXPLORE PAGE FIX - CORRECTED VERSION
-- Uses media_url (singular) not media_urls (plural)
-- Drops existing function first to avoid conflicts
-- ============================================================================

-- Step 1: Drop existing function if it exists
DROP FUNCTION IF EXISTS get_explore_posts(integer);

-- Step 2: Add missing columns to posts table if they don't exist
DO $$ 
BEGIN
    -- Add likes_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'likes_count') THEN
        ALTER TABLE posts ADD COLUMN likes_count BIGINT DEFAULT 0;
    END IF;
    
    -- Add comments_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'comments_count') THEN
        ALTER TABLE posts ADD COLUMN comments_count BIGINT DEFAULT 0;
    END IF;
    
    -- Add thumbnail_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE posts ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Step 3: Create the get_explore_posts function
CREATE OR REPLACE FUNCTION get_explore_posts(limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username VARCHAR,
  avatar_url TEXT,
  verified BOOLEAN,
  full_name VARCHAR,
  media_url TEXT,
  media_type VARCHAR,
  content TEXT,
  caption TEXT,
  location VARCHAR,
  like_count BIGINT,
  comment_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    prof.username,
    prof.avatar_url,
    prof.verified,
    prof.full_name,
    p.media_url,
    p.media_type,
    p.content,
    p.caption,
    p.location,
    COALESCE((SELECT COUNT(*)::BIGINT FROM likes WHERE post_id = p.id), 0) as like_count,
    COALESCE((SELECT COUNT(*)::BIGINT FROM comments WHERE post_id = p.id AND deleted_at IS NULL), 0) as comment_count,
    p.created_at
  FROM posts p
  INNER JOIN profiles prof ON p.user_id = prof.id
  WHERE p.deleted_at IS NULL 
    AND (p.type = 'post' OR p.type = 'image')
    AND p.media_url IS NOT NULL
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_explore_posts TO authenticated, anon;

-- Step 5: Create function to update cached counts (optional but recommended)
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update likes_count
    UPDATE posts 
    SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers for auto-updating counts (optional)
DROP TRIGGER IF EXISTS update_post_likes_count ON likes;
CREATE TRIGGER update_post_likes_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_counts();

-- Step 7: Initial population of counts
UPDATE posts 
SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
    comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id AND deleted_at IS NULL)
WHERE likes_count IS NULL OR comments_count IS NULL;

-- Add comments
COMMENT ON FUNCTION get_explore_posts IS 'Fetches posts with media for the Explore page, including user profile data and engagement counts';
COMMENT ON FUNCTION update_post_counts IS 'Automatically updates cached engagement counts on posts';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Explore page migration completed successfully!';
END $$;
