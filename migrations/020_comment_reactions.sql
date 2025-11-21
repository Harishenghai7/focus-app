-- Migration: Comment Reactions System
-- Description: Add support for emoji reactions on comments

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('👍', '❤️', '😂', '😮', '😢', '🙏')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Add reaction_count column to comments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'reaction_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN reaction_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Function to update comment reaction count
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET reaction_count = reaction_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET reaction_count = GREATEST(reaction_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment reaction count
DROP TRIGGER IF EXISTS trigger_update_comment_reaction_count ON comment_reactions;
CREATE TRIGGER trigger_update_comment_reaction_count
  AFTER INSERT OR DELETE ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reaction_count();

-- Enable RLS on comment_reactions
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_reactions
CREATE POLICY "Users can view all comment reactions"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON comment_reactions TO authenticated;
GRANT ALL ON comment_reactions TO service_role;
