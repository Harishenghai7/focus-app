-- Drop the specific trigger we created
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;

-- Try inserting a test message via SQL
INSERT INTO messages (sender_id, conversation_id, content, message_type)
VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
    'c27b67d7-5778-4ed0-b837-8276200bd8df',
    'Test message trigger dropped',
    'text'
);

-- Check if it worked
SELECT * FROM messages WHERE content = 'Test message trigger dropped';
