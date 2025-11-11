-- Migration: Followed Hashtags
-- Description: Allow users to follow hashtags

CREATE TABLE IF NOT EXISTS followed_hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hashtag)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_followed_hashtags_user_id ON followed_hashtags (user_id);
CREATE INDEX IF NOT EXISTS idx_followed_hashtags_hashtag ON followed_hashtags (hashtag);

-- RLS policies
ALTER TABLE followed_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own followed hashtags"
  ON followed_hashtags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow hashtags"
  ON followed_hashtags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow hashtags"
  ON followed_hashtags FOR DELETE
  USING (auth.uid() = user_id);
