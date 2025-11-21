-- Fix count system for posts and boltz
-- Add triggers to automatically update count columns

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'shares' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET shares_count = shares_count + 1 WHERE id = NEW.boltz_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.boltz_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.boltz_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'shares' THEN
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.boltz_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
DROP TRIGGER IF EXISTS shares_count_trigger ON shares;

-- Create triggers for automatic count updates
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

CREATE TRIGGER shares_count_trigger
  AFTER INSERT OR DELETE ON shares
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

-- Fix existing counts by recalculating them
UPDATE posts SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id),
  shares_count = (SELECT COUNT(*) FROM shares WHERE post_id = posts.id);

UPDATE boltz SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE boltz_id = boltz.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE boltz_id = boltz.id),
  shares_count = (SELECT COUNT(*) FROM shares WHERE boltz_id = boltz.id);