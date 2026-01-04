-- Fix: Add missing last_message_at column and fix the trigger
-- This is why messages weren't sending!

-- 1. Drop the trigger first
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;

-- 2. Add the missing column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add updated_at column if it doesn't exist (standard practice)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Recreate the trigger function (fixed)
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate the trigger
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Success!
DO $$
BEGIN
    RAISE NOTICE '✅ Fixed conversations table and trigger!';
END $$;
