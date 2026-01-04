-- ═══════════════════════════════════════════════════════════════════════
-- ADDITIONAL TABLES FOR COMPLETE FEATURES
-- Block, Report, Scheduled Messages, User Settings
-- ═══════════════════════════════════════════════════════════════════════

-- Table: blocked_users
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- Table: reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('conversation', 'message', 'user')),
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Table: scheduled_messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT,
  message_data JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_settings (for starred messages)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  starred_messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_user ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_sender ON scheduled_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled ON scheduled_messages(scheduled_for) WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- RLS Policies
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Blocked users policies
CREATE POLICY "Users can view their blocked list"
  ON blocked_users FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (user_id = auth.uid());

-- Reports policies
CREATE POLICY "Users can view their reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- Scheduled messages policies
CREATE POLICY "Users can view their scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can create scheduled messages"
  ON scheduled_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their scheduled messages"
  ON scheduled_messages FOR DELETE
  USING (sender_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view their settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their settings"
  ON user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON blocked_users TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON scheduled_messages TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Additional tables created successfully:';
  RAISE NOTICE '   - blocked_users';
  RAISE NOTICE '   - reports';
  RAISE NOTICE '   - scheduled_messages';
  RAISE NOTICE '   - user_settings';
  RAISE NOTICE '🚀 Focus Messages is 100% complete!';
END $$;
