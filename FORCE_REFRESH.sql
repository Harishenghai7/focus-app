-- FORCE SCHEMA REFRESH
-- RLS is disabled but queries still hanging
-- This forces Supabase to reload everything

-- Step 1: Reload schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 2: Verify tables are accessible
SELECT COUNT(*) as profile_count FROM profiles;
SELECT COUNT(*) as flash_count FROM flash;

-- Step 3: Test a simple query (what the app is trying to do)
SELECT id, username, full_name, avatar_url, verified 
FROM profiles 
LIMIT 5;

-- Step 4: Check if there are any active policies still
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'flash')
ORDER BY tablename, policyname;

-- If you see any policies listed above, they might still be blocking!
-- Drop them all:
-- DROP POLICY IF EXISTS "policy_name_here" ON profiles;
