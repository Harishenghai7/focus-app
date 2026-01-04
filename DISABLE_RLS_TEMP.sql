-- CRITICAL FIX: Disable RLS temporarily to test if that's the issue
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('posts', 'boltz');

-- Temporarily disable RLS on posts (FOR TESTING ONLY)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS on boltz (FOR TESTING ONLY)
ALTER TABLE boltz DISABLE ROW LEVEL SECURITY;

-- After testing, you can re-enable with:
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
