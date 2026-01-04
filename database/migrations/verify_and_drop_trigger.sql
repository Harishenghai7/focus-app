-- Check if trigger exists and drop it
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

-- Drop it explicitly
DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp();

-- Verify again
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'messages';
