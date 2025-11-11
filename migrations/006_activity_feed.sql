-- Migration: Activity Feed
-- Date: 2025-11-07
-- Description: Track activities of followed users for "Following" tab

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('like', 'comment', 'follow', 'post')),
  content_type TEXT CHECK (content_type IN ('post', 'boltz', 'flash', 'comment')),
  content_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities of people they follow"
  ON activity_feed FOR SELECT
  USING (user_id = auth.uid());

COMMENT ON TABLE activity_feed IS 'Activity feed showing actions by followed users';
