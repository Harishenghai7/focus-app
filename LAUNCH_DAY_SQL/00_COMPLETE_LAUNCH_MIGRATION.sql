-- ═══════════════════════════════════════════════════════════════════════
-- 🚀 FOCUS APP - COMPLETE LAUNCH DAY MIGRATION
-- Run this ONCE in Supabase SQL Editor before midnight!
-- ═══════════════════════════════════════════════════════════════════════
-- Created: December 31, 2025
-- Purpose: Ensure all tables, policies, buckets, and realtime are ready
-- ═══════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 1: VERIFY/CREATE CORE TABLES                                  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Check if messaging tables already exist (skip if they do)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations') THEN
        RAISE NOTICE 'Creating messaging tables...';
        
        -- Create conversations table
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
        
        CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
        
    ELSE
        RAISE NOTICE 'Conversations table already exists';
    END IF;
END $$;

-- Create conversation_participants if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversation_participants') THEN
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
        
        CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);
        CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
    ELSE
        RAISE NOTICE 'conversation_participants already exists';
    END IF;
END $$;

-- Create messages if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        CREATE TABLE messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          type TEXT NOT NULL DEFAULT 'text',
          content TEXT,
          reply_to_message_id UUID,
          status TEXT DEFAULT 'sent',
          delivered_at TIMESTAMPTZ,
          seen_at TIMESTAMPTZ,
          deleted_for_sender BOOLEAN DEFAULT FALSE,
          deleted_for_everyone BOOLEAN DEFAULT FALSE,
          deleted_at TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}'::jsonb,
          reactions JSONB DEFAULT '[]'::jsonb,
          is_starred BOOLEAN DEFAULT FALSE,
          attachments JSONB DEFAULT '[]'::jsonb,
          message_type TEXT DEFAULT 'text',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
    ELSE
        -- Add missing columns to existing messages table
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
        RAISE NOTICE 'messages table exists, added any missing columns';
    END IF;
END $$;

-- Create calls table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'calls') THEN
        CREATE TABLE calls (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
          status TEXT NOT NULL DEFAULT 'calling',
          started_at TIMESTAMPTZ,
          ended_at TIMESTAMPTZ,
          duration_seconds INTEGER,
          signaling_data JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_calls_conversation ON calls(conversation_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status) WHERE status IN ('calling', 'ringing', 'answered');
    ELSE
        RAISE NOTICE 'calls table already exists';
    END IF;
END $$;

-- Create typing_indicators if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'typing_indicators') THEN
        CREATE TABLE typing_indicators (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          is_typing BOOLEAN DEFAULT FALSE,
          last_typed_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(conversation_id, user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id) WHERE is_typing = TRUE;
    ELSE
        RAISE NOTICE 'typing_indicators already exists';
    END IF;
END $$;

-- Create user_presence if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_presence') THEN
        CREATE TABLE user_presence (
          user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
          is_online BOOLEAN DEFAULT FALSE,
          last_seen_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online, last_seen_at DESC);
    ELSE
        RAISE NOTICE 'user_presence already exists';
    END IF;
END $$;

-- Create blocked_users if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'blocked_users') THEN
        CREATE TABLE blocked_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          blocked_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(blocker_id, blocked_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
    ELSE
        RAISE NOTICE 'blocked_users already exists';
    END IF;
END $$;

-- Create reports if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'reports') THEN
        CREATE TABLE reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          reported_type TEXT NOT NULL,
          reported_id UUID NOT NULL,
          reason TEXT NOT NULL,
          details TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          reviewed_at TIMESTAMPTZ,
          reviewed_by UUID REFERENCES profiles(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
        CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    ELSE
        RAISE NOTICE 'reports already exists';
    END IF;
END $$;

-- Create pinned_messages if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'pinned_messages') THEN
        CREATE TABLE pinned_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          pinned_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(conversation_id, message_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_pinned_conversation ON pinned_messages(conversation_id);
    ELSE
        RAISE NOTICE 'pinned_messages already exists';
    END IF;
END $$;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 2: USER SETTINGS TABLE (Critical for Settings Page)           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Ensure user_settings table exists with all columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_settings') THEN
        CREATE TABLE user_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          theme TEXT DEFAULT 'dark',
          font_size TEXT DEFAULT 'medium',
          glassmorphism_enabled BOOLEAN DEFAULT TRUE,
          high_contrast_mode BOOLEAN DEFAULT FALSE,
          account_visibility TEXT DEFAULT 'public',
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          show_activity_status BOOLEAN DEFAULT TRUE,
          who_can_view_profile TEXT DEFAULT 'everyone',
          who_can_view_posts TEXT DEFAULT 'everyone',
          who_can_view_stories TEXT DEFAULT 'everyone',
          who_can_view_boltz TEXT DEFAULT 'everyone',
          push_notifications BOOLEAN DEFAULT TRUE,
          email_notifications BOOLEAN DEFAULT TRUE,
          in_app_notifications BOOLEAN DEFAULT TRUE,
          notify_likes BOOLEAN DEFAULT TRUE,
          notify_comments BOOLEAN DEFAULT TRUE,
          notify_followers BOOLEAN DEFAULT TRUE,
          notify_mentions BOOLEAN DEFAULT TRUE,
          notify_messages BOOLEAN DEFAULT TRUE,
          notify_boltz BOOLEAN DEFAULT TRUE,
          notify_flash BOOLEAN DEFAULT TRUE,
          notification_sound TEXT DEFAULT 'default',
          quiet_hours_enabled BOOLEAN DEFAULT FALSE,
          quiet_hours_start TIME,
          quiet_hours_end TIME,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
    ELSE
        -- Add any missing columns
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS glassmorphism_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS high_contrast_mode BOOLEAN DEFAULT FALSE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS account_visibility TEXT DEFAULT 'public';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS show_activity_status BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS who_can_view_profile TEXT DEFAULT 'everyone';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS who_can_view_posts TEXT DEFAULT 'everyone';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS who_can_view_stories TEXT DEFAULT 'everyone';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS who_can_view_boltz TEXT DEFAULT 'everyone';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_likes BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_comments BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_followers BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN DEFAULT TRUE;
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notification_sound TEXT DEFAULT 'default';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'user_settings exists, added any missing columns';
    END IF;
END $$;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 3: ESSENTIAL HELPER FUNCTIONS                                 ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Get or create conversation function
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

-- Update conversation last message trigger
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

-- Create trigger if not exists
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 4: RLS POLICIES (Security)                                    ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DO $$
DECLARE
    _sql text;
BEGIN
    FOR _sql IN 
        SELECT 'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';'
        FROM pg_policies 
        WHERE tablename IN ('conversations', 'conversation_participants', 'messages', 'calls', 
                           'typing_indicators', 'user_presence', 'blocked_users', 'reports', 
                           'user_settings', 'pinned_messages')
    LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

-- Conversation Participants policies
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid() OR true);

CREATE POLICY "Users can update their participant settings"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  USING (sender_id = auth.uid());

-- Calls policies
CREATE POLICY "Users can view their calls"
  ON calls FOR SELECT
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can update their calls"
  ON calls FOR UPDATE
  USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Typing indicators policies
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

-- User presence policies
CREATE POLICY "Anyone can view presence"
  ON user_presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON user_presence FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Blocked users policies
CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

CREATE POLICY "Users can block others"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- Reports policies
CREATE POLICY "Users can view their reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

-- Pinned messages policies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pinned_messages') THEN
        ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view pinned messages"
          ON pinned_messages FOR SELECT
          USING (
            conversation_id IN (
              SELECT conversation_id FROM conversation_participants
              WHERE user_id = auth.uid()
            )
          );
          
        CREATE POLICY "Users can pin messages"
          ON pinned_messages FOR INSERT
          WITH CHECK (pinned_by = auth.uid());
          
        CREATE POLICY "Users can unpin messages"
          ON pinned_messages FOR DELETE
          USING (pinned_by = auth.uid());
    END IF;
END $$;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 5: GRANTS                                                     ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON calls TO authenticated;
GRANT ALL ON typing_indicators TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- Grant on pinned_messages if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'pinned_messages') THEN
        EXECUTE 'GRANT ALL ON pinned_messages TO authenticated';
    END IF;
END $$;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 6: ENABLE REALTIME                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Enable realtime for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ SECTION 7: STORAGE BUCKETS                                            ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Create storage buckets (run separately if this fails)
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
    ('avatars', 'avatars', true, 5242880),
    ('posts', 'posts', true, 10485760),
    ('boltz', 'boltz', true, 52428800),
    ('flash', 'flash', true, 10485760),
    ('messages', 'messages', true, 10485760),
    ('message-media', 'message-media', true, 10485760)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ VERIFICATION                                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    table_count INT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'conversations', 'conversation_participants', 'messages', 
        'calls', 'typing_indicators', 'user_presence', 
        'blocked_users', 'reports', 'user_settings'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ FOCUS APP LAUNCH MIGRATION COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 Tables verified: %/9', table_count;
    RAISE NOTICE '🔒 RLS policies applied';
    RAISE NOTICE '⚡ Realtime enabled';
    RAISE NOTICE '📦 Storage buckets created';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your app is READY FOR LAUNCH!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
