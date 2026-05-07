-- ═══════════════════════════════════════════════════════════════════════
-- ADD MISSING RPC FUNCTIONS FOR BULLETPROOF OPERATION
-- ═══════════════════════════════════════════════════════════════════════

-- 1. sync_oauth_profile - Called on login to sync OAuth data
CREATE OR REPLACE FUNCTION sync_oauth_profile(
    p_user_id UUID,
    p_avatar_url TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO profiles (id, avatar_url, full_name, username, updated_at)
    VALUES (
        p_user_id,
        COALESCE(p_avatar_url, ''),
        COALESCE(p_full_name, ''),
        COALESCE(p_username, 'focusly_' || substr(p_user_id::text, 1, 6)),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        username = COALESCE(EXCLUDED.username, profiles.username),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION sync_oauth_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_oauth_profile(UUID, TEXT, TEXT, TEXT) TO anon;

-- 2. Ensure boltz_views table exists with RLS
CREATE TABLE IF NOT EXISTS public.boltz_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    boltz_id UUID REFERENCES public.boltz(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(boltz_id, user_id)
);

-- Enable RLS
ALTER TABLE public.boltz_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own views" ON public.boltz_views;
DROP POLICY IF EXISTS "Users can view their own views" ON public.boltz_views;
DROP POLICY IF EXISTS "Public can view aggregate counts" ON public.boltz_views;

-- Create policies
CREATE POLICY "Allow all inserts" 
ON public.boltz_views FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow all selects" 
ON public.boltz_views FOR SELECT 
USING (true);

-- 3. Ensure conversations GIN index exists for JSONB queries
CREATE INDEX IF NOT EXISTS idx_conversations_participants_gin 
ON public.conversations USING GIN (participants);

-- 4. Create RPC for unread messages count (more efficient than client-side filtering)
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER := 0;
    conv_id UUID;
BEGIN
    FOR conv_id IN 
        SELECT id FROM conversations 
        WHERE participants @> to_jsonb(p_user_id::text)
    LOOP
        SELECT COUNT(*) INTO unread_count
        FROM messages
        WHERE conversation_id = conv_id
        AND sender_id != p_user_id
        AND deleted = false
        AND (read_by IS NULL OR NOT read_by @> to_jsonb(p_user_id::text));
    END LOOP;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;

-- 5. Create RPC for trending hashtags (replaces the failing views)
CREATE OR REPLACE FUNCTION get_trending_hashtags(
    p_hours_back INTEGER DEFAULT 48,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    hashtag TEXT,
    post_count BIGINT,
    total_likes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        substring(p.caption from '#[A-Za-z0-9_]+') as hashtag,
        COUNT(*)::BIGINT as post_count,
        COALESCE(SUM(pl.count), 0)::BIGINT as total_likes
    FROM posts p
    LEFT JOIN (
        SELECT post_id, COUNT(*) as count 
        FROM post_likes 
        GROUP BY post_id
    ) pl ON pl.post_id = p.id
    WHERE p.created_at > NOW() - interval '1 hour' * p_hours_back
    AND p.caption ~ '#[A-Za-z0-9_]+'
    GROUP BY substring(p.caption from '#[A-Za-z0-9_]+')
    HAVING COUNT(*) > 0
    ORDER BY COUNT(*) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_trending_hashtags(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_hashtags(INTEGER, INTEGER) TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. TRENDING HASHTAGS VIEWS (For direct table queries)
-- ═══════════════════════════════════════════════════════════════════════

-- 48h trending view (matching app query)
DROP VIEW IF EXISTS trending_hashtags_48h_v;
CREATE VIEW trending_hashtags_48h_v AS
SELECT 
    (regexp_matches(caption, '#[A-Za-z0-9_]+', 'g'))[1] as hashtag,
    COUNT(DISTINCT id)::BIGINT as post_count
FROM posts
WHERE created_at > NOW() - interval '48 hours'
AND caption ~ '#[A-Za-z0-9_]+'
GROUP BY (regexp_matches(caption, '#[A-Za-z0-9_]+', 'g'))[1]
HAVING COUNT(*) > 0
ORDER BY post_count DESC;

-- 24h trending view
DROP VIEW IF EXISTS trending_hashtags_24h_v;
CREATE VIEW trending_hashtags_24h_v AS
SELECT 
    (regexp_matches(caption, '#[A-Za-z0-9_]+', 'g'))[1] as hashtag,
    COUNT(DISTINCT id)::BIGINT as post_count
FROM posts
WHERE created_at > NOW() - interval '24 hours'
AND caption ~ '#[A-Za-z0-9_]+'
GROUP BY (regexp_matches(caption, '#[A-Za-z0-9_]+', 'g'))[1]
HAVING COUNT(*) > 0
ORDER BY post_count DESC;

-- Grant select on views to all users
GRANT SELECT ON trending_hashtags_48h_v TO anon, authenticated;
GRANT SELECT ON trending_hashtags_24h_v TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- DONE: All critical RPC functions and views created
-- ═══════════════════════════════════════════════════════════════════════
