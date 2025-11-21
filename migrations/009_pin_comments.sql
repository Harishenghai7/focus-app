-- Migration: Pin Comments
-- Date: 2025-11-07
-- Description: Allow post owners to pin comments

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_comments_pinned ON comments(content_id, is_pinned) WHERE is_pinned = true;

COMMENT ON COLUMN comments.is_pinned IS 'True if comment is pinned by post owner';
COMMENT ON COLUMN comments.pinned_at IS 'Timestamp when comment was pinned';

-- Only one pinned comment per post
CREATE UNIQUE INDEX idx_one_pinned_per_post 
ON comments(content_id) 
WHERE is_pinned = true;
