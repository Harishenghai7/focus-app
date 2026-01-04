-- Enable Realtime for calls table so receiver gets notified

-- Add calls table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'calls';

DO $$
BEGIN
    RAISE NOTICE '✅ Realtime enabled for calls table!';
    RAISE NOTICE '📞 Incoming calls will now appear instantly!';
END $$;
