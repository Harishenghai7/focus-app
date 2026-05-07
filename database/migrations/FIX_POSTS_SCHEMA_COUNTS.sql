-- ==========================================
-- POSTS SCHEMA FIX - Add Missing Count Columns
-- ==========================================

-- Add count columns to posts table
ALTER TABLE public.posts 
    ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON public.posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON public.posts(user_id, created_at DESC);

-- ==========================================
-- RPC: get_home_feed_secure (FIXED)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_home_feed_secure(
    p_user_id UUID,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    caption TEXT,
    content TEXT,
    media_url TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ,
    likes_count INT,
    comments_count INT,
    saves_count INT,
    shares_count INT,
    views_count INT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    trust_tier INT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id,
        p.user_id,
        p.caption,
        p.content,
        p.media_url,
        p.media_urls,
        p.created_at,
        COALESCE(p.likes_count, 0) AS likes_count,
        COALESCE(p.comments_count, 0) AS comments_count,
        COALESCE(p.saves_count, 0) AS saves_count,
        COALESCE(p.shares_count, 0) AS shares_count,
        COALESCE(p.views_count, 0) AS views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified,
        pr.trust_tier
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed_secure(UUID, INT, INT) TO authenticated, anon;

-- ==========================================
-- RPC: get_public_feed (No auth required)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_public_feed(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    caption TEXT,
    content TEXT,
    media_url TEXT,
    media_urls TEXT[],
    created_at TIMESTAMPTZ,
    likes_count INT,
    comments_count INT,
    saves_count INT,
    shares_count INT,
    views_count INT,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        p.id,
        p.user_id,
        p.caption,
        p.content,
        p.media_url,
        p.media_urls,
        p.created_at,
        COALESCE(p.likes_count, 0) AS likes_count,
        COALESCE(p.comments_count, 0) AS comments_count,
        COALESCE(p.saves_count, 0) AS saves_count,
        COALESCE(p.shares_count, 0) AS shares_count,
        COALESCE(p.views_count, 0) AS views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.user_id
    ORDER BY p.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_feed(INT, INT) TO authenticated, anon;

-- ==========================================
-- Triggers for count updates
-- ==========================================

-- Function to update post likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update post comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS post_likes_count_trigger ON public.post_likes;
CREATE TRIGGER post_likes_count_trigger
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

DROP TRIGGER IF EXISTS post_comments_count_trigger ON public.comments;
CREATE TRIGGER post_comments_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- ==========================================
-- DONE: Posts schema fixed!
-- ==========================================
