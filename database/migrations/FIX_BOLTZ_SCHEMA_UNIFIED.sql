-- ==========================================
-- UNIFIED BOLTZ SCHEMA FIX
-- Bridges Enhanced Schema + Trust Shield RPC
-- ==========================================

-- Add all missing columns to boltz table for compatibility
ALTER TABLE public.boltz 
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS poster_url TEXT,
    ADD COLUMN IF NOT EXISTS preview_image TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_path TEXT,
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS audio_track TEXT,
    ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_boltz_visibility ON public.boltz(visibility);
CREATE INDEX IF NOT EXISTS idx_boltz_likes_count ON public.boltz(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_boltz_created_at_desc ON public.boltz(created_at DESC);

-- ==========================================
-- FIXED RPC: get_boltz_feed_secure
-- Handles all column variations gracefully
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_boltz_feed_secure(
    p_user_id UUID,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    poster_url TEXT,
    preview_image TEXT,
    cover_url TEXT,
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
        b.id,
        b.user_id,
        -- Try description first, fallback to caption
        COALESCE(b.description, b.caption, '') AS description,
        -- Try video_url first, fallback to storage_path with signed URL logic handled client-side
        COALESCE(b.video_url, b.storage_path) AS video_url,
        -- Multiple thumbnail fallbacks
        COALESCE(b.thumbnail_url, b.thumbnail_path, b.poster_url, b.preview_image, b.cover_url, '') AS thumbnail_url,
        b.poster_url,
        b.preview_image,
        b.cover_url,
        b.created_at,
        COALESCE(b.likes_count, 0) AS likes_count,
        COALESCE(b.comments_count, 0) AS comments_count,
        COALESCE(b.saves_count, 0) AS saves_count,
        COALESCE(b.shares_count, 0) AS shares_count,
        COALESCE(b.views_count, 0) AS views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified
    FROM public.boltz b
    LEFT JOIN public.profiles pr ON pr.id = b.user_id
    WHERE b.visibility = 'public' 
       OR b.user_id = p_user_id
       OR (b.visibility = 'followers' AND EXISTS (
           SELECT 1 FROM public.follows f
           WHERE f.follower_id = p_user_id AND f.following_id = b.user_id
       ))
    ORDER BY b.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_boltz_feed_secure(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_boltz_feed_secure(UUID, INT, INT) TO anon;

-- ==========================================
-- RPC: get_public_boltz_feed (No auth required)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_public_boltz_feed(
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    poster_url TEXT,
    preview_image TEXT,
    cover_url TEXT,
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
        b.id,
        b.user_id,
        COALESCE(b.description, b.caption, '') AS description,
        COALESCE(b.video_url, b.storage_path) AS video_url,
        COALESCE(b.thumbnail_url, b.thumbnail_path, b.poster_url, b.preview_image, b.cover_url, '') AS thumbnail_url,
        b.poster_url,
        b.preview_image,
        b.cover_url,
        b.created_at,
        COALESCE(b.likes_count, 0) AS likes_count,
        COALESCE(b.comments_count, 0) AS comments_count,
        COALESCE(b.saves_count, 0) AS saves_count,
        COALESCE(b.shares_count, 0) AS shares_count,
        COALESCE(b.views_count, 0) AS views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified
    FROM public.boltz b
    LEFT JOIN public.profiles pr ON pr.id = b.user_id
    WHERE b.visibility = 'public'
    ORDER BY b.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_boltz_feed(INT, INT) TO authenticated, anon;

-- ==========================================
-- RPC: get_following_boltz_feed
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_following_boltz_feed(
    p_user_id UUID,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    poster_url TEXT,
    preview_image TEXT,
    cover_url TEXT,
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
        b.id,
        b.user_id,
        COALESCE(b.description, b.caption, '') AS description,
        COALESCE(b.video_url, b.storage_path) AS video_url,
        COALESCE(b.thumbnail_url, b.thumbnail_path, b.poster_url, b.preview_image, b.cover_url, '') AS thumbnail_url,
        b.poster_url,
        b.preview_image,
        b.cover_url,
        b.created_at,
        COALESCE(b.likes_count, 0) AS likes_count,
        COALESCE(b.comments_count, 0) AS comments_count,
        COALESCE(b.saves_count, 0) AS saves_count,
        COALESCE(b.shares_count, 0) AS shares_count,
        COALESCE(b.views_count, 0) AS views_count,
        pr.username,
        pr.full_name,
        pr.avatar_url,
        pr.is_verified
    FROM public.boltz b
    LEFT JOIN public.profiles pr ON pr.id = b.user_id
    INNER JOIN public.follows f ON f.following_id = b.user_id
    WHERE f.follower_id = p_user_id
      AND (b.visibility = 'public' OR b.visibility = 'followers' OR b.user_id = p_user_id)
    ORDER BY b.created_at DESC
    LIMIT GREATEST(p_limit, 1)
    OFFSET GREATEST(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_following_boltz_feed(UUID, INT, INT) TO authenticated;

-- ==========================================
-- Triggers for count updates (if tables exist)
-- ==========================================

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_boltz_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.boltz SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.boltz_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.boltz SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.boltz_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comments count
CREATE OR REPLACE FUNCTION public.update_boltz_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.boltz SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.boltz_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.boltz SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.boltz_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers (idempotent)
DROP TRIGGER IF EXISTS boltz_likes_count_trigger ON public.boltz_likes;
CREATE TRIGGER boltz_likes_count_trigger
    AFTER INSERT OR DELETE ON public.boltz_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_boltz_likes_count();

DROP TRIGGER IF EXISTS boltz_comments_count_trigger ON public.boltz_comments;
CREATE TRIGGER boltz_comments_count_trigger
    AFTER INSERT OR DELETE ON public.boltz_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_boltz_comments_count();

-- ==========================================
-- Update RLS Policy for visibility
-- ==========================================
DROP POLICY IF EXISTS "Boltz view access" ON public.boltz;
CREATE POLICY "Boltz view access" ON public.boltz FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (visibility = 'followers' AND EXISTS (
     SELECT 1 FROM public.follows f
     WHERE f.follower_id = auth.uid() AND f.following_id = public.boltz.user_id
  ))
);

-- Public read policy for anon users
DROP POLICY IF EXISTS "Public boltz viewable by everyone" ON public.boltz;
CREATE POLICY "Public boltz viewable by everyone" ON public.boltz FOR SELECT TO anon
USING (visibility = 'public');

-- ==========================================
-- DONE: Schema unified!
-- ==========================================
