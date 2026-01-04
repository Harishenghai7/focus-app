-- DROP ALL POLICIES - Copy and Run This!
-- This will remove all policies blocking your queries

-- ============================================
-- DROP FLASH POLICIES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view flash" ON flash;
DROP POLICY IF EXISTS "Users can create their own flash" ON flash;
DROP POLICY IF EXISTS "Users can delete their own flash" ON flash;

-- ============================================
-- DROP PROFILES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "debug allow all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

-- ============================================
-- FORCE SCHEMA REFRESH
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFY ALL POLICIES ARE GONE
-- ============================================
SELECT tablename, policyname
FROM pg_policies 
WHERE tablename IN ('profiles', 'flash');

-- Should return NO ROWS! ✅

-- ============================================
-- TEST QUERIES
-- ============================================
-- Test 1: Can you read profiles?
SELECT id, username FROM profiles LIMIT 5;

-- Test 2: Can you read flash?
SELECT id, user_id FROM flash LIMIT 5;

-- Both should work now! ✅
