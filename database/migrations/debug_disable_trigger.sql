-- Debug: Temporarily disable the trigger to test if it's causing the hang
-- Run this to test if the trigger is the problem

DROP TRIGGER IF EXISTS update_conversation_timestamp ON messages;

-- You can re-enable it later with:
-- CREATE TRIGGER update_conversation_timestamp
--   AFTER INSERT ON messages
--   FOR EACH ROW
--   EXECUTE FUNCTION update_conversation_last_message();
