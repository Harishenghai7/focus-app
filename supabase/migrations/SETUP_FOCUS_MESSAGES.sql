-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS MESSAGES - COMPLETE SETUP (RUN THIS IN SUPABASE SQL EDITOR)
-- Copy this entire file and paste into Supabase SQL Editor, then click RUN
-- ═══════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS message_requests CASCADE;
DROP TABLE IF EXISTS conversation_settings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS scheduled_messages CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_messages_as_read(UUID, UUID) CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: conversations
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  group_name TEXT,
  group_avatar TEXT,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: messages
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'voice', 'post_share', 'boltz_share', 'flash_share')),
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  
  voice_url TEXT,
  voice_duration INTEGER,
  voice_transcription TEXT,
  
  content_context JSONB,
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb,
  
  disappearing BOOLEAN DEFAULT FALSE,
  disappears_at TIMESTAMPTZ,
  
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_for JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: conversation_settings
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE conversation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  pinned BOOLEAN DEFAULT FALSE,
  pinned_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  disappearing_messages BOOLEAN DEFAULT FALSE,
  read_receipts_enabled BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: message_requests
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE message_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sender_id, recipient_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: typing_indicators
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  last_typed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: blocked_users
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: reports
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE reports (
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

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: scheduled_messages
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT,
  message_data JSONB DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: user_settings
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  starred_messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_type ON conversations(type);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_deleted ON messages(deleted) WHERE deleted = FALSE;

CREATE INDEX idx_conversation_settings_user ON conversation_settings(user_id);
CREATE INDEX idx_conversation_settings_pinned ON conversation_settings(user_id, pinned) WHERE pinned = TRUE;

CREATE INDEX idx_message_requests_recipient ON message_requests(recipient_id, status);
CREATE INDEX idx_message_requests_sender ON message_requests(sender_id);

CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id) WHERE is_typing = TRUE;

CREATE INDEX idx_blocked_users_user ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked ON blocked_users(blocked_user_id);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE INDEX idx_scheduled_messages_sender ON scheduled_messages(sender_id);
CREATE INDEX idx_scheduled_messages_scheduled ON scheduled_messages(scheduled_for) WHERE sent = FALSE;

CREATE INDEX idx_user_settings_user ON user_settings(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - CONVERSATIONS
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (participants @> jsonb_build_array(auth.uid()::text));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (participants @> jsonb_build_array(auth.uid()::text));

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (participants @> jsonb_build_array(auth.uid()::text));

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - MESSAGES
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participants @> jsonb_build_array(auth.uid()::text)
    )
    AND NOT (deleted_for @> jsonb_build_array(auth.uid()::text))
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() 
    AND conversation_id IN (
      SELECT id FROM conversations 
      WHERE participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - OTHER TABLES
-- ═══════════════════════════════════════════════════════════════════════
CREATE POLICY "Users can view their own settings" ON conversation_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own settings" ON conversation_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own settings" ON conversation_settings FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view their message requests" ON message_requests FOR SELECT USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Users can create message requests" ON message_requests FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Recipients can update requests" ON message_requests FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Users can view typing in their conversations" ON typing_indicators FOR SELECT
  USING (conversation_id IN (SELECT id FROM conversations WHERE participants @> jsonb_build_array(auth.uid()::text)));
CREATE POLICY "Users can manage their own typing status" ON typing_indicators FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their blocked list" ON blocked_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unblock" ON blocked_users FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view their reports" ON reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their scheduled messages" ON scheduled_messages FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY "Users can create scheduled messages" ON scheduled_messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can delete their scheduled messages" ON scheduled_messages FOR DELETE USING (sender_id = auth.uid());

CREATE POLICY "Users can view their settings" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their settings" ON user_settings FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  SELECT id INTO conv_id
  FROM conversations
  WHERE type = 'direct'
    AND participants @> jsonb_build_array(user1_id::text)
    AND participants @> jsonb_build_array(user2_id::text)
    AND jsonb_array_length(participants) = 2
  LIMIT 1;
  
  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, participants)
    VALUES ('direct', jsonb_build_array(user1_id::text, user2_id::text))
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET read_by = CASE
    WHEN read_by @> jsonb_build_array(p_user_id::text) THEN read_by
    ELSE read_by || jsonb_build_array(p_user_id::text)
  END,
  updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND NOT (read_by @> jsonb_build_array(p_user_id::text))
    AND deleted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ═══════════════════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON conversation_settings TO authenticated;
GRANT ALL ON message_requests TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON scheduled_messages TO authenticated;
GRANT ALL ON user_settings TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '✅ Focus Messages Database Setup Complete!';
  RAISE NOTICE '   - 9 tables created';
  RAISE NOTICE '   - All RLS policies applied';
  RAISE NOTICE '   - All functions and triggers created';
  RAISE NOTICE '🚀 Ready to use!';
END $$;
