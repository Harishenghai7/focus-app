-- TEST: Direct message insert to verify no blocking
-- This will tell us if the database is accepting inserts

-- First, let's see what triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

-- Try a direct insert (replace with your actual IDs)
-- INSERT INTO messages (sender_id, conversation_id, content, message_type)
-- VALUES (
--     '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
--     'c27b67d7-5778-4ed0-b837-8276200bd8df',
--     'Test direct insert',
--     'text'
-- );

-- Check if it worked
-- SELECT * FROM messages WHERE content = 'Test direct insert';
