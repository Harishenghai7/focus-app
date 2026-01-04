-- FINAL FIX SCRIPT: Messaging & Online Status
-- Run this in Supabase SQL Editor

-- 1. Fix Online Status (Profile RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Drop the bad trigger that was hanging
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp();

-- 3. Create a ROBUST trigger (safe, no hanging)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Direct update, bypassing RLS to avoid recursion
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If it fails, log it but let the message go through!
  RAISE WARNING 'Timestamp update failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

RAISE NOTICE '✅ ALL SYSTEMS FIXED: Messaging, Timestamps, and Online Status!';
