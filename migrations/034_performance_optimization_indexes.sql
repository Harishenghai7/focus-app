-- Performance Optimization: Composite Indexes and Query Optimization
-- Migration 034: Add composite indexes for common query patterns

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Posts: User + Created At (for user profile feeds)
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON posts(user_id, created_at DESC) 
WHERE is_draft = false;

-- Posts: Created At + User (for home feed with user info)
CREATE INDEX IF NOT EXISTS idx_posts_created_user 
ON posts(created_at DESC, user_id) 
WHERE is_draft = false;

-- Follows: Follower + Status (for checking follow status)
CREATE INDEX IF NOT EXISTS idx_follows_follower_status 
ON follows(follower_id, status, following_id);

-- Follows: Following + Status (for getting followers)
CREATE INDEX IF NOT EXISTS idx_follows_following_status 
ON follows(following_id, status, follower_id);

-- Likes: Content + User (for checking if user liked content)
CREATE INDEX IF NOT EXISTS idx_likes_content_user 
ON likes(content_id, content_type, user_id);

-- Likes: User + Content Type (for user's liked content)
CREATE INDEX IF NOT EXISTS idx_likes_user_type 
ON likes(user_id, content_type, content_id);

-- Comments: Content + Created (for comment threads)
CREATE INDEX IF NOT EXISTS idx_comments_content_created 
ON comments(content_id, content_type, created_at DESC);

-- Comments: Parent + Created (for nested replies)
CREATE INDEX IF NOT EXISTS idx_comments_parent_created 
ON comments(parent_id, created_at ASC) 
WHERE parent_id IS NOT NULL;

-- Notifications: User + Read + Created (for notification feed)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

-- Notifications: User + Type + Created (for filtered notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created 
ON notifications(user_id, type, created_at DESC);

-- Messages: Conversation + Created (for message threads)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Messages: Sender + Created (for sent messages)
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Flashes: User + Expires (for active stories)
CREATE INDEX IF NOT EXISTS idx_flashes_user_expires 
ON flashes(user_id, expires_at DESC) 
WHERE expires_at > NOW();

-- Flashes: Expires At (for cleanup job)
CREATE INDEX IF NOT EXISTS idx_flashes_expires_cleanup 
ON flashes(expires_at) 
WHERE expires_at <= NOW();

-- Boltz: User + Created (for user's boltz feed)
CREATE INDEX IF NOT EXISTS idx_boltz_user_created 
ON boltz(user_id, created_at DESC);

-- Boltz: Created At (for discover feed)
CREATE INDEX IF NOT EXISTS idx_boltz_created 
ON boltz(created_at DESC);

-- Saves: User + Created (for saved posts)
CREATE INDEX IF NOT EXISTS idx_saves_user_created 
ON saves(user_id, created_at DESC);

-- Saves: Post + User (for checking if post is saved)
CREATE INDEX IF NOT EXISTS idx_saves_post_user 
ON saves(post_id, user_id);

-- ============================================================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================================================

-- Active follow requests only
CREATE INDEX IF NOT EXISTS idx_follows_pending_requests 
ON follows(following_id, created_at DESC) 
WHERE status = 'pending';

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- Scheduled posts only
CREATE INDEX IF NOT EXISTS idx_posts_scheduled 
ON posts(scheduled_for ASC) 
WHERE is_draft = true AND scheduled_for IS NOT NULL;

-- Private profiles only
CREATE INDEX IF NOT EXISTS idx_profiles_private 
ON profiles(id) 
WHERE is_private = true;

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Posts: Caption search
CREATE INDEX IF NOT EXISTS idx_posts_caption_search 
ON posts USING gin(to_tsvector('english', caption));

-- Profiles: Username and full name search
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(
  to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
);

-- Comments: Text search
CREATE INDEX IF NOT EXISTS idx_comments_text_search 
ON comments USING gin(to_tsvector('english', text));

-- ============================================================================
-- COVERING INDEXES (Include columns for index-only scans)
-- ============================================================================

-- Posts with like count (for feed display)
CREATE INDEX IF NOT EXISTS idx_posts_feed_display 
ON posts(user_id, created_at DESC) 
INCLUDE (caption, media_url, like_count, comment_count) 
WHERE is_draft = false;

-- Profiles with counts (for profile display)
CREATE INDEX IF NOT EXISTS idx_profiles_display 
ON profiles(username) 
INCLUDE (full_name, avatar_url, follower_count, following_count, post_count);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE posts;
ANALYZE profiles;
ANALYZE follows;
ANALYZE likes;
ANALYZE comments;
ANALYZE notifications;
ANALYZE messages;
ANALYZE flashes;
ANALYZE boltz;
ANALYZE saves;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_posts_user_created IS 'Optimizes user profile feed queries';
COMMENT ON INDEX idx_follows_follower_status IS 'Optimizes follow status checks';
COMMENT ON INDEX idx_notifications_user_read_created IS 'Optimizes notification feed queries';
COMMENT ON INDEX idx_posts_caption_search IS 'Enables full-text search on post captions';
COMMENT ON INDEX idx_profiles_search IS 'Enables full-text search on usernames and names';
