-- ===================================
-- FIX MESSAGING SYSTEM - NO RECURSION APPROACH
-- Properly ordered: drop policies first, then function
-- ===================================

-- 1. Drop all existing policies first (they depend on the old function)
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can create conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 2. Now drop the old function
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID);

-- 3. Create new function with correct parameter names
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_participants.conversation_id = conv_id 
        AND conversation_participants.user_id = check_user_id
    );
END;
$$;

-- 4. Fix profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 5. Fix conversation_participants with function approach
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all participants in their conversations"
    ON conversation_participants FOR SELECT
    USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can create conversation participants"
    ON conversation_participants FOR INSERT
    WITH CHECK (true);

-- 6. Fix conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (is_conversation_participant(id, auth.uid()));

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE
    USING (is_conversation_participant(id, auth.uid()));

-- 7. Fix messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        is_conversation_participant(conversation_id, auth.uid())
    );

CREATE POLICY "Users can update own messages"
    ON messages FOR UPDATE
    USING (sender_id = auth.uid())
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages"
    ON messages FOR DELETE
    USING (sender_id = auth.uid());

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON profiles TO authenticated, anon;
GRANT ALL ON conversations TO authenticated, anon;
GRANT ALL ON conversation_participants TO authenticated, anon;
GRANT ALL ON messages TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_conversation_participant TO authenticated, anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Messaging RLS completely fixed - all policies recreated!';
END $$;
