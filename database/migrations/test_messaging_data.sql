-- Test query to check if data is being returned correctly
-- Run this in Supabase SQL Editor to see what data exists

-- 1. Check your user profile
SELECT id, username, full_name, avatar_url, last_seen, is_online 
FROM profiles 
WHERE id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6';  -- Your user ID

-- 2. Check conversations you're part of
SELECT 
    c.id as conversation_id,
    c.created_at,
    c.is_group,
    cp.user_id as participant_id
FROM conversations c
JOIN conversation_participants cp ON cp.conversation_id = c.id
WHERE c.id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6'
);

-- 3. Check all participants in your conversations
SELECT 
    cp.conversation_id,
    cp.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.last_seen
FROM conversation_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6'
);

-- 4. Check messages
SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.username as sender_username
FROM messages m
JOIN profiles p ON p.id = m.sender_id
WHERE m.conversation_id IN (
    SELECT conversation_id FROM conversation_participants 
    WHERE user_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6'
)
ORDER BY m.created_at DESC
LIMIT 20;
