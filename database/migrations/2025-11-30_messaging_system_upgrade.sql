-- ===================================
-- MESSAGING SYSTEM - ENSURE COLUMNS EXIST
-- This script safely adds any missing columns to existing tables
-- ===================================

-- Ensure messages table has all required columns
DO $$ 
BEGIN
  -- Add conversation_id if it doesn't exist (it should already exist based on schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
  END IF;

  -- Add media_url if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE messages ADD COLUMN media_url TEXT;
  END IF;

  -- Add media_type if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE messages ADD COLUMN media_type VARCHAR(20);
  END IF;

  -- Add type if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'type'
  ) THEN
    ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text';
  END IF;

  -- Add reply_to_message_id if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'reply_to_message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure conversations table has all required columns
DO $$ 
BEGIN
  -- Add is_group if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'is_group'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_group BOOLEAN DEFAULT false;
  END IF;

  -- Add group_name if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE conversations ADD COLUMN group_name VARCHAR(100);
  END IF;

  -- Add created_by if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE conversations ADD COLUMN created_by UUID REFERENCES profiles(id);
  END IF;

  -- Add last_message_at if it doesn't exist (it should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Create or replace function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating last_message_at (drop first if exists)
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Messaging system columns verified and indexes created!';
END $$;
