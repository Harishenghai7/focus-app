-- Quick fix for count columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

ALTER TABLE boltz ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE boltz ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE boltz ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Update existing counts
UPDATE posts SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id),
  shares_count = (SELECT COUNT(*) FROM shares WHERE post_id = posts.id);

UPDATE boltz SET 
  likes_count = (SELECT COUNT(*) FROM likes WHERE boltz_id = boltz.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE boltz_id = boltz.id),
  shares_count = (SELECT COUNT(*) FROM shares WHERE boltz_id = boltz.id);