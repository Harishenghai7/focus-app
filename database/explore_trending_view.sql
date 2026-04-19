-- ============================================================================
-- Focus Platform — Trending Hashtags View (Production)
-- Extracts hashtags from posts.content/caption, scores by 24h engagement.
-- Run this in Supabase SQL editor to deploy.
-- ============================================================================

-- Drop old view if it exists
DROP VIEW IF EXISTS trending_hashtags CASCADE;

-- Create the production view
CREATE OR REPLACE VIEW trending_hashtags AS
WITH raw_tags AS (
    -- Extract every hashtag token from post content
    -- Works on both `content` and `caption` columns (covers legacy schema)
    SELECT
        p.id                                              AS post_id,
        p.created_at,
        COALESCE(p.likes_count, 0)                        AS likes,
        COALESCE(p.comments_count, 0)                     AS comments,
        LOWER(REGEXP_REPLACE(word, '[^a-zA-Z0-9_]', '', 'g')) AS tag
    FROM posts p,
         LATERAL REGEXP_SPLIT_TO_TABLE(
             COALESCE(p.content, '') || ' ' || COALESCE(p.caption, ''),
             '\s+'
         ) AS word
    WHERE
        word ILIKE '#%'
        AND LENGTH(word) > 1
        AND p.created_at >= NOW() - INTERVAL '24 hours'
),
cleaned AS (
    -- Normalise: strip the leading #, throw away empties
    SELECT
        post_id,
        created_at,
        likes,
        comments,
        SUBSTR(tag, 2) AS tag   -- remove leading '#'
    FROM raw_tags
    WHERE LENGTH(tag) > 1       -- at least 1 char after '#'
      AND tag ~ '^#[a-z0-9_]+$' -- valid hashtag characters only
),
aggregated AS (
    SELECT
        tag,
        COUNT(DISTINCT post_id)                            AS post_count,
        SUM(likes)                                         AS total_likes,
        SUM(comments)                                      AS total_comments,
        MAX(created_at)                                    AS last_used,
        -- Engagement score: posts weighted 1pt, likes 2pt, comments 3pt
        (COUNT(DISTINCT post_id) + SUM(likes) * 2 + SUM(comments) * 3)::INT AS score
    FROM cleaned
    GROUP BY tag
)
SELECT
    tag,
    post_count,
    total_likes,
    total_comments,
    score,
    last_used
FROM aggregated
WHERE post_count > 0
ORDER BY score DESC, last_used DESC
LIMIT 50;

-- ============================================================================
-- Optional: grant SELECT to authenticated and anon roles
-- ============================================================================
GRANT SELECT ON trending_hashtags TO authenticated;
GRANT SELECT ON trending_hashtags TO anon;

-- ============================================================================
-- Bonus: RPC helper so the JS SDK can call it without raw SQL
-- ============================================================================
CREATE OR REPLACE FUNCTION get_trending_hashtags(limit_count INT DEFAULT 10)
RETURNS TABLE(tag TEXT, post_count BIGINT, score INT, last_used TIMESTAMPTZ)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT tag, post_count, score, last_used
    FROM trending_hashtags
    LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION get_trending_hashtags(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_hashtags(INT) TO anon;
