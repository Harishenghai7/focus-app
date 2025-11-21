-- Migration: Drafts and Scheduled Posts
-- Date: 2025-11-07
-- Description: Save drafts and schedule posts for future publishing

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_posts_drafts ON posts(user_id, is_draft) WHERE is_draft = true;
CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_for) WHERE scheduled_for IS NOT NULL;

COMMENT ON COLUMN posts.is_draft IS 'True if post is saved as draft';
COMMENT ON COLUMN posts.scheduled_for IS 'Timestamp when post should be published';

-- Function to publish scheduled posts (call via cron job)
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET is_draft = false, scheduled_for = NULL
  WHERE scheduled_for IS NOT NULL 
  AND scheduled_for <= NOW()
  AND is_draft = true;
END;
$$ LANGUAGE plpgsql;
