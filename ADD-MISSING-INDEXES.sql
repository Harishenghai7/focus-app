-- ============================================
-- ADD MISSING INDEXES - Performance Optimization
-- ============================================
-- Run this to add critical indexes for better performance
-- These indexes will dramatically improve query speed at scale
-- ============================================

-- ============================================
-- SINGLE COLUMN INDEXES
-- ============================================

-- Boltz indexes
CREATE INDEX IF NOT EXISTS idx_boltz_user_id ON boltz(user_id);
CREATE INDEX IF NOT EXISTS idx_boltz_created_at ON boltz(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boltz_views ON boltz(views_count DESC);

-- Flashes indexes
CREATE INDEX IF NOT EXISTS idx_flashes_expires ON flashes(expires_at);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Likes indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- Saves indexes
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_content ON saves(content_id, content_type);

-- Notifications indexes (already exist, but verify)
-- CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Messages indexes (already exist, but add more)
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================
-- COMPOSITE INDEXES (for common queries)
-- ============================================

-- Likes: Check if user liked specific content
CREATE INDEX IF NOT EXISTS idx_likes_content_user 
ON likes(content_id, content_type, user_id);

-- Comments: Get comments for content, ordered by date
CREATE INDEX IF NOT EXISTS idx_comments_content_created 
ON comments(content_id, content_type, created_at DESC);

-- Follows: Check if user follows another user
CREATE INDEX IF NOT EXISTS idx_follows_both 
ON follows(follower_id, following_id);

-- Posts: Get user's non-archived posts
CREATE INDEX IF NOT EXISTS idx_posts_user_archived 
ON posts(user_id, is_archived, created_at DESC);

-- Boltz: Get user's boltz ordered by date
CREATE INDEX IF NOT EXISTS idx_boltz_user_created 
ON boltz(user_id, created_at DESC);

-- Flashes: Get non-expired flashes for user
CREATE INDEX IF NOT EXISTS idx_flashes_user_expires 
ON flashes(user_id, expires_at DESC);

-- Notifications: Get unread notifications for user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

-- Messages: Get messages in chat ordered by date
CREATE INDEX IF NOT EXISTS idx_messages_chat_created 
ON messages(chat_id, created_at DESC);

-- Saves: Check if user saved specific content
CREATE INDEX IF NOT EXISTS idx_saves_user_content 
ON saves(user_id, content_id, content_type);

-- ============================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================

-- Posts: Search by caption
CREATE INDEX IF NOT EXISTS idx_posts_caption_fts 
ON posts USING gin(to_tsvector('english', COALESCE(caption, '')));

-- Profiles: Search by username
CREATE INDEX IF NOT EXISTS idx_profiles_username_fts 
ON profiles USING gin(to_tsvector('english', username));

-- Profiles: Search by full name
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_fts 
ON profiles USING gin(to_tsvector('english', COALESCE(full_name, '')));

-- Boltz: Search by caption
CREATE INDEX IF NOT EXISTS idx_boltz_caption_fts 
ON boltz USING gin(to_tsvector('english', COALESCE(caption, '')));

-- ============================================
-- PARTIAL INDEXES (for specific conditions)
-- ============================================

-- Only index non-archived posts
CREATE INDEX IF NOT EXISTS idx_posts_active 
ON posts(created_at DESC) 
WHERE is_archived = FALSE;

-- Only index unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = FALSE;

-- Only index private profiles
CREATE INDEX IF NOT EXISTS idx_profiles_private 
ON profiles(id) 
WHERE is_private = TRUE;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('posts', 'boltz', 'flashes', 'comments', 'likes', 'follows', 'messages', 'notifications', 'saves', 'profiles')
ORDER BY tablename, indexname;

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE posts;
ANALYZE boltz;
ANALYZE flashes;
ANALYZE comments;
ANALYZE likes;
ANALYZE follows;
ANALYZE messages;
ANALYZE notifications;
ANALYZE saves;
ANALYZE profiles;

-- ============================================
-- DONE! ✅
-- ============================================
-- All performance indexes have been added!
-- Your queries should be significantly faster now.
-- ============================================
