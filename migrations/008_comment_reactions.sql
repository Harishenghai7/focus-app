-- Migration: Comment Reactions
-- Date: 2025-11-07
-- Description: Add emoji reactions to comments

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comment reactions"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their reactions"
  ON comment_reactions FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE comment_reactions IS 'Emoji reactions on comments';
