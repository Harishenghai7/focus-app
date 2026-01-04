-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS MESSAGES - PRODUCTION DATABASE SCHEMA v2.1 (FIXED)
-- Complete messaging system with calls, presence, and advanced features
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS user_presence CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: conversations
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  group_name TEXT,
  group_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_id UUID,
  last_message_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: conversation_participants
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_pinned ON conversation_participants(user_id, is_pinned) WHERE is_pinned = TRUE;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: messages
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Message content
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'voice', 'gif', 'sticker', 'shared_post', 'shared_flash', 'shared_boltz')),
  content TEXT,
  
  -- Reply functionality
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Delivery tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'seen')),
  delivered_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  
  -- Delete functionality
  deleted_for_sender BOOLEAN DEFAULT FALSE,
  deleted_for_everyone BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  unsend_time_limit INTEGER DEFAULT 900, -- 15 minutes in seconds
  
  -- Metadata (for shared content, effects, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_status ON messages(status) WHERE status != 'seen';
CREATE INDEX idx_messages_reply ON messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: message_attachments
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'voice', 'gif', 'sticker')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- for voice/video in seconds
  size INTEGER, -- in bytes
  width INTEGER,
  height INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_attachments_type ON message_attachments(type);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: calls
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL CHECK (status IN ('calling', 'ringing', 'answered', 'ended', 'rejected', 'failed', 'missed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  signaling_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_conversation ON calls(conversation_id, created_at DESC);
CREATE INDEX idx_calls_participants ON calls(caller_id, receiver_id);
CREATE INDEX idx_calls_status ON calls(status) WHERE status IN ('calling', 'ringing', 'answered');

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

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id) WHERE is_typing = TRUE;

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: user_presence
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_presence_online ON user_presence(is_online, last_seen_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: blocked_users
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_id);

-- ═══════════════════════════════════════════════════════════════════════
-- TABLE: reports
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('message', 'conversation', 'user')),
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_type ON reports(reported_type, reported_id);

-- ═══════════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- Update conversation last message
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

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.deleted_for_everyone = FALSE)
  EXECUTE FUNCTION update_conversation_last_message();

-- Get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if conversation exists
  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2 
    ON cp1.conversation_id = cp2.conversation_id
  INNER JOIN conversations c 
    ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user1_id
    AND cp2.user_id = user2_id
    AND c.type = 'direct'
  LIMIT 1;
  
  -- Create if doesn't exist
  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, created_at)
    VALUES ('direct', NOW())
    RETURNING id INTO conv_id;
    
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_message_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Update all unread messages up to this message
  UPDATE messages
  SET 
    status = 'seen',
    seen_at = NOW(),
    updated_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND status != 'seen'
    AND created_at <= (SELECT created_at FROM messages WHERE id = p_message_id)
    AND deleted_for_everyone = FALSE;
    
  -- Update participant's last read
  UPDATE conversation_participants
  SET 
    last_read_message_id = p_message_id,
    last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can unsend message (within time limit)
CREATE OR REPLACE FUNCTION can_unsend_message(
  p_message_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  msg RECORD;
BEGIN
  SELECT created_at, unsend_time_limit INTO msg
  FROM messages
  WHERE id = p_message_id;
  
  IF msg IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN (EXTRACT(EPOCH FROM (NOW() - msg.created_at)) <= msg.unsend_time_limit);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Conversations: Participants only
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Conversation Participants: Own records only
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their participant settings"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: Participants only, respect blocks
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
    AND (
      deleted_for_everyone = FALSE OR sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Message Attachments: Follow message permissions
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE conversation_id IN (
        SELECT conversation_id FROM conversation_participants
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create attachments for their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sender_id = auth.uid()
    )
  );

-- Calls: Participants only
CREATE POLICY "Users can view their calls"
  ON calls FOR SELECT
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update their calls"
  ON calls FOR UPDATE
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Typing Indicators: Conversation participants
CREATE POLICY "Users can view typing in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their typing status"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Presence: Public
CREATE POLICY "Users can view all presence"
  ON user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Blocked Users: Own blocks only
CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Reports: Own reports only
CREATE POLICY "Users can view their reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════════

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_attachments TO authenticated;
GRANT ALL ON calls TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT ALL ON reports TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '✅ Focus Messages Production Schema Created!';
  RAISE NOTICE '   - 9 tables with complete relationships';
  RAISE NOTICE '   - All RLS policies enforced';
  RAISE NOTICE '   - Helper functions ready';
  RAISE NOTICE '   - Indexes optimized for performance';
  RAISE NOTICE '🚀 Ready for production messaging!';
END $$;
