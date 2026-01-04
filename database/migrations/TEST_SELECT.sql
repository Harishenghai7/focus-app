-- TEST: Check if you can see messages you sent
-- Run this while logged in as the sender

-- 1. Check your user ID
SELECT auth.uid() as my_user_id;

-- 2. Check if you're a participant in the conversation
SELECT * 
FROM conversation_participants 
WHERE user_id = auth.uid()
AND conversation_id = 'c27b67d7-5778-4ed0-b837-8276200bd8df';

-- 3. Try to select messages (this should work if RLS is correct)
SELECT id, content, sender_id, conversation_id, created_at
FROM messages 
WHERE conversation_id = 'c27b67d7-5778-4ed0-b837-8276200bd8df'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check what policies exist
SELECT * FROM pg_policies WHERE tablename = 'messages';
