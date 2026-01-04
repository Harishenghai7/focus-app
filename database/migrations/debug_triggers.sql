-- List all triggers on messages table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'messages';

-- Temporarily disable ALL triggers on messages table
ALTER TABLE messages DISABLE TRIGGER ALL;

-- Try inserting a test message via SQL to see if it works without triggers
INSERT INTO messages (sender_id, conversation_id, content, message_type)
VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
    'c27b67d7-5778-4ed0-b837-8276200bd8df',
    'Test message triggers disabled',
    'text'
);

-- Check if it worked
SELECT * FROM messages WHERE content = 'Test message triggers disabled';
