-- Enhanced Real-time Interaction System for Focus App
-- Run this in your Supabase SQL Editor

-- Create enhanced functions for better performance

-- Function to handle like interactions with real-time updates
CREATE OR REPLACE FUNCTION handle_like_interaction()
RETURNS TRIGGER AS $$
DECLARE
  content_table TEXT;
  content_id_col TEXT;
  notification_type TEXT := 'like';
  content_owner_id UUID;
BEGIN
  -- Determine which table and column to update
  IF NEW.post_id IS NOT NULL THEN
    content_table := 'posts';
    content_id_col := 'post_id';
    SELECT user_id INTO content_owner_id FROM posts WHERE id = NEW.post_id;
  ELSIF NEW.boltz_id IS NOT NULL THEN
    content_table := 'boltz';
    content_id_col := 'boltz_id';
    SELECT user_id INTO content_owner_id FROM boltz WHERE id = NEW.boltz_id;
  ELSIF NEW.flash_id IS NOT NULL THEN
    content_table := 'flash';
    content_id_col := 'flash_id';
    SELECT user_id INTO content_owner_id FROM flash WHERE id = NEW.flash_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Update likes count
    EXECUTE format('UPDATE %I SET likes_count = likes_count + 1 WHERE id = $1', content_table) 
    USING NEW[content_id_col];
    
    -- Create notification if not self-like
    IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
      INSERT INTO notifications (
        user_id, 
        from_user_id, 
        type, 
        content,
        post_id,
        boltz_id,
        flash_id,
        created_at
      ) VALUES (
        content_owner_id,
        NEW.user_id,
        notification_type,
        'liked your ' || CASE 
          WHEN NEW.post_id IS NOT NULL THEN 'post'
          WHEN NEW.boltz_id IS NOT NULL THEN 'video'
          WHEN NEW.flash_id IS NOT NULL THEN 'flash'
        END,
        NEW.post_id,
        NEW.boltz_id,
        NEW.flash_id,
        NOW()
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update likes count
    EXECUTE format('UPDATE %I SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', content_table) 
    USING OLD[content_id_col];
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle comment interactions
CREATE OR REPLACE FUNCTION handle_comment_interaction()
RETURNS TRIGGER AS $$
DECLARE
  content_table TEXT;
  content_id_col TEXT;
  content_owner_id UUID;
  parent_comment_owner_id UUID;
BEGIN
  -- Determine which table to update
  IF NEW.post_id IS NOT NULL THEN
    content_table := 'posts';
    content_id_col := 'post_id';
    SELECT user_id INTO content_owner_id FROM posts WHERE id = NEW.post_id;
  ELSIF NEW.boltz_id IS NOT NULL THEN
    content_table := 'boltz';
    content_id_col := 'boltz_id';
    SELECT user_id INTO content_owner_id FROM boltz WHERE id = NEW.boltz_id;
  ELSIF NEW.flash_id IS NOT NULL THEN
    content_table := 'flash';
    content_id_col := 'flash_id';
    SELECT user_id INTO content_owner_id FROM flash WHERE id = NEW.flash_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Update comments count
    EXECUTE format('UPDATE %I SET comments_count = comments_count + 1 WHERE id = $1', content_table) 
    USING NEW[content_id_col];
    
    -- Update parent comment replies count if it's a reply
    IF NEW.parent_comment_id IS NOT NULL THEN
      UPDATE comments SET replies_count = replies_count + 1 WHERE id = NEW.parent_comment_id;
      SELECT user_id INTO parent_comment_owner_id FROM comments WHERE id = NEW.parent_comment_id;
    END IF;
    
    -- Create notification for content owner
    IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
      INSERT INTO notifications (
        user_id, 
        from_user_id, 
        type, 
        content,
        post_id,
        boltz_id,
        flash_id,
        comment_id,
        created_at
      ) VALUES (
        content_owner_id,
        NEW.user_id,
        'comment',
        'commented on your ' || CASE 
          WHEN NEW.post_id IS NOT NULL THEN 'post'
          WHEN NEW.boltz_id IS NOT NULL THEN 'video'
          WHEN NEW.flash_id IS NOT NULL THEN 'flash'
        END,
        NEW.post_id,
        NEW.boltz_id,
        NEW.flash_id,
        NEW.id,
        NOW()
      );
    END IF;
    
    -- Create notification for parent comment owner if it's a reply
    IF parent_comment_owner_id IS NOT NULL AND parent_comment_owner_id != NEW.user_id AND parent_comment_owner_id != content_owner_id THEN
      INSERT INTO notifications (
        user_id, 
        from_user_id, 
        type, 
        content,
        comment_id,
        created_at
      ) VALUES (
        parent_comment_owner_id,
        NEW.user_id,
        'reply',
        'replied to your comment',
        NEW.id,
        NOW()
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update comments count
    EXECUTE format('UPDATE %I SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1', content_table) 
    USING OLD[content_id_col];
    
    -- Update parent comment replies count if it was a reply
    IF OLD.parent_comment_id IS NOT NULL THEN
      UPDATE comments SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.parent_comment_id;
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle follow interactions
CREATE OR REPLACE FUNCTION handle_follow_interaction()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update follower and following counts
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    
    -- Create notification
    INSERT INTO notifications (
      user_id, 
      from_user_id, 
      type, 
      content,
      created_at
    ) VALUES (
      NEW.following_id,
      NEW.follower_id,
      'follow',
      'started following you',
      NOW()
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update follower and following counts
    UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle share interactions
CREATE OR REPLACE FUNCTION handle_share_interaction()
RETURNS TRIGGER AS $$
DECLARE
  content_table TEXT;
  content_id_col TEXT;
  content_owner_id UUID;
BEGIN
  -- Determine which table to update
  IF NEW.post_id IS NOT NULL THEN
    content_table := 'posts';
    content_id_col := 'post_id';
    SELECT user_id INTO content_owner_id FROM posts WHERE id = NEW.post_id;
  ELSIF NEW.boltz_id IS NOT NULL THEN
    content_table := 'boltz';
    content_id_col := 'boltz_id';
    SELECT user_id INTO content_owner_id FROM boltz WHERE id = NEW.boltz_id;
  ELSIF NEW.flash_id IS NOT NULL THEN
    content_table := 'flash';
    content_id_col := 'flash_id';
    SELECT user_id INTO content_owner_id FROM flash WHERE id = NEW.flash_id;
  END IF;

  -- Update shares count
  EXECUTE format('UPDATE %I SET shares_count = shares_count + 1 WHERE id = $1', content_table) 
  USING NEW[content_id_col];
  
  -- Create notification if not self-share
  IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id, 
      from_user_id, 
      type, 
      content,
      post_id,
      boltz_id,
      flash_id,
      created_at
    ) VALUES (
      content_owner_id,
      NEW.user_id,
      'share',
      'shared your ' || CASE 
        WHEN NEW.post_id IS NOT NULL THEN 'post'
        WHEN NEW.boltz_id IS NOT NULL THEN 'video'
        WHEN NEW.flash_id IS NOT NULL THEN 'flash'
      END,
      NEW.post_id,
      NEW.boltz_id,
      NEW.flash_id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add flash_id column to likes, comments, and shares tables if not exists
ALTER TABLE likes ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;

-- Update constraints to include flash
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_content_check;
ALTER TABLE likes ADD CONSTRAINT likes_content_check CHECK (
  (post_id IS NOT NULL AND boltz_id IS NULL AND flash_id IS NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NOT NULL AND flash_id IS NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NULL AND comment_id IS NOT NULL)
);

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_content_check;
ALTER TABLE comments ADD CONSTRAINT comments_content_check CHECK (
  (post_id IS NOT NULL AND boltz_id IS NULL AND flash_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NOT NULL AND flash_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NOT NULL)
);

-- Add shares_count columns if not exists
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE boltz ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE flash ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_handle_like_interaction ON likes;
DROP TRIGGER IF EXISTS trigger_handle_comment_interaction ON comments;
DROP TRIGGER IF EXISTS trigger_handle_follow_interaction ON follows;
DROP TRIGGER IF EXISTS trigger_handle_share_interaction ON shares;

-- Create new enhanced triggers
CREATE TRIGGER trigger_handle_like_interaction
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION handle_like_interaction();

CREATE TRIGGER trigger_handle_comment_interaction
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_interaction();

CREATE TRIGGER trigger_handle_follow_interaction
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_follow_interaction();

CREATE TRIGGER trigger_handle_share_interaction
  AFTER INSERT ON shares
  FOR EACH ROW EXECUTE FUNCTION handle_share_interaction();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_flash_id ON likes(flash_id);
CREATE INDEX IF NOT EXISTS idx_comments_flash_id ON comments(flash_id);
CREATE INDEX IF NOT EXISTS idx_shares_flash_id ON shares(flash_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Create function to get interaction counts
CREATE OR REPLACE FUNCTION get_content_interactions(
  content_type TEXT,
  content_id UUID
)
RETURNS TABLE(
  likes_count BIGINT,
  comments_count BIGINT,
  shares_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*) FROM likes 
      WHERE CASE content_type
        WHEN 'post' THEN post_id = content_id
        WHEN 'boltz' THEN boltz_id = content_id
        WHEN 'flash' THEN flash_id = content_id
      END
    ), 0) as likes_count,
    COALESCE((
      SELECT COUNT(*) FROM comments 
      WHERE CASE content_type
        WHEN 'post' THEN post_id = content_id
        WHEN 'boltz' THEN boltz_id = content_id
        WHEN 'flash' THEN flash_id = content_id
      END
    ), 0) as comments_count,
    COALESCE((
      SELECT COUNT(*) FROM shares 
      WHERE CASE content_type
        WHEN 'post' THEN post_id = content_id
        WHEN 'boltz' THEN boltz_id = content_id
        WHEN 'flash' THEN flash_id = content_id
      END
    ), 0) as shares_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user liked content
CREATE OR REPLACE FUNCTION user_liked_content(
  user_id UUID,
  content_type TEXT,
  content_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM likes 
    WHERE likes.user_id = user_liked_content.user_id
    AND CASE content_type
      WHEN 'post' THEN post_id = content_id
      WHEN 'boltz' THEN boltz_id = content_id
      WHEN 'flash' THEN flash_id = content_id
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable real-time for all interaction tables
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE shares;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;