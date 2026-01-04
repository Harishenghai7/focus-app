-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS MESSAGES - COMPLETE DATABASE SCHEMA
-- Version 2.0 - Bulletproof with proper JSONB handling
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS message_requests CASCADE;
DROP TABLE IF EXISTS conversation_settings CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

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
  
  -- Message type and content
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'voice', 'post_share', 'boltz_share', 'flash_share')),
  content TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Voice message
  voice_url TEXT,
  voice_duration INTEGER,
  voice_transcription TEXT,
  
  -- Shared content
  content_context JSONB,
  
  -- Interactions
  reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb,
  
  -- Disappearing messages
  disappearing BOOLEAN DEFAULT FALSE,
  disappears_at TIMESTAMPTZ,
  
  -- Deletion
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_for JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
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
  
  -- Settings
  pinned BOOLEAN DEFAULT FALSE,
  pinned_at TIMESTAMPTZ,
  muted BOOLEAN DEFAULT FALSE,
  muted_until TIMESTAMPTZ,
  disappearing_messages BOOLEAN DEFAULT FALSE,
  read_receipts_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
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
  
  -- Constraints
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
  
  -- Constraints
  UNIQUE(conversation_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES FOR PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

-- Conversations
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_type ON conversations(type);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_deleted ON messages(deleted) WHERE deleted = FALSE;

-- Conversation Settings
CREATE INDEX idx_conversation_settings_user ON conversation_settings(user_id);
CREATE INDEX idx_conversation_settings_pinned ON conversation_settings(user_id, pinned) WHERE pinned = TRUE;

-- Message Requests
CREATE INDEX idx_message_requests_recipient ON message_requests(recipient_id, status);
CREATE INDEX idx_message_requests_sender ON message_requests(sender_id);

-- Typing Indicators
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id) WHERE is_typing = TRUE;

-- ═══════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

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
-- RLS POLICIES - CONVERSATION SETTINGS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view their own settings"
  ON conversation_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own settings"
  ON conversation_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON conversation_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - MESSAGE REQUESTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view their message requests"
  ON message_requests FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can create message requests"
  ON message_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update message requests"
  ON message_requests FOR UPDATE
  USING (recipient_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- RLS POLICIES - TYPING INDICATORS
-- ═══════════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view typing in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Users can manage their own typing status"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Update conversation's last message
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

-- Get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE type = 'direct'
    AND participants @> jsonb_build_array(user1_id::text)
    AND participants @> jsonb_build_array(user2_id::text)
    AND jsonb_array_length(participants) = 2
  LIMIT 1;
  
  -- Create if not found
  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, participants)
    VALUES ('direct', jsonb_build_array(user1_id::text, user2_id::text))
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark messages as read
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

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ COMPLETE! Focus Messages Schema Ready
-- ═══════════════════════════════════════════════════════════════════════

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '✅ Tables created successfully:';
  RAISE NOTICE '   - conversations';
  RAISE NOTICE '   - messages';
  RAISE NOTICE '   - conversation_settings';
  RAISE NOTICE '   - message_requests';
  RAISE NOTICE '   - typing_indicators';
  RAISE NOTICE '✅ All RLS policies applied';
  RAISE NOTICE '✅ All functions created';
  RAISE NOTICE '✅ All triggers created';
  RAISE NOTICE '🚀 Focus Messages is ready!';
END $$;
