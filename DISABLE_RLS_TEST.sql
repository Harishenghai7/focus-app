-- =====================================================
-- CRITICAL FIX FOR FOLLOWERS/FOLLOWING
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- 1. DISABLE RLS temporarily to test
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions
GRANT ALL ON follows TO authenticated;
GRANT ALL ON follows TO anon;

-- 3. Test if this fixes the issue
-- If it works, then we know it's an RLS problem
-- Then we can re-enable RLS with proper policies

-- =====================================================
-- After testing, if it works, run this to re-enable RLS:
-- =====================================================

-- ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow all reads" ON follows;
-- DROP POLICY IF EXISTS "Allow authenticated inserts" ON follows;
-- DROP POLICY IF EXISTS "Allow users to delete own follows" ON follows;

-- CREATE POLICY "Allow all reads"
-- ON follows FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "Allow authenticated inserts"
-- ON follows FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = follower_id);

-- CREATE POLICY "Allow users to delete own follows"
-- ON follows FOR DELETE
-- TO authenticated
-- USING (auth.uid() = follower_id);
