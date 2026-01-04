-- Check current RLS policies and fix any issues

-- 1. Show all current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('messages', 'conversations', 'conversation_participants')
ORDER BY tablename, policyname;

-- 2. Temporarily disable RLS on messages to test
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '⚠️  RLS DISABLED on messages for testing';
    RAISE NOTICE '🔄 Refresh app - messages should appear now';
    RAISE NOTICE '📝 If messages appear, the issue is with the SELECT policy';
END $$;
