-- ENHANCED HOME FEED SYSTEM
-- Update posts table for professional feed
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_paths text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_types text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail_paths text[];
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'));

-- Create saves table (if not exists)
CREATE TABLE IF NOT EXISTS saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on saves
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Saves policies
CREATE POLICY "Users can view own saves" ON saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON saves FOR DELETE USING (auth.uid() = user_id);

-- Enhanced posts policy for visibility
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts visible to auth users" ON posts FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (
    visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows f
      WHERE f.follower_id = auth.uid() AND f.following_id = posts.user_id
    )
  )
);

-- Professional feed RPC function
CREATE OR REPLACE FUNCTION public.get_feed(page_limit integer DEFAULT 10, cursor_time timestamptz DEFAULT NULL)
RETURNS TABLE (
  post_id uuid,
  user_id uuid,
  content text,
  image_url text,
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
  ORDER BY p.created_at DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
CREATE INDEX IF NOT EXISTS idx_saves_user_post ON saves(user_id, post_id);

COMMIT;