-- Fix: Robust trigger for conversation timestamp
-- This ensures last_message_at is updated without hanging

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp();

-- 2. Create the function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation timestamp
  -- We use a direct update to avoid any RLS issues
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If update fails, log it but don't fail the message insert
  RAISE WARNING 'Failed to update conversation timestamp: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the trigger
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- 4. Ensure RLS on conversations allows updates (just in case)
-- But SECURITY DEFINER should handle it.

RAISE NOTICE '✅ Robust trigger created!';
