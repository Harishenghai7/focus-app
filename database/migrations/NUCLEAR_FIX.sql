-- NUCLEAR OPTION: Fix hanging message inserts
-- This will forcefully clear everything blocking message inserts

-- Step 1: Drop ALL triggers on messages table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'messages')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON messages CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Step 2: Drop ALL functions related to conversation timestamp
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;

-- Step 3: DISABLE RLS on messages table (temporarily for testing)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Step 4: Test insert with YOUR actual IDs
INSERT INTO messages (sender_id, conversation_id, content, message_type)
VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
    'c27b67d7-5778-4ed0-b837-8276200bd8df',
    'NUCLEAR TEST MESSAGE - If you see this, the database is working!',
    'text'
);

-- Step 5: Verify it worked
SELECT id, content, created_at, sender_id 
FROM messages 
WHERE content LIKE 'NUCLEAR TEST%'
ORDER BY created_at DESC 
LIMIT 1;

-- Step 6: Show status
DO $$
BEGIN
    RAISE NOTICE '✅ If you see the test message above, the database is WORKING!';
    RAISE NOTICE '⚠️  RLS is now DISABLED on messages table for testing';
    RAISE NOTICE '⚠️  ALL triggers are REMOVED';
    RAISE NOTICE '🔧 Try sending a message from the UI now';
END $$;
