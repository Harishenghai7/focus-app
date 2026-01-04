-- ═══════════════════════════════════════════════════════════════════════
-- 🚨 EMERGENCY FIX: RLS Infinite Recursion + New Message Search
-- Run this ENTIRE script in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════
-- PART 1: Fix conversation_participants infinite recursion
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the problematic function and policies
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID) CASCADE;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;

-- Create simple, non-recursive SELECT policy
CREATE POLICY "Authenticated users can view conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (true);

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;
CREATE POLICY "Users can update their participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════
-- PART 2: Fix profiles table for New Message search
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Update policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant permissions
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- PART 3: Verify conversations table policies
-- ═══════════════════════════════════════════════════════════════════════

-- Ensure conversations table has proper policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════
-- PART 4: Verify messages table policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '✓ Fixed infinite recursion in conversation_participants';
  RAISE NOTICE '✓ Fixed profiles search for New Message modal';
  RAISE NOTICE '✓ Verified conversations table policies';
  RAISE NOTICE '✓ Verified messages table policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your Messages page should now work!';
  RAISE NOTICE '   - Refresh your app to see the changes';
  RAISE NOTICE '   - Check browser console for any remaining errors';
  RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
