-- VERIFY RLS STATUS
-- Run this to check if RLS is disabled

-- Check RLS status for all tables
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '❌ ENABLED (BLOCKING)'
        WHEN rowsecurity = false THEN '✅ DISABLED (WORKING)'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'flash', 'conversations', 'messages')
ORDER BY tablename;

-- Expected output:
-- profiles      | ✅ DISABLED (WORKING)
-- flash         | ✅ DISABLED (WORKING)
-- conversations | ✅ DISABLED (WORKING)
-- messages      | ✅ DISABLED (WORKING)

-- If you see ❌ ENABLED, run this:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE flash DISABLE ROW LEVEL SECURITY;
