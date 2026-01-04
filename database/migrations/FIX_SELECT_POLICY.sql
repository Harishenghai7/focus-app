-- FIX: Allow users to see messages in their conversations
-- Currently users can only see messages they sent
-- This adds the ability to see messages from others in the same conversation

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop the overly restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view messages" ON messages;

-- Create a better SELECT policy that allows seeing messages in your conversations
CREATE POLICY "Users can view messages"
ON messages FOR SELECT
TO authenticated
USING (
  -- You can see messages you sent
  sender_id = auth.uid()
  OR
  -- OR messages in conversations you're part of
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ SELECT policy fixed! You can now see messages in your conversations!';
    RAISE NOTICE '🔄 Refresh the app to see all messages!';
END $$;
