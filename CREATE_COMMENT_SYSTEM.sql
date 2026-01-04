-- PRO-GRADE COMMENT SYSTEM DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Create Comments Table
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2200),
  is_pinned BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT comment_target CHECK (
    (post_id IS NOT NULL AND boltz_id IS NULL AND flash_id IS NULL) OR
    (post_id IS NULL AND boltz_id IS NOT NULL AND flash_id IS NULL) OR
    (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_boltz ON comments(boltz_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_flash ON comments(flash_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- STEP 2: Create Comment Likes Table
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- ============================================
-- STEP 3: Disable RLS (for testing)
-- ============================================
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comments TO anon;
GRANT ALL ON comment_likes TO authenticated;
GRANT ALL ON comment_likes TO anon;

-- ============================================
-- STEP 4: Create Functions for Comment Counts
-- ============================================

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes count
DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL AND NEW.deleted_at IS NULL THEN
    UPDATE comments 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for replies count
DROP TRIGGER IF EXISTS comment_replies_count_trigger ON comments;
CREATE TRIGGER comment_replies_count_trigger
AFTER INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_replies_count();

-- ============================================
-- STEP 5: Reload Schema
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- STEP 6: Verify Tables Created
-- ============================================
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('comments', 'comment_likes')
ORDER BY table_name;

-- Should show both tables ✅
