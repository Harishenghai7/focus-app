-- Instagram-level real-time triggers
-- Run this in Supabase SQL Editor

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;

-- Simple trigger to update counts
CREATE OR REPLACE FUNCTION update_content_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
      ELSIF NEW.flash_id IS NOT NULL THEN
        UPDATE flash SET likes_count = likes_count + 1 WHERE id = NEW.flash_id;
      END IF;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.boltz_id;
      ELSIF OLD.flash_id IS NOT NULL THEN
        UPDATE flash SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.flash_id;
      END IF;
      RETURN OLD;
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
      ELSIF NEW.flash_id IS NOT NULL THEN
        UPDATE flash SET comments_count = comments_count + 1 WHERE id = NEW.flash_id;
      END IF;
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.boltz_id;
      ELSIF OLD.flash_id IS NOT NULL THEN
        UPDATE flash SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.flash_id;
      END IF;
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;

-- Create new triggers
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_content_counts();

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_content_counts();