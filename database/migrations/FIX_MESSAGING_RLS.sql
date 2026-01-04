-- ===================================
-- FIX RLS POLICIES FOR MESSAGING
-- Run this in Supabase SQL Editor
-- ===================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their participations" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- ===================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- ===================================

-- Allow users to view their own participations
CREATE POLICY "Users can view own participations"
ON conversation_participants FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert themselves as participants
CREATE POLICY "Users can add themselves"
ON conversation_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own participations (leave conversation)
CREATE POLICY "Users can leave"
ON conversation_participants FOR DELETE
USING (auth.uid() = user_id);

-- ===================================
-- CONVERSATIONS POLICIES
-- ===================================

-- Allow users to view conversations they're part of
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- Allow any authenticated user to create conversations
CREATE POLICY "Authenticated users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update conversations they're part of
CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- ===================================
-- MESSAGES POLICIES
-- ===================================

-- Allow users to view messages in their conversations
CREATE POLICY "Users can view their messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Allow users to send messages to conversations they're part of
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Allow users to update their own messages
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth.uid() = sender_id);

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  - View your conversation participations';
  RAISE NOTICE '  - Create conversations';
  RAISE NOTICE '  - Send and receive messages';
END $$;
