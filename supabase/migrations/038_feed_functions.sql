-- ═══════════════════════════════════════════════════════════════════════
-- HOME FEED DATABASE FUNCTIONS
-- Migration: 038_feed_functions.sql
-- Description: Optimized RPC functions for home feed with all post details
-- ═══════════════════════════════════════════════════════════════════════

-- Get feed posts with all details (optimized single query)
CREATE OR REPLACE FUNCTION get_feed_posts(
  current_user_id UUID,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  caption TEXT,
  media_urls TEXT[],
  media_types VARCHAR[],
  media_type VARCHAR,
  location VARCHAR,
  created_at TIMESTAMPTZ,
  username VARCHAR,
  avatar_url TEXT,
  verified BOOLEAN,
  is_verified BOOLEAN,
  full_name VARCHAR,
  likes_count BIGINT,
  like_count BIGINT,
  comments_count BIGINT,
  comment_count BIGINT,
  saves_count BIGINT,
  is_liked BOOLEAN,
  user_has_liked BOOLEAN,
  is_saved BOOLEAN,
  user_has_saved BOOLEAN,
  likes_hidden BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.caption,
    p.media_urls,
    p.media_types,
    COALESCE(p.media_types[1], 'image')::VARCHAR as media_type,
    p.location,
    p.created_at,
    prof.username,
    prof.avatar_url,
    COALESCE(prof.verified, false) as verified,
    COALESCE(prof.verified, false) as is_verified,
    prof.full_name,
    COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0)::BIGINT as likes_count,
    COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0)::BIGINT as like_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL), 0)::BIGINT as comments_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL), 0)::BIGINT as comment_count,
    COALESCE((SELECT COUNT(*) FROM saves WHERE post_id = p.id), 0)::BIGINT as saves_count,
    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = current_user_id) as is_liked,
    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = current_user_id) as user_has_liked,
    EXISTS(SELECT 1 FROM saves WHERE post_id = p.id AND user_id = current_user_id) as is_saved,
    EXISTS(SELECT 1 FROM saves WHERE post_id = p.id AND user_id = current_user_id) as user_has_saved,
    COALESCE(p.likes_hidden, false) as likes_hidden
  FROM posts p
  INNER JOIN profiles prof ON p.user_id = prof.id
  WHERE p.deleted_at IS NULL 
    AND p.type = 'post'
    AND (
      p.user_id = current_user_id 
      OR p.user_id IN (
        SELECT following_id 
        FROM follows 
        WHERE follower_id = current_user_id
      )
    )
    AND p.user_id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = current_user_id
      UNION 
      SELECT blocker_id FROM blocked_users WHERE blocked_id = current_user_id
    )
  ORDER BY p.created_at DESC
  LIMIT limit_count 
  OFFSET offset_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_feed_posts(UUID, INT, INT) TO authenticated;

-- Get single post details (for real-time updates)
CREATE OR REPLACE FUNCTION get_post_details(
  post_id UUID,
  current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  caption TEXT,
  media_urls TEXT[],
  media_types VARCHAR[],
  media_type VARCHAR,
  location VARCHAR,
  created_at TIMESTAMPTZ,
  username VARCHAR,
  avatar_url TEXT,
  verified BOOLEAN,
  is_verified BOOLEAN,
  full_name VARCHAR,
  likes_count BIGINT,
  like_count BIGINT,
  comments_count BIGINT,
  comment_count BIGINT,
  saves_count BIGINT,
  is_liked BOOLEAN,
  user_has_liked BOOLEAN,
  is_saved BOOLEAN,
  user_has_saved BOOLEAN,
  likes_hidden BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.caption,
    p.media_urls,
    p.media_types,
    COALESCE(p.media_types[1], 'image')::VARCHAR as media_type,
    p.location,
    p.created_at,
    prof.username,
    prof.avatar_url,
    COALESCE(prof.verified, false) as verified,
    COALESCE(prof.verified, false) as is_verified,
    prof.full_name,
    COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0)::BIGINT as likes_count,
    COALESCE((SELECT COUNT(*) FROM likes WHERE post_id = p.id), 0)::BIGINT as like_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL), 0)::BIGINT as comments_count,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL), 0)::BIGINT as comment_count,
    COALESCE((SELECT COUNT(*) FROM saves WHERE post_id = p.id), 0)::BIGINT as saves_count,
    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = current_user_id) as is_liked,
    EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = current_user_id) as user_has_liked,
    EXISTS(SELECT 1 FROM saves WHERE post_id = p.id AND user_id = current_user_id) as is_saved,
    EXISTS(SELECT 1 FROM saves WHERE post_id = p.id AND user_id = current_user_id) as user_has_saved,
    COALESCE(p.likes_hidden, false) as likes_hidden
  FROM posts p
  INNER JOIN profiles prof ON p.user_id = prof.id
  WHERE p.id = post_id
    AND p.deleted_at IS NULL;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_post_details(UUID, UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON posts(created_at DESC) WHERE deleted_at IS NULL AND type = 'post';
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_saves_post_user ON saves(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id, blocked_id);
