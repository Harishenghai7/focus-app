-- ============================================
-- PRO-GRADE MESSAGING SYSTEM - DATABASE MIGRATION
-- Focus App - Surpassing Instagram & WhatsApp
-- ============================================

-- ============================================
-- 1. MESSAGE READ RECEIPTS (For Group Chats)
-- ============================================
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  group_message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id),
  UNIQUE(group_message_id, user_id),
  CONSTRAINT receipt_target_check CHECK (
    (message_id IS NOT NULL)::int + (group_message_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 2. TYPING INDICATORS (Realtime Presence)
-- ============================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_typing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT typing_target_check CHECK (
    (conversation_id IS NOT NULL)::int + (group_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 3. PINNED MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  group_message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT pinned_conversation_check CHECK (
    (conversation_id IS NOT NULL)::int + (group_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT pinned_message_check CHECK (
    (message_id IS NOT NULL)::int + (group_message_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 4. SCHEDULED MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES group_conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'gif', 'sticker')),
  media_url TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT scheduled_target_check CHECK (
    (conversation_id IS NOT NULL)::int + (group_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 5. MESSAGE EDIT HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS message_edit_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  group_message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  previous_content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT edit_history_target_check CHECK (
    (message_id IS NOT NULL)::int + (group_message_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 6. VOICE MESSAGES METADATA
-- ============================================
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  group_message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL, -- Duration in seconds
  waveform_data TEXT, -- JSON array of amplitude values
  transcription TEXT, -- Optional voice-to-text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT voice_message_target_check CHECK (
    (message_id IS NOT NULL)::int + (group_message_id IS NOT NULL)::int = 1
  )
);

-- ============================================
-- 7. MODIFY MESSAGES TABLE
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_delivered BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delete_for_everyone BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forward_count INTEGER DEFAULT 0;

-- ============================================
-- 8. MODIFY GROUP_MESSAGES TABLE
-- ============================================
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES group_messages(id);
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS forward_count INTEGER DEFAULT 0;

-- ============================================
-- 9. MODIFY CONVERSATIONS TABLE
-- ============================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS disappearing_messages_duration INTEGER; -- in seconds (0 = off)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- ============================================
-- 10. MODIFY GROUP_CONVERSATIONS TABLE
-- ============================================
ALTER TABLE group_conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE group_conversations ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE;
ALTER TABLE group_conversations ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_conversations ADD COLUMN IF NOT EXISTS disappearing_messages_duration INTEGER;
ALTER TABLE group_conversations ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';

-- ============================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. RLS POLICIES - MESSAGE_READ_RECEIPTS
-- ============================================
DROP POLICY IF EXISTS "Users can view read receipts in own conversations" ON message_read_receipts;
CREATE POLICY "Users can view read receipts in own conversations" ON message_read_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_read_receipts.message_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM group_messages gm
      LEFT JOIN group_participants gp ON gm.group_id = gp.group_id
      WHERE gm.id = message_read_receipts.group_message_id
      AND gp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create read receipts" ON message_read_receipts;
CREATE POLICY "Users can create read receipts" ON message_read_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 13. RLS POLICIES - TYPING_INDICATORS
-- ============================================
DROP POLICY IF EXISTS "Users can view typing indicators in own conversations" ON typing_indicators;
CREATE POLICY "Users can view typing indicators in own conversations" ON typing_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = typing_indicators.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = typing_indicators.group_id
      AND group_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own typing indicators" ON typing_indicators;
CREATE POLICY "Users can update own typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 14. RLS POLICIES - PINNED_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "Users can view pinned messages in own conversations" ON pinned_messages;
CREATE POLICY "Users can view pinned messages in own conversations" ON pinned_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = pinned_messages.conversation_id
      AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = pinned_messages.group_id
      AND group_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can pin messages in own conversations" ON pinned_messages;
CREATE POLICY "Users can pin messages in own conversations" ON pinned_messages
  FOR INSERT WITH CHECK (
    auth.uid() = pinned_by AND (
      EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = pinned_messages.conversation_id
        AND (conversations.participant_1 = auth.uid() OR conversations.participant_2 = auth.uid())
      ) OR
      EXISTS (
        SELECT 1 FROM group_participants
        WHERE group_participants.group_id = pinned_messages.group_id
        AND group_participants.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete pinned messages" ON pinned_messages;
CREATE POLICY "Users can delete pinned messages" ON pinned_messages
  FOR DELETE USING (auth.uid() = pinned_by);

-- ============================================
-- 15. RLS POLICIES - SCHEDULED_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "Users can view own scheduled messages" ON scheduled_messages;
CREATE POLICY "Users can view own scheduled messages" ON scheduled_messages
  FOR SELECT USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can create scheduled messages" ON scheduled_messages;
CREATE POLICY "Users can create scheduled messages" ON scheduled_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own scheduled messages" ON scheduled_messages;
CREATE POLICY "Users can update own scheduled messages" ON scheduled_messages
  FOR UPDATE USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete own scheduled messages" ON scheduled_messages;
CREATE POLICY "Users can delete own scheduled messages" ON scheduled_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- ============================================
-- 16. RLS POLICIES - MESSAGE_EDIT_HISTORY
-- ============================================
DROP POLICY IF EXISTS "Users can view edit history of accessible messages" ON message_edit_history;
CREATE POLICY "Users can view edit history of accessible messages" ON message_edit_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_edit_history.message_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM group_messages gm
      LEFT JOIN group_participants gp ON gm.group_id = gp.group_id
      WHERE gm.id = message_edit_history.group_message_id
      AND gp.user_id = auth.uid()
    )
  );

-- ============================================
-- 17. RLS POLICIES - VOICE_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "Users can view voice messages in own conversations" ON voice_messages;
CREATE POLICY "Users can view voice messages in own conversations" ON voice_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = voice_messages.message_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM group_messages gm
      LEFT JOIN group_participants gp ON gm.group_id = gp.group_id
      WHERE gm.id = voice_messages.group_message_id
      AND gp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create voice messages" ON voice_messages;
CREATE POLICY "Users can create voice messages" ON voice_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = voice_messages.message_id
      AND m.sender_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM group_messages gm
      WHERE gm.id = voice_messages.group_message_id
      AND gm.sender_id = auth.uid()
    )
  );

-- ============================================
-- 18. RLS POLICIES - GROUP_CONVERSATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view groups they are part of" ON group_conversations;
CREATE POLICY "Users can view groups they are part of" ON group_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_conversations.id
      AND group_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create groups" ON group_conversations;
CREATE POLICY "Users can create groups" ON group_conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group admins can update groups" ON group_conversations;
CREATE POLICY "Group admins can update groups" ON group_conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_conversations.id
      AND group_participants.user_id = auth.uid()
      AND group_participants.role = 'admin'
    )
  );

-- ============================================
-- 19. RLS POLICIES - GROUP_PARTICIPANTS
-- ============================================
DROP POLICY IF EXISTS "Users can view participants in their groups" ON group_participants;
CREATE POLICY "Users can view participants in their groups" ON group_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      WHERE gp.group_id = group_participants.group_id
      AND gp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group admins can add participants" ON group_participants;
CREATE POLICY "Group admins can add participants" ON group_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_participants.group_id
      AND group_participants.user_id = auth.uid()
      AND group_participants.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Group admins can remove participants" ON group_participants;
CREATE POLICY "Group admins can remove participants" ON group_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_participants gp
      WHERE gp.group_id = group_participants.group_id
      AND gp.user_id = auth.uid()
      AND gp.role = 'admin'
    ) OR
    group_participants.user_id = auth.uid() -- Users can leave groups
  );

-- ============================================
-- 20. RLS POLICIES - GROUP_MESSAGES
-- ============================================
DROP POLICY IF EXISTS "Users can view messages in their groups" ON group_messages;
CREATE POLICY "Users can view messages in their groups" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_messages.group_id
      AND group_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their groups" ON group_messages;
CREATE POLICY "Users can send messages to their groups" ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM group_participants
      WHERE group_participants.group_id = group_messages.group_id
      AND group_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own group messages" ON group_messages;
CREATE POLICY "Users can update own group messages" ON group_messages
  FOR UPDATE USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete own group messages" ON group_messages;
CREATE POLICY "Users can delete own group messages" ON group_messages
  FOR DELETE USING (auth.uid() = sender_id);

-- ============================================
-- 21. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_group_message_id ON message_read_receipts(group_message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON message_read_receipts(user_id);

CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_group_id ON typing_indicators(group_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id ON typing_indicators(user_id);

CREATE INDEX IF NOT EXISTS idx_pinned_messages_conversation_id ON pinned_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_group_id ON pinned_messages(group_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_sent ON scheduled_messages(sent);

CREATE INDEX IF NOT EXISTS idx_message_edit_history_message_id ON message_edit_history(message_id);
CREATE INDEX IF NOT EXISTS idx_message_edit_history_group_message_id ON message_edit_history(group_message_id);

CREATE INDEX IF NOT EXISTS idx_voice_messages_message_id ON voice_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_group_message_id ON voice_messages(group_message_id);

CREATE INDEX IF NOT EXISTS idx_messages_is_delivered ON messages(is_delivered);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_id ON group_participants(group_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user_id ON group_participants(user_id);

-- ============================================
-- 22. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to auto-mark messages as delivered
CREATE OR REPLACE FUNCTION mark_message_delivered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND NEW.is_delivered = FALSE THEN
    NEW.is_delivered = TRUE;
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_mark_message_delivered ON messages;
CREATE TRIGGER trigger_mark_message_delivered
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION mark_message_delivered();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      last_message_id = NEW.id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update group conversation timestamp
CREATE OR REPLACE FUNCTION update_group_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_conversations
  SET last_message_at = NEW.created_at,
      last_message_id = NEW.id
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_conversation_timestamp ON group_messages;
CREATE TRIGGER trigger_update_group_conversation_timestamp
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_conversation_timestamp();

-- Function to clean up expired typing indicators
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMPLETE! 🎉
-- ============================================
-- Run this migration in Supabase SQL Editor
-- Then implement the frontend features!
