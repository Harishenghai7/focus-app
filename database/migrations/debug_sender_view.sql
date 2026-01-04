-- DEBUG: Check if sender can see their own messages
-- Run this while logged in as the SENDER

-- Check 1: Can you see ANY messages?
SELECT COUNT(*) as total_messages_i_can_see FROM messages;

-- Check 2: Can you see messages YOU sent?
SELECT COUNT(*) as messages_i_sent 
FROM messages 
WHERE sender_id = auth.uid();

-- Check 3: Show the actual messages you sent (last 5)
SELECT id, content, created_at, sender_id, conversation_id
FROM messages 
WHERE sender_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- Check 4: What is your user ID?
SELECT auth.uid() as my_user_id;

-- Check 5: Are you a participant in the conversation?
SELECT * 
FROM conversation_participants 
WHERE user_id = auth.uid()
AND conversation_id = 'c27b67d7-5778-4ed0-b837-8276200bd8df';
