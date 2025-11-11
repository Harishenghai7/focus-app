-- Migration: Threaded Comments Support
-- Date: 2025-11-07
-- Description: Add reply functionality to comments

-- Add parent_comment_id for threading
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;

-- Create index for faster reply queries
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

-- Function to update replies count
CREATE OR REPLACE FUNCTION update_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE comments 
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_replies_count_trigger ON comments;
CREATE TRIGGER update_replies_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_replies_count();

COMMENT ON COLUMN comments.parent_comment_id IS 'ID of parent comment for threaded replies';
COMMENT ON COLUMN comments.replies_count IS 'Number of replies to this comment';
