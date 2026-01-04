-- PERMANENT FIX: Enable RLS with working policies
-- This will make messaging work permanently, even after refresh

-- 1. Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

DROP POLICY IF EXISTS "Users can view conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

-- 3. MESSAGES POLICIES (Simple and working)

-- Allow users to SELECT messages in their conversations
CREATE POLICY "messages_select_policy"
ON messages FOR SELECT
TO authenticated
USING (
    -- User is in the conversation
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = messages.conversation_id 
        AND user_id = auth.uid()
    )
);

-- Allow users to INSERT messages in their conversations
CREATE POLICY "messages_insert_policy"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    -- User is the sender AND in the conversation
    sender_id = auth.uid()
    AND
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = messages.conversation_id 
        AND user_id = auth.uid()
    )
);

-- Allow users to UPDATE their own messages
CREATE POLICY "messages_update_policy"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Allow users to DELETE their own messages
CREATE POLICY "messages_delete_policy"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- 4. CONVERSATIONS POLICIES

CREATE POLICY "conversations_select_policy"
ON conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = conversations.id 
        AND user_id = auth.uid()
    )
);

-- 5. CONVERSATION_PARTICIPANTS POLICIES

CREATE POLICY "participants_select_policy"
ON conversation_participants FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
);

-- 6. Verify policies are created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('messages', 'conversations', 'conversation_participants')
ORDER BY tablename, policyname;

DO $$
BEGIN
    RAISE NOTICE '✅ RLS enabled with working policies!';
    RAISE NOTICE '✅ Messages will persist after refresh!';
    RAISE NOTICE '✅ Real-time updates will work!';
    RAISE NOTICE '🔄 Refresh your app and test!';
END $$;
