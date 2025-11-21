-- OPTIONAL: Add draft and archive columns to posts table
-- Only run this if you want draft/archive functionality
-- The app works fine without these columns!

-- Add is_draft column (for saving drafts)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;

-- Add is_archived column (for archiving posts)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Add scheduled_for column (for scheduling posts)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_drafts 
ON posts(user_id, is_draft) 
WHERE is_draft = true;

CREATE INDEX IF NOT EXISTS idx_posts_archived 
ON posts(user_id, is_archived) 
WHERE is_archived = true;

-- Comments
COMMENT ON COLUMN posts.is_draft IS 'True if post is saved as draft (not published)';
COMMENT ON COLUMN posts.is_archived IS 'True if post is archived (hidden from profile)';
COMMENT ON COLUMN posts.scheduled_for IS 'Timestamp when post should be auto-published';
