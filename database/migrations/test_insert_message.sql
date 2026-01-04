-- Test: Insert a message directly via SQL to verify the table works
-- This will help us determine if the issue is the Supabase client or the database itself

INSERT INTO messages (sender_id, conversation_id, content, message_type, created_at)
VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',  -- Your user ID
    'c27b67d7-5778-4ed0-b837-8276200bd8df',  -- The conversation ID
    'Test message from SQL',
    'text',
    NOW()
);

-- Check if it was inserted
SELECT * FROM messages WHERE conversation_id = 'c27b67d7-5778-4ed0-b837-8276200bd8df' ORDER BY created_at DESC LIMIT 5;
