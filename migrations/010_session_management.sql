-- Migration: Session Management
-- Date: 2025-11-07
-- Description: Track user sessions for security

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_name TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, last_active DESC);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE user_sessions IS 'Active user sessions for security management';
