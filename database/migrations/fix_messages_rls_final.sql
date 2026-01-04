-- FIX: Ensure senders can ALWAYS see their own messages
-- This fixes the "Visible to receiver but not sender" issue

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Senders can view their own messages" ON messages;

-- 2. Policy: View Messages
-- Allow if user is the sender OR a participant in the conversation
CREATE POLICY "Users can view messages"
ON messages FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id 
  OR 
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- 3. Policy: Insert Messages
-- Allow if user is a participant in the conversation
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND
  EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = messages.conversation_id 
    AND user_id = auth.uid()
  )
);

-- 4. Policy: Update/Delete (Sender only)
CREATE POLICY "Senders can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

RAISE NOTICE '✅ Messages RLS fixed: Senders can now definitely see their messages!';
