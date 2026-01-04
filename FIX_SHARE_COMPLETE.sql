-- COMPLETE FIX FOR SHARE MODAL
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Refresh Schema Cache
-- ============================================
-- This fixes the "media_path column not found" error

-- Notify Supabase to reload the schema
NOTIFY pgrst, 'reload schema';

-- Alternative: Check if flash table exists and has correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'flash' 
ORDER BY ordinal_position;


-- ============================================
-- FIX 2: Temporarily Disable RLS (For Testing)
-- ============================================
-- This fixes both "Send via Message" and "Share to Flash" hanging

-- Disable RLS on profiles (fixes user loading)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on flash (fixes flash creation)
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other related tables
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;


-- ============================================
-- FIX 3: Verify Tables Exist
-- ============================================

-- Check flash table structure
SELECT * FROM flash LIMIT 1;

-- Check profiles table
SELECT id, username FROM profiles LIMIT 5;


-- ============================================
-- AFTER TESTING: Re-enable RLS with Correct Policies
-- ============================================
-- Once everything works, run these to re-enable security:

/*
-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add correct policies
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can create flash" 
ON flash FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Flash visibility" 
ON flash FOR SELECT 
USING (
  expires_at > NOW() AND is_archived = false AND (
    visibility = 'public' OR 
    user_id = auth.uid() OR 
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows 
      WHERE follower_id = auth.uid() AND following_id = flash.user_id
    ))
  )
);

CREATE POLICY "Users can view own conversations" 
ON conversations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.conversation_id = conversations.id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversations" 
ON conversations FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can join conversations" 
ON chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participants can view conversation members" 
ON chat_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.conversation_id = chat_participants.conversation_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages" 
ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Participants can view messages" 
ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.conversation_id = messages.conversation_id 
    AND chat_participants.user_id = auth.uid()
  )
);
*/
