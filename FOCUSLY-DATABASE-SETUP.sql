-- =====================================================
-- FOCUSLY MEMORY SYSTEM - DATABASE SETUP
-- =====================================================
-- This creates the table for storing Focusly's memory
-- about users (facts, preferences, events, emotions)
-- =====================================================

-- Create focusly_memory table
CREATE TABLE IF NOT EXISTS focusly_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_type VARCHAR(50) NOT NULL, -- 'fact', 'preference', 'event', 'emotion', 'achievement'
  content TEXT NOT NULL, -- JSON or plain text
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10), -- 1-10 scale
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast queries
  INDEX idx_focusly_memory_user (user_id),
  INDEX idx_focusly_memory_type (memory_type),
  INDEX idx_focusly_memory_importance (importance DESC),
  INDEX idx_focusly_memory_accessed (last_accessed DESC)
);

-- Enable Row Level Security
ALTER TABLE focusly_memory ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own memories
CREATE POLICY "Users can access their own memories"
  ON focusly_memory
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own memories
CREATE POLICY "Users can insert their own memories"
  ON focusly_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own memories
CREATE POLICY "Users can update their own memories"
  ON focusly_memory
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own memories
CREATE POLICY "Users can delete their own memories"
  ON focusly_memory
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FOCUSLY MESSAGES TABLE (if not already created)
-- =====================================================

CREATE TABLE IF NOT EXISTS focusly_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'focusly')),
  text TEXT NOT NULL,
  emotion VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_focusly_messages_user (user_id),
  INDEX idx_focusly_messages_created (created_at DESC)
);

-- Enable Row Level Security
ALTER TABLE focusly_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for focusly_messages
CREATE POLICY "Users can access their own messages"
  ON focusly_messages
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON focusly_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Get all memories for a user
-- SELECT * FROM focusly_memory WHERE user_id = 'user-uuid-here' ORDER BY importance DESC, last_accessed DESC;

-- Get user's facts
-- SELECT * FROM focusly_memory WHERE user_id = 'user-uuid-here' AND memory_type = 'fact';

-- Clean old low-importance memories (older than 90 days)
-- DELETE FROM focusly_memory 
-- WHERE user_id = 'user-uuid-here' 
-- AND importance < 5 
-- AND last_accessed < NOW() - INTERVAL '90 days';

-- Get conversation history
-- SELECT * FROM focusly_messages WHERE user_id = 'user-uuid-here' ORDER BY created_at DESC LIMIT 50;
