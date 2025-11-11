-- EXPLORE DISCOVERY ENGINE DATABASE SCHEMA

-- Explore scores for ranking algorithm
CREATE TABLE IF NOT EXISTS public.explore_scores (
  id serial PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('post', 'boltz', 'flash', 'user')),
  target_id uuid NOT NULL,
  score double precision DEFAULT 0,
  section text DEFAULT 'trending' CHECK (section IN ('trending', 'for_you', 'popular')),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(target_type, target_id, section)
);

-- Trending hashtags
CREATE TABLE IF NOT EXISTS public.trending_hashtags (
  id serial PRIMARY KEY,
  hashtag text NOT NULL UNIQUE,
  usage_count integer DEFAULT 0,
  trend_score double precision DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User interests for personalization
CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  interest_type text NOT NULL, -- 'hashtag', 'category', 'creator'
  interest_value text NOT NULL,
  weight double precision DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, interest_type, interest_value)
);

-- Search analytics
CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  query text NOT NULL,
  results_count integer DEFAULT 0,
  clicked_result_id uuid,
  clicked_result_type text,
  created_at timestamptz DEFAULT now()
);

-- Explore interactions
CREATE TABLE IF NOT EXISTS public.explore_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action_type text NOT NULL, -- 'view', 'like', 'follow', 'share', 'hide'
  section text, -- 'trending', 'for_you', etc.
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE explore_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE explore_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Explore scores are viewable by everyone" ON explore_scores FOR SELECT USING (true);
CREATE POLICY "Trending hashtags are viewable by everyone" ON trending_hashtags FOR SELECT USING (true);
CREATE POLICY "Users can view own interests" ON user_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own search queries" ON search_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert search queries" ON search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert explore interactions" ON explore_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_explore_scores_section_score ON explore_scores(section, score DESC);
CREATE INDEX IF NOT EXISTS idx_explore_scores_target ON explore_scores(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_trending_hashtags_score ON trending_hashtags(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_user ON search_queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_explore_interactions_user ON explore_interactions(user_id, created_at DESC);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON profiles USING gin(username gin_trgm_ops);

-- Explore trending RPC
CREATE OR REPLACE FUNCTION public.get_explore_trending(page_limit integer DEFAULT 20, cursor_score double precision DEFAULT NULL)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  score double precision,
  created_at timestamptz,
  username text,
  avatar_url text,
  verified boolean,
  thumbnail_path text,
  caption text,
  likes_count bigint,
  comments_count bigint,
  media_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.target_type as item_type,
    es.target_id as item_id,
    es.score,
    COALESCE(p.created_at, b.created_at, f.created_at) as created_at,
    pr.username,
    pr.avatar_url,
    pr.verified,
    COALESCE(p.image_url, b.thumbnail_path, f.media_path) as thumbnail_path,
    COALESCE(p.content, b.caption, f.caption) as caption,
    COALESCE(p.likes_count, b.likes_count, 0) as likes_count,
    COALESCE(p.comments_count, b.comments_count, 0) as comments_count,
    CASE 
      WHEN es.target_type = 'post' AND p.video_url IS NOT NULL THEN 'video'
      WHEN es.target_type = 'post' THEN 'image'
      WHEN es.target_type = 'boltz' THEN 'boltz'
      WHEN es.target_type = 'flash' THEN 'flash'
      ELSE 'unknown'
    END as media_type
  FROM explore_scores es
  LEFT JOIN posts p ON (es.target_type = 'post' AND es.target_id = p.id)
  LEFT JOIN boltz b ON (es.target_type = 'boltz' AND es.target_id = b.id)
  LEFT JOIN flash f ON (es.target_type = 'flash' AND es.target_id = f.id)
  JOIN profiles pr ON pr.id = COALESCE(p.user_id, b.user_id, f.user_id)
  WHERE es.section = 'trending'
    AND es.score > 0
    AND (cursor_score IS NULL OR es.score < cursor_score)
    AND (
      (es.target_type = 'post' AND p.visibility = 'public')
      OR (es.target_type = 'boltz' AND b.visibility = 'public')
      OR (es.target_type = 'flash' AND f.visibility = 'public')
    )
  ORDER BY es.score DESC, created_at DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explore for you (personalized) RPC
CREATE OR REPLACE FUNCTION public.get_explore_for_you(page_limit integer DEFAULT 20, cursor_score double precision DEFAULT NULL)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  score double precision,
  created_at timestamptz,
  username text,
  avatar_url text,
  verified boolean,
  thumbnail_path text,
  caption text,
  likes_count bigint,
  comments_count bigint,
  media_type text
) AS $$
DECLARE
  user_id uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    es.target_type as item_type,
    es.target_id as item_id,
    es.score * COALESCE(ui.weight, 1.0) as score,
    COALESCE(p.created_at, b.created_at, f.created_at) as created_at,
    pr.username,
    pr.avatar_url,
    pr.verified,
    COALESCE(p.image_url, b.thumbnail_path, f.media_path) as thumbnail_path,
    COALESCE(p.content, b.caption, f.caption) as caption,
    COALESCE(p.likes_count, b.likes_count, 0) as likes_count,
    COALESCE(p.comments_count, b.comments_count, 0) as comments_count,
    CASE 
      WHEN es.target_type = 'post' AND p.video_url IS NOT NULL THEN 'video'
      WHEN es.target_type = 'post' THEN 'image'
      WHEN es.target_type = 'boltz' THEN 'boltz'
      WHEN es.target_type = 'flash' THEN 'flash'
      ELSE 'unknown'
    END as media_type
  FROM explore_scores es
  LEFT JOIN posts p ON (es.target_type = 'post' AND es.target_id = p.id)
  LEFT JOIN boltz b ON (es.target_type = 'boltz' AND es.target_id = b.id)
  LEFT JOIN flash f ON (es.target_type = 'flash' AND es.target_id = f.id)
  JOIN profiles pr ON pr.id = COALESCE(p.user_id, b.user_id, f.user_id)
  LEFT JOIN user_interests ui ON (ui.user_id = user_id AND ui.interest_value = pr.username)
  WHERE es.section IN ('trending', 'for_you')
    AND es.score > 0
    AND (cursor_score IS NULL OR es.score * COALESCE(ui.weight, 1.0) < cursor_score)
    AND (
      (es.target_type = 'post' AND (p.visibility = 'public' OR p.user_id = user_id OR 
        (p.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = user_id AND following_id = p.user_id))))
      OR (es.target_type = 'boltz' AND (b.visibility = 'public' OR b.user_id = user_id OR
        (b.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = user_id AND following_id = b.user_id))))
      OR (es.target_type = 'flash' AND (f.visibility = 'public' OR f.user_id = user_id OR
        (f.visibility = 'followers' AND EXISTS (SELECT 1 FROM follows WHERE follower_id = user_id AND following_id = f.user_id))))
    )
  ORDER BY (es.score * COALESCE(ui.weight, 1.0)) DESC, created_at DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search RPC
CREATE OR REPLACE FUNCTION public.search_content(
  query_text text,
  content_type text DEFAULT 'all',
  page_limit integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  item_type text,
  item_id uuid,
  username text,
  avatar_url text,
  verified boolean,
  thumbnail_path text,
  caption text,
  created_at timestamptz,
  likes_count bigint,
  rank_score double precision
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Search posts
    SELECT 
      'post'::text as item_type,
      p.id as item_id,
      pr.username,
      pr.avatar_url,
      pr.verified,
      p.image_url as thumbnail_path,
      p.content as caption,
      p.created_at,
      COALESCE(p.likes_count, 0) as likes_count,
      ts_rank(to_tsvector('english', p.content), plainto_tsquery('english', query_text)) as rank_score
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE (content_type = 'all' OR content_type = 'posts')
      AND p.visibility = 'public'
      AND to_tsvector('english', p.content) @@ plainto_tsquery('english', query_text)
  )
  UNION ALL
  (
    -- Search profiles
    SELECT 
      'user'::text as item_type,
      pr.id as item_id,
      pr.username,
      pr.avatar_url,
      pr.verified,
      pr.avatar_url as thumbnail_path,
      pr.bio as caption,
      pr.created_at,
      0 as likes_count,
      similarity(pr.username, query_text) as rank_score
    FROM profiles pr
    WHERE (content_type = 'all' OR content_type = 'users')
      AND pr.username % query_text
  )
  ORDER BY rank_score DESC, created_at DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get trending hashtags
CREATE OR REPLACE FUNCTION public.get_trending_hashtags(page_limit integer DEFAULT 10)
RETURNS TABLE (
  hashtag text,
  usage_count integer,
  trend_score double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT th.hashtag, th.usage_count, th.trend_score
  FROM trending_hashtags th
  WHERE th.trend_score > 0
  ORDER BY th.trend_score DESC, th.usage_count DESC
  LIMIT page_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;