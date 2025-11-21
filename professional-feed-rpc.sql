-- Professional Feed RPC with Signed URLs
CREATE OR REPLACE FUNCTION public.get_feed_with_media(page_limit integer DEFAULT 10, cursor_time timestamptz DEFAULT NULL)
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  content text,
  image_url text,
  video_url text,
  media_paths text[],
  media_types text[],
  thumbnail_paths text[],
  visibility text,
  created_at timestamptz,
  username text,
  full_name text,
  avatar_url text,
  verified boolean,
  is_liked_by_me boolean,
  likes_count bigint,
  comments_count bigint,
  is_saved_by_me boolean,
  is_following boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as post_id,
    p.user_id,
    p.content,
    p.image_url,
    p.video_url,
    p.media_paths,
    p.media_types,
    p.thumbnail_paths,
    p.visibility,
    p.created_at,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.verified,
    EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = auth.uid()) as is_liked_by_me,
    COALESCE(p.likes_count, 0) as likes_count,
    COALESCE(p.comments_count, 0) as comments_count,
    EXISTS (SELECT 1 FROM saves s WHERE s.post_id = p.id AND s.user_id = auth.uid()) as is_saved_by_me,
    EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = auth.uid() AND f.following_id = p.user_id) as is_following
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.created_at < COALESCE(cursor_time, now())
    AND (
      p.visibility = 'public'
      OR p.user_id = auth.uid()
      OR (
        p.visibility = 'followers' AND EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = auth.uid() AND f.following_id = p.user_id
        )
      )
    )
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b 
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
    )
  ORDER BY p.created_at DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signed URLs for media
CREATE OR REPLACE FUNCTION public.get_signed_media_urls(media_paths text[])
RETURNS text[] AS $$
DECLARE
  signed_urls text[] := '{}';
  media_path text;
BEGIN
  FOREACH media_path IN ARRAY media_paths
  LOOP
    -- This would typically call Supabase Storage API
    -- For now, return the path as-is (implement signed URL logic as needed)
    signed_urls := array_append(signed_urls, media_path);
  END LOOP;
  
  RETURN signed_urls;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update posts table to include counters for performance
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0;

-- Triggers to maintain counters
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_likes_count ON likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_update_comments_count ON comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Initialize existing counters
UPDATE posts SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id)
WHERE likes_count IS NULL OR comments_count IS NULL;

COMMIT;