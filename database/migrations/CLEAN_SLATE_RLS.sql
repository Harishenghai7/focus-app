-- CLEAN SLATE: Remove all existing policies and recreate fresh
-- Run this to fix the "policy already exists" error

-- Step 1: Re-enable RLS on messages (if not already)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (no errors if they don't exist)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'messages'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages';
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Step 3: Create fresh policies

-- SELECT: Users can see messages they sent OR in their conversations
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

-- INSERT: Users can insert if they're in the conversation
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

-- UPDATE: Users can only update their own messages
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- DELETE: Users can only delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Step 4: Verify
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'messages';

-- Step 5: Success
DO $$
BEGIN
    RAISE NOTICE '✅ All policies recreated fresh!';
    RAISE NOTICE '🚀 Refresh your app and try sending now!';
END $$;
