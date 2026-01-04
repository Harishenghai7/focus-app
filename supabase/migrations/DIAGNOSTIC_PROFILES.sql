-- ═══════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC: Check if profiles exist and RLS is working
-- Run this in Supabase SQL Editor to diagnose the "No User Found" issue
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Check if profiles table exists and has data
SELECT 
    'Total profiles in database:' as check_type,
    COUNT(*) as count
FROM profiles;

-- 2. Check sample profiles
SELECT 
    id,
    username,
    full_name,
    avatar_url,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check RLS status on profiles
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 4. Check existing policies on profiles
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
WHERE tablename = 'profiles';

-- 5. Test if authenticated users can SELECT from profiles
-- This simulates what the app does
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'DIAGNOSTIC RESULTS:';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'Total profiles accessible: %', profile_count;
    
    IF profile_count = 0 THEN
        RAISE NOTICE '❌ NO PROFILES FOUND!';
        RAISE NOTICE '   Possible causes:';
        RAISE NOTICE '   1. No users have signed up yet';
        RAISE NOTICE '   2. RLS policies are blocking access';
        RAISE NOTICE '   3. Profiles table is empty';
    ELSE
        RAISE NOTICE '✅ Profiles exist and are accessible';
    END IF;
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
