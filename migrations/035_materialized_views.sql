-- Performance Optimization: Materialized Views for Aggregations
-- Migration 035: Create materialized views for expensive queries

-- ============================================================================
-- USER STATISTICS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
  p.id,
  p.username,
  COUNT(DISTINCT posts.id) FILTER (WHERE posts.is_draft = false) as post_count,
  COUNT(DISTINCT boltz.id) as boltz_count,
  COUNT(DISTINCT flashes.id) FILTER (WHERE flashes.expires_at > NOW()) as active_flash_count,
  COUNT(DISTINCT followers.id) FILTER (WHERE followers.status = 'active') as follower_count,
  COUNT(DISTINCT following.id) FILTER (WHERE following.status = 'active') as following_count,
  COALESCE(SUM(posts.like_count), 0) as total_likes_received,
  COALESCE(SUM(posts.comment_count), 0) as total_comments_received,
  MAX(posts.created_at) as last_post_at,
  MAX(p.last_active_at) as last_active_at
FROM profiles p
LEFT JOIN posts ON posts.user_id = p.id
LEFT JOIN boltz ON boltz.user_id = p.id
LEFT JOIN flashes ON flashes.user_id = p.id
LEFT JOIN follows followers ON followers.following_id = p.id
LEFT JOIN follows following ON following.follower_id = p.id
GROUP BY p.id, p.username;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_id ON user_stats(id);
CREATE INDEX IF NOT EXISTS idx_user_stats_username ON user_stats(username);
CREATE INDEX IF NOT EXISTS idx_user_stats_followers ON user_stats(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_posts ON user_stats(post_count DESC);

COMMENT ON MATERIALIZED VIEW user_stats IS 'Aggregated user statistics for profile display';

-- ============================================================================
-- TRENDING CONTENT MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS trending_content AS
SELECT 
  p.id,
  p.user_id,
  p.caption,
  p.media_url,
  p.media_urls,
  p.is_carousel,
  p.like_count,
  p.comment_count,
  p.view_count,
  p.created_at,
  'post' as content_type,
  -- Trending score: weighted by engagement and recency
  (
    (p.like_count * 2) + 
    (p.comment_count * 3) + 
    (p.view_count * 0.1) +
    (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 * -0.5)
  ) as trending_score
FROM posts p
WHERE 
  p.is_draft = false 
  AND p.created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  b.id,
  b.user_id,
  b.caption,
  b.video_url as media_url,
  NULL as media_urls,
  false as is_carousel,
  b.like_count,
  b.comment_count,
  b.view_count,
  b.created_at,
  'boltz' as content_type,
  (
    (b.like_count * 2) + 
    (b.comment_count * 3) + 
    (b.view_count * 0.1) +
    (EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 3600 * -0.5)
  ) as trending_score
FROM boltz b
WHERE b.created_at > NOW() - INTERVAL '7 days'
ORDER BY trending_score DESC
LIMIT 100;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_trending_content_score ON trending_content(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_content_type ON trending_content(content_type, trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_content_created ON trending_content(created_at DESC);

COMMENT ON MATERIALIZED VIEW trending_content IS 'Top trending posts and boltz for explore page';

-- ============================================================================
-- TRENDING HASHTAGS MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS trending_hashtags AS
WITH hashtag_usage AS (
  SELECT 
    LOWER(TRIM(hashtag)) as tag,
    COUNT(*) as usage_count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_usage,
    MAX(created_at) as last_used_at
  FROM (
    -- Extract hashtags from post captions
    SELECT 
      regexp_matches(caption, '#(\w+)', 'g') as hashtag_match,
      created_at
    FROM posts
    WHERE 
      caption IS NOT NULL 
      AND is_draft = false
      AND created_at > NOW() - INTERVAL '30 days'
    UNION ALL
    -- Extract hashtags from boltz captions
    SELECT 
      regexp_matches(caption, '#(\w+)', 'g') as hashtag_match,
      created_at
    FROM boltz
    WHERE 
      caption IS NOT NULL
      AND created_at > NOW() - INTERVAL '30 days'
    UNION ALL
    -- Extract hashtags from comments
    SELECT 
      regexp_matches(text, '#(\w+)', 'g') as hashtag_match,
      created_at
    FROM comments
    WHERE 
      text IS NOT NULL
      AND created_at > NOW() - INTERVAL '30 days'
  ) hashtag_extracts(hashtag_match, created_at)
  CROSS JOIN LATERAL unnest(hashtag_match) as hashtag
  GROUP BY LOWER(TRIM(hashtag))
  HAVING COUNT(*) >= 3  -- Minimum 3 uses to be considered
)
SELECT 
  tag,
  usage_count as post_count,
  recent_usage,
  last_used_at,
  -- Trending score: weighted by recent usage and total usage
  (recent_usage * 10 + usage_count) as trending_score
FROM hashtag_usage
ORDER BY trending_score DESC
LIMIT 50;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_hashtags_tag ON trending_hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_score ON trending_hashtags(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_count ON trending_hashtags(post_count DESC);

COMMENT ON MATERIALIZED VIEW trending_hashtags IS 'Top trending hashtags based on recent usage';

-- ============================================================================
-- NOTIFICATION SUMMARY MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS notification_summary AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type = 'like') as like_count,
  COUNT(*) FILTER (WHERE type = 'comment') as comment_count,
  COUNT(*) FILTER (WHERE type = 'follow') as follow_count,
  COUNT(*) FILTER (WHERE type = 'mention') as mention_count,
  MAX(created_at) as last_notification_at,
  MAX(created_at) FILTER (WHERE is_read = false) as last_unread_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_summary_user ON notification_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_summary_unread ON notification_summary(unread_count DESC);

COMMENT ON MATERIALIZED VIEW notification_summary IS 'Aggregated notification counts per user';

-- ============================================================================
-- REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_content;
  REFRESH MATERIALIZED VIEW CONCURRENTLY trending_hashtags;
  REFRESH MATERIALIZED VIEW CONCURRENTLY notification_summary;
  
  RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_materialized_views IS 'Refresh all materialized views concurrently';

-- Function to refresh user stats for specific user
CREATE OR REPLACE FUNCTION refresh_user_stats(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- For now, refresh entire view (can be optimized with incremental updates)
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_user_stats IS 'Refresh user statistics for a specific user';

-- ============================================================================
-- SCHEDULED REFRESH (requires pg_cron extension)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- Uncomment if pg_cron is available:

-- Refresh user stats every 5 minutes
-- SELECT cron.schedule('refresh-user-stats', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats');

-- Refresh trending content every 15 minutes
-- SELECT cron.schedule('refresh-trending-content', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY trending_content');

-- Refresh trending hashtags every 30 minutes
-- SELECT cron.schedule('refresh-trending-hashtags', '*/30 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY trending_hashtags');

-- Refresh notification summary every 10 minutes
-- SELECT cron.schedule('refresh-notification-summary', '*/10 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY notification_summary');

-- ============================================================================
-- INITIAL REFRESH
-- ============================================================================

-- Perform initial refresh of all views
SELECT refresh_all_materialized_views();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant select permissions to authenticated users
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON trending_content TO authenticated;
GRANT SELECT ON trending_hashtags TO authenticated;
GRANT SELECT ON notification_summary TO authenticated;
