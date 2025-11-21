-- Quiz Feature Database Schema
-- Run this migration to set up quiz tables

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  duration INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_votes table
CREATE TABLE IF NOT EXISTS quiz_votes (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  selected_option INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_votes_quiz_id ON quiz_votes(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_votes_user_id ON quiz_votes(user_id);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes table
-- Anyone can view quizzes
CREATE POLICY "Quizzes are viewable by everyone"
  ON quizzes FOR SELECT
  USING (true);

-- Users can create their own quizzes
CREATE POLICY "Users can create quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quizzes
CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own quizzes
CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for quiz_votes table
-- Anyone can view votes
CREATE POLICY "Quiz votes are viewable by everyone"
  ON quiz_votes FOR SELECT
  USING (true);

-- Users can create their own votes
CREATE POLICY "Users can vote on quizzes"
  ON quiz_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes (optional - allow changing vote)
CREATE POLICY "Users can update own votes"
  ON quiz_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON quiz_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON quizzes TO authenticated;
GRANT ALL ON quiz_votes TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE quizzes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE quiz_votes_id_seq TO authenticated;
