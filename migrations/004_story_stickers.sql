-- Migration: Story Stickers Support
-- Date: 2025-11-07
-- Description: Add interactive stickers to stories (polls, questions, etc.)

-- Add stickers column to flashes table
ALTER TABLE flashes
ADD COLUMN IF NOT EXISTS stickers JSONB DEFAULT '[]'::jsonb;

-- Create story_responses table for poll/question responses
CREATE TABLE IF NOT EXISTS story_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flash_id UUID REFERENCES flashes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sticker_id TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('poll_vote', 'question_answer', 'reaction')),
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(flash_id, user_id, sticker_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_responses_flash ON story_responses(flash_id);
CREATE INDEX IF NOT EXISTS idx_story_responses_user ON story_responses(user_id);

-- RLS Policies
ALTER TABLE story_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view responses to stories they can see"
  ON story_responses FOR SELECT
  USING (flash_id IN (SELECT id FROM flashes WHERE user_id = auth.uid() OR user_id IN (
    SELECT following_id FROM follows WHERE follower_id = auth.uid()
  )));

CREATE POLICY "Users can add responses"
  ON story_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

COMMENT ON COLUMN flashes.stickers IS 'Array of sticker objects (polls, questions, music, location, etc.)';
COMMENT ON TABLE story_responses IS 'User responses to interactive story stickers';

-- Example sticker format:
-- {
--   "id": "sticker_123",
--   "type": "poll",
--   "data": {
--     "question": "Which do you prefer?",
--     "options": ["Option A", "Option B"],
--     "votes": [0, 0]
--   },
--   "position": {"x": 50, "y": 50}
-- }
