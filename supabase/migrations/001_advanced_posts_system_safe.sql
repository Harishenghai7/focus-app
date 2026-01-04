-- Advanced Posts System Migration (Safe Version)
-- This migration is idempotent - can be run multiple times safely

-- ============================================
-- 1. POSTS TABLE MIGRATION
-- ============================================

-- Add new columns to existing posts table (IF NOT EXISTS prevents errors)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='media_types') THEN
        ALTER TABLE posts ADD COLUMN media_types jsonb DEFAULT '["image"]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='aspect_ratio') THEN
        ALTER TABLE posts ADD COLUMN aspect_ratio text DEFAULT 'original';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='is_reel') THEN
        ALTER TABLE posts ADD COLUMN is_reel boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='music_id') THEN
        ALTER TABLE posts ADD COLUMN music_id uuid;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='visibility') THEN
        ALTER TABLE posts ADD COLUMN visibility text DEFAULT 'public';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='comments_disabled') THEN
        ALTER TABLE posts ADD COLUMN comments_disabled boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes_hidden') THEN
        ALTER TABLE posts ADD COLUMN likes_hidden boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='location') THEN
        ALTER TABLE posts ADD COLUMN location text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='tagged_users') THEN
        ALTER TABLE posts ADD COLUMN tagged_users jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='deleted_at') THEN
        ALTER TABLE posts ADD COLUMN deleted_at timestamp with time zone;
    END IF;
END $$;

-- Add check constraint (DROP IF EXISTS first)
DO $$ 
BEGIN
    ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
    ALTER TABLE posts ADD CONSTRAINT posts_visibility_check 
    CHECK (visibility IN ('public', 'followers', 'close_friends', 'private'));
END $$;

-- ============================================
-- 2. POST LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at DESC);

-- ============================================
-- 3. POST COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
    text text NOT NULL CHECK (char_length(text) <= 2200),
    mentioned_users jsonb DEFAULT '[]'::jsonb,
    likes_count integer DEFAULT 0,
    replies_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    CHECK (text IS NOT NULL AND text != '')
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments(created_at DESC);

-- ============================================
-- 4. COMMENT LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS comment_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- ============================================
-- 5. POST SAVES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_saves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    collection_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_collection_id ON post_saves(collection_id);

-- ============================================
-- 6. POST SHARES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    share_type text NOT NULL CHECK (share_type IN ('dm', 'story', 'external', 'copy_link')),
    recipient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_user_id ON post_shares(user_id);

-- ============================================
-- 7. POST ANALYTICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS post_analytics (
    post_id uuid PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    saves_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    engagement_rate float DEFAULT 0,
    reach integer DEFAULT 0,
    impressions integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 8. DATABASE FUNCTIONS (CREATE OR REPLACE)
-- ============================================

CREATE OR REPLACE FUNCTION increment_post_likes(post_uuid uuid, increment_value integer)
RETURNS void AS $$
BEGIN
    INSERT INTO post_analytics (post_id, likes_count)
    VALUES (post_uuid, increment_value)
    ON CONFLICT (post_id) 
    DO UPDATE SET 
        likes_count = post_analytics.likes_count + increment_value,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_comments(post_uuid uuid, increment_value integer)
RETURNS void AS $$
BEGIN
    INSERT INTO post_analytics (post_id, comments_count)
    VALUES (post_uuid, increment_value)
    ON CONFLICT (post_id) 
    DO UPDATE SET 
        comments_count = post_analytics.comments_count + increment_value,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_saves(post_uuid uuid, increment_value integer)
RETURNS void AS $$
BEGIN
    INSERT INTO post_analytics (post_id, saves_count)
    VALUES (post_uuid, increment_value)
    ON CONFLICT (post_id) 
    DO UPDATE SET 
        saves_count = post_analytics.saves_count + increment_value,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_shares(post_uuid uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO post_analytics (post_id, shares_count)
    VALUES (post_uuid, 1)
    ON CONFLICT (post_id) 
    DO UPDATE SET 
        shares_count = post_analytics.shares_count + 1,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_engagement_rate(post_uuid uuid)
RETURNS float AS $$
DECLARE
    total_engagement integer;
    total_views integer;
    rate float;
BEGIN
    SELECT 
        COALESCE(likes_count, 0) + COALESCE(comments_count, 0) + COALESCE(saves_count, 0) + COALESCE(shares_count, 0),
        COALESCE(views_count, 0)
    INTO total_engagement, total_views
    FROM post_analytics
    WHERE post_id = post_uuid;
    
    IF total_views > 0 THEN
        rate := (total_engagement::float / total_views::float) * 100;
    ELSE
        rate := 0;
    END IF;
    
    UPDATE post_analytics 
    SET engagement_rate = rate, updated_at = now()
    WHERE post_id = post_uuid;
    
    RETURN rate;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS (CREATE OR REPLACE)
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM increment_post_comments(NEW.post_id, 1);
        
        IF NEW.parent_comment_id IS NOT NULL THEN
            UPDATE post_comments 
            SET replies_count = replies_count + 1
            WHERE id = NEW.parent_comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM increment_post_comments(OLD.post_id, -1);
        
        IF OLD.parent_comment_id IS NOT NULL THEN
            UPDATE post_comments 
            SET replies_count = GREATEST(replies_count - 1, 0)
            WHERE id = OLD.parent_comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_count ON post_comments;
CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post_comments 
        SET likes_count = likes_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post_comments 
        SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;

-- DROP existing policies first, then recreate
DROP POLICY IF EXISTS "Users can view all post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
DROP POLICY IF EXISTS "Users can unlike their own likes" ON post_likes;

CREATE POLICY "Users can view all post likes"
ON post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON post_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON post_likes FOR DELETE
USING (auth.uid() = user_id);

-- POST COMMENTS POLICIES
DROP POLICY IF EXISTS "Users can view non-deleted comments" ON post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
DROP POLICY IF EXISTS "Users can soft delete their own comments" ON post_comments;

CREATE POLICY "Users can view non-deleted comments"
ON post_comments FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Users can create comments"
ON post_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON post_comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own comments"
ON post_comments FOR DELETE
USING (auth.uid() = user_id);

-- COMMENT LIKES POLICIES
DROP POLICY IF EXISTS "Users can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

CREATE POLICY "Users can view comment likes"
ON comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like comments"
ON comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
ON comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- POST SAVES POLICIES
DROP POLICY IF EXISTS "Users can view their own saves" ON post_saves;
DROP POLICY IF EXISTS "Users can save posts" ON post_saves;
DROP POLICY IF EXISTS "Users can unsave posts" ON post_saves;

CREATE POLICY "Users can view their own saves"
ON post_saves FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
ON post_saves FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
ON post_saves FOR DELETE
USING (auth.uid() = user_id);

-- POST SHARES POLICIES
DROP POLICY IF EXISTS "Users can view their own shares" ON post_shares;
DROP POLICY IF EXISTS "Users can share posts" ON post_shares;

CREATE POLICY "Users can view their own shares"
ON post_shares FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can share posts"
ON post_shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- POST ANALYTICS POLICIES
DROP POLICY IF EXISTS "Users can view post analytics" ON post_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON post_analytics;

CREATE POLICY "Users can view post analytics"
ON post_analytics FOR SELECT
USING (true);

CREATE POLICY "System can update analytics"
ON post_analytics FOR ALL
USING (true);

-- ============================================
-- 11. INITIALIZE ANALYTICS FOR EXISTING POSTS
-- ============================================

INSERT INTO post_analytics (post_id, likes_count, comments_count, saves_count, shares_count)
SELECT 
    id,
    0,
    0,
    0,
    0
FROM posts
WHERE id NOT IN (SELECT post_id FROM post_analytics)
ON CONFLICT (post_id) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE - SUCCESS!
-- ============================================

SELECT 'Migration completed successfully! All tables, functions, triggers, and policies are ready.' AS status;
