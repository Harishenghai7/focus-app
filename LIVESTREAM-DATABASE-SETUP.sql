-- ============================================
-- LIVESTREAM DATABASE SETUP
-- ============================================
-- Run this SQL to set up all tables for live streaming

-- 1. Create live_streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcaster_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('live', 'ended', 'scheduled')) DEFAULT 'live',
  like_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_broadcaster ON live_streams(broadcaster_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_started_at ON live_streams(started_at DESC);

-- 2. Create stream_viewers table
CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration INTEGER, -- Duration in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_joined ON stream_viewers(joined_at DESC);

-- 3. Create stream_chat table
CREATE TABLE IF NOT EXISTS stream_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stream_chat_stream ON stream_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_created ON stream_chat(created_at DESC);

-- 4. Create stream_likes table
CREATE TABLE IF NOT EXISTS stream_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stream_likes_stream ON stream_likes(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_likes_user ON stream_likes(user_id);

-- 5. Create stream_reports table (for moderation)
CREATE TABLE IF NOT EXISTS stream_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_stream_reports_stream ON stream_reports(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_reports_status ON stream_reports(status);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to increment stream likes
CREATE OR REPLACE FUNCTION increment_stream_likes(stream_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE live_streams
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active viewer count
CREATE OR REPLACE FUNCTION get_active_viewer_count(stream_id UUID)
RETURNS INTEGER AS $$
DECLARE
  viewer_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO viewer_count
  FROM stream_viewers
  WHERE stream_viewers.stream_id = get_active_viewer_count.stream_id
    AND joined_at >= NOW() - INTERVAL '5 minutes'
    AND left_at IS NULL;
  
  RETURN COALESCE(viewer_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end a stream
CREATE OR REPLACE FUNCTION end_stream(stream_id UUID, broadcaster_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_broadcaster BOOLEAN;
BEGIN
  -- Check if the user is the broadcaster
  SELECT EXISTS(
    SELECT 1 FROM live_streams
    WHERE id = stream_id AND live_streams.broadcaster_id = end_stream.broadcaster_id
  ) INTO is_broadcaster;
  
  IF NOT is_broadcaster THEN
    RETURN FALSE;
  END IF;
  
  -- Update stream status
  UPDATE live_streams
  SET status = 'ended',
      ended_at = NOW(),
      updated_at = NOW()
  WHERE id = stream_id;
  
  -- Mark all viewers as left
  UPDATE stream_viewers
  SET left_at = NOW(),
      duration = EXTRACT(EPOCH FROM (NOW() - joined_at))::INTEGER
  WHERE stream_viewers.stream_id = end_stream.stream_id
    AND left_at IS NULL;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get stream statistics
CREATE OR REPLACE FUNCTION get_stream_stats(stream_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_viewers', (
      SELECT COUNT(DISTINCT user_id)
      FROM stream_viewers
      WHERE stream_viewers.stream_id = get_stream_stats.stream_id
    ),
    'active_viewers', (
      SELECT COUNT(*)
      FROM stream_viewers
      WHERE stream_viewers.stream_id = get_stream_stats.stream_id
        AND joined_at >= NOW() - INTERVAL '5 minutes'
        AND left_at IS NULL
    ),
    'total_likes', (
      SELECT COUNT(*)
      FROM stream_likes
      WHERE stream_likes.stream_id = get_stream_stats.stream_id
    ),
    'total_messages', (
      SELECT COUNT(*)
      FROM stream_chat
      WHERE stream_chat.stream_id = get_stream_stats.stream_id
    ),
    'duration', (
      SELECT EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at))::INTEGER
      FROM live_streams
      WHERE id = get_stream_stats.stream_id
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams
CREATE POLICY "Users can view live streams"
  ON live_streams FOR SELECT
  USING (status = 'live' OR broadcaster_id = auth.uid());

CREATE POLICY "Broadcasters can insert their own streams"
  ON live_streams FOR INSERT
  WITH CHECK (broadcaster_id = auth.uid());

CREATE POLICY "Broadcasters can update their own streams"
  ON live_streams FOR UPDATE
  USING (broadcaster_id = auth.uid());

CREATE POLICY "Broadcasters can delete their own streams"
  ON live_streams FOR DELETE
  USING (broadcaster_id = auth.uid());

-- RLS Policies for stream_viewers
CREATE POLICY "Users can view stream viewers"
  ON stream_viewers FOR SELECT
  USING (true);

CREATE POLICY "Users can join streams"
  ON stream_viewers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own viewer record"
  ON stream_viewers FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for stream_chat
CREATE POLICY "Users can view chat messages"
  ON stream_chat FOR SELECT
  USING (true);

CREATE POLICY "Users can send chat messages"
  ON stream_chat FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON stream_chat FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for stream_likes
CREATE POLICY "Users can view likes"
  ON stream_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like streams"
  ON stream_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike streams"
  ON stream_likes FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for stream_reports
CREATE POLICY "Users can view their own reports"
  ON stream_reports FOR SELECT
  USING (reported_by = auth.uid());

CREATE POLICY "Users can create reports"
  ON stream_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_reports_updated_at
  BEFORE UPDATE ON stream_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for live streaming tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_viewers;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_likes;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
-- Insert a sample live stream
INSERT INTO live_streams (broadcaster_id, title, description, status)
VALUES (
  (SELECT id FROM users LIMIT 1),
  'My First Live Stream!',
  'Join me for an exciting live session',
  'live'
);

-- Insert sample chat messages
INSERT INTO stream_chat (stream_id, user_id, message)
VALUES (
  (SELECT id FROM live_streams ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM users LIMIT 1),
  'Hello everyone! Welcome to the stream!'
);
*/

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON live_streams TO authenticated;
GRANT SELECT, INSERT, UPDATE ON stream_viewers TO authenticated;
GRANT SELECT, INSERT, DELETE ON stream_chat TO authenticated;
GRANT SELECT, INSERT, DELETE ON stream_likes TO authenticated;
GRANT SELECT, INSERT ON stream_reports TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_stream_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_viewer_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION end_stream(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stream_stats(UUID) TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'stream%' OR table_name = 'live_streams'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ LiveStream database setup completed successfully!';
  RAISE NOTICE 'Tables created: live_streams, stream_viewers, stream_chat, stream_likes, stream_reports';
  RAISE NOTICE 'Functions created: increment_stream_likes, get_active_viewer_count, end_stream, get_stream_stats';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Realtime enabled for live updates';
END $$;
