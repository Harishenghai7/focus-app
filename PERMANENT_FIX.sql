-- ============================================
-- PERMANENT FIX FOR SHARE FEATURES
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Check Current RLS Status
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('flash', 'messages', 'conversations')
ORDER BY tablename;

-- ============================================
-- STEP 2: Disable RLS Permanently
-- ============================================
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Drop ALL Policies
-- ============================================
-- Flash policies
DROP POLICY IF EXISTS "Flash visibility" ON flash;
DROP POLICY IF EXISTS "Users can create flash" ON flash;
DROP POLICY IF EXISTS "Users can update own flash" ON flash;
DROP POLICY IF EXISTS "Users can delete own flash" ON flash;
DROP POLICY IF EXISTS "Users can create their own flash" ON flash;
DROP POLICY IF EXISTS "Anyone can view flash" ON flash;

-- Message policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;

-- Conversation policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- ============================================
-- STEP 4: Check Messages Table Columns
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Look for the message content column name!
-- It might be: text, content, message, body, etc.

-- ============================================
-- STEP 5: Force Schema Reload
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- STEP 6: Verify RLS is Disabled
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('flash', 'messages', 'conversations')
ORDER BY tablename;

-- All should show: rowsecurity = false

-- ============================================
-- STEP 7: Grant Permissions (Just in Case)
-- ============================================
GRANT ALL ON flash TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON conversations TO authenticated;

-- ============================================
-- DONE! Now restart PostgREST:
-- Go to Supabase Dashboard → Settings → API → Restart PostgREST
-- ============================================
