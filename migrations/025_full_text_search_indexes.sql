-- Migration: Full-Text Search Indexes
-- Description: Add full-text search capabilities with GIN indexes for fast searching

-- Create extension for full-text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add full-text search columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index on username for fast prefix matching
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);

-- Create full-text search index on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON profiles USING gin (search_vector);

-- Function to update profile search vector
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector on profile changes
DROP TRIGGER IF EXISTS trigger_update_profile_search_vector ON profiles;
CREATE TRIGGER trigger_update_profile_search_vector
  BEFORE INSERT OR UPDATE OF username, full_name, bio
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_search_vector();

-- Update existing profiles
UPDATE profiles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(full_name, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(bio, '')), 'C');

-- Add full-text search columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigram index on caption for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_posts_caption_trgm ON posts USING gin (caption gin_trgm_ops);

-- Create full-text search index on posts
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING gin (search_vector);

-- Function to update post search vector
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.caption, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector on post changes
DROP TRIGGER IF EXISTS trigger_update_post_search_vector ON posts;
CREATE TRIGGER trigger_update_post_search_vector
  BEFORE INSERT OR UPDATE OF caption
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_search_vector();

-- Update existing posts
UPDATE posts SET search_vector = 
  setweight(to_tsvector('english', COALESCE(caption, '')), 'A');

-- Create hashtags table for tracking and trending
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag TEXT UNIQUE NOT NULL,
  post_count INTEGER DEFAULT 0,
  trending_score DECIMAL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on hashtag tag for fast lookups
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags (tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending_score ON hashtags (trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtags_post_count ON hashtags (post_count DESC);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, hashtag_id)
);

-- Create indexes on post_hashtags
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags (post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags (hashtag_id);

-- Function to extract and store hashtags from post caption
CREATE OR REPLACE FUNCTION extract_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_text TEXT;
  hashtag_id UUID;
  hashtag_matches TEXT[];
BEGIN
  -- Delete old hashtag associations
  DELETE FROM post_hashtags WHERE post_id = NEW.id;
  
  -- Extract hashtags from caption (matches #word)
  IF NEW.caption IS NOT NULL THEN
    hashtag_matches := regexp_matches(NEW.caption, '#([a-zA-Z0-9_]+)', 'g');
    
    -- Process each hashtag
    FOREACH hashtag_text IN ARRAY hashtag_matches
    LOOP
      -- Remove the # symbol
      hashtag_text := lower(trim(hashtag_text, '#'));
      
      -- Insert or update hashtag
      INSERT INTO hashtags (tag, post_count, last_used_at)
      VALUES (hashtag_text, 1, NOW())
      ON CONFLICT (tag) DO UPDATE
      SET 
        post_count = hashtags.post_count + 1,
        last_used_at = NOW()
      RETURNING id INTO hashtag_id;
      
      -- Create association
      INSERT INTO post_hashtags (post_id, hashtag_id)
      VALUES (NEW.id, hashtag_id)
      ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to extract hashtags on post insert/update
DROP TRIGGER IF EXISTS trigger_extract_post_hashtags ON posts;
CREATE TRIGGER trigger_extract_post_hashtags
  AFTER INSERT OR UPDATE OF caption
  ON posts
  FOR EACH ROW
  EXECUTE FUNCTION extract_post_hashtags();

-- Function to update trending scores (should be called periodically)
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE hashtags
  SET trending_score = (
    -- Score based on recent usage (last 24 hours weighted heavily)
    CASE 
      WHEN last_used_at > NOW() - INTERVAL '1 hour' THEN post_count * 10
      WHEN last_used_at > NOW() - INTERVAL '6 hours' THEN post_count * 5
      WHEN last_used_at > NOW() - INTERVAL '24 hours' THEN post_count * 2
      WHEN last_used_at > NOW() - INTERVAL '7 days' THEN post_count * 0.5
      ELSE post_count * 0.1
    END
  );
END;
$$ LANGUAGE plpgsql;

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_type TEXT, -- 'user', 'post', 'hashtag'
  result_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on search history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history (user_id, created_at DESC);

-- RLS policies for hashtags (public read)
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hashtags are viewable by everyone"
  ON hashtags FOR SELECT
  USING (true);

-- RLS policies for post_hashtags (public read)
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post hashtags are viewable by everyone"
  ON post_hashtags FOR SELECT
  USING (true);

-- RLS policies for search_history (users can only see their own)
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create function for comprehensive search
CREATE OR REPLACE FUNCTION search_all(
  search_query TEXT,
  current_user_id UUID,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  caption TEXT,
  media_url TEXT,
  tag TEXT,
  post_count INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  
  -- Search users
  SELECT 
    'user'::TEXT as result_type,
    p.id as result_id,
    p.username,
    p.full_name,
    p.avatar_url,
    NULL::TEXT as caption,
    NULL::TEXT as media_url,
    NULL::TEXT as tag,
    NULL::INTEGER as post_count,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as relevance
  FROM profiles p
  WHERE 
    p.search_vector @@ plainto_tsquery('english', search_query)
    OR p.username ILIKE '%' || search_query || '%'
    OR p.full_name ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC
  LIMIT result_limit
  
  UNION ALL
  
  -- Search posts
  SELECT 
    'post'::TEXT as result_type,
    po.id as result_id,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    po.caption,
    COALESCE(po.media_url, po.media_urls[1]) as media_url,
    NULL::TEXT as tag,
    NULL::INTEGER as post_count,
    ts_rank(po.search_vector, plainto_tsquery('english', search_query)) as relevance
  FROM posts po
  JOIN profiles pr ON po.user_id = pr.id
  WHERE 
    po.search_vector @@ plainto_tsquery('english', search_query)
    OR po.caption ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC
  LIMIT result_limit
  
  UNION ALL
  
  -- Search hashtags
  SELECT 
    'hashtag'::TEXT as result_type,
    h.id as result_id,
    NULL::TEXT as username,
    NULL::TEXT as full_name,
    NULL::TEXT as avatar_url,
    NULL::TEXT as caption,
    NULL::TEXT as media_url,
    h.tag,
    h.post_count,
    similarity(h.tag, search_query) as relevance
  FROM hashtags h
  WHERE 
    h.tag ILIKE '%' || search_query || '%'
  ORDER BY relevance DESC, h.post_count DESC
  LIMIT result_limit;
  
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_all TO authenticated;
GRANT EXECUTE ON FUNCTION update_trending_scores TO authenticated;
