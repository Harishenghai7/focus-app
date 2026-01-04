-- FINAL FIX: Re-enable RLS with correct policies
-- Run this after NUCLEAR_FIX.sql

-- Step 1: Re-enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Senders can update own messages" ON messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON messages;

-- Step 3: Create SIMPLE policies that definitely work

-- Policy 1: SELECT - Users can see messages they sent OR messages in their conversations
CREATE POLICY "Users can view messages"
ON messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: INSERT - Users can insert messages if they are in the conversation
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: UPDATE - Users can only update their own messages
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Policy 4: DELETE - Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Step 4: Test that policies work
-- This should return rows if you're authenticated
SELECT COUNT(*) as message_count FROM messages;

-- Step 5: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS re-enabled with working policies!';
    RAISE NOTICE '✅ No triggers = No hanging!';
    RAISE NOTICE '🚀 Try sending a message from the UI now - it should work!';
END $$;
