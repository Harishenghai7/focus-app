-- Enable Realtime for messages table
-- This allows real-time subscriptions to work

-- 1. Enable realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. Enable realtime on conversations table (for last_message_at updates)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- 3. Enable realtime on profiles table (for online status)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 4. Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'conversations', 'profiles');

DO $$
BEGIN
    RAISE NOTICE '✅ Realtime enabled for messages, conversations, and profiles!';
    RAISE NOTICE '🔄 Real-time updates will now work!';
    RAISE NOTICE '📱 Messages will appear instantly!';
END $$;
