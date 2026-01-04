-- Simplified RLS Fix for Messaging (v5 - Correct Order)
-- Run this to fix message sending hanging

-- 1. Drop ALL existing policies FIRST (they depend on the function)
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view their own participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- 2. Now drop the function
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID);

-- 3. Create a SECURITY DEFINER function to check participation (breaks RLS recursion)
CREATE OR REPLACE FUNCTION is_conversation_participant(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversation_uuid
        AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- 5. Messages policies
CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view messages"
ON messages FOR SELECT
TO authenticated
USING (is_conversation_participant(conversation_id, auth.uid()));

-- 6. Conversation participants policy
CREATE POLICY "Users can view their own participations"
ON conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_conversation_participant(conversation_id, auth.uid()));

-- 7. Conversations policies (SELECT and UPDATE)
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
TO authenticated
USING (is_conversation_participant(id, auth.uid()))
WITH CHECK (is_conversation_participant(id, auth.uid()));

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Messaging RLS policies created successfully!';
END $$;
