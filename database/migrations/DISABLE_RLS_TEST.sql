-- TEMPORARY: Disable RLS to test if that's the issue
-- This will allow ALL authenticated users to see ALL messages
-- We'll fix it properly after confirming this works

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '⚠️  RLS DISABLED for testing!';
    RAISE NOTICE '🔄 Refresh app and try sending - messages should appear!';
    RAISE NOTICE '⚠️  Remember to re-enable RLS after testing!';
END $$;
