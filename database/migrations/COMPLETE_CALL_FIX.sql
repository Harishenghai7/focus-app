-- ============================================
-- COMPLETE FIX FOR CALL FUNCTIONALITY
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX PROFILES TABLE RLS
-- ============================================

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view all profiles" ON profiles;

-- Create a simple, permissive SELECT policy
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated, anon
USING (true);

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant SELECT permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

RAISE NOTICE '✅ Profiles table RLS fixed!';

-- ============================================
-- 2. FIX CALLS TABLE RLS
-- ============================================

-- Drop existing policies on calls
DROP POLICY IF EXISTS "Users can view their own calls" ON calls;
DROP POLICY IF EXISTS "Users can insert calls" ON calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON calls;

-- Allow users to view calls where they are caller or receiver
CREATE POLICY "calls_select_policy"
ON calls FOR SELECT
TO authenticated
USING (
    auth.uid() = caller_id OR 
    auth.uid() = receiver_id
);

-- Allow users to insert calls
CREATE POLICY "calls_insert_policy"
ON calls FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id);

-- Allow users to update calls where they are caller or receiver
CREATE POLICY "calls_update_policy"
ON calls FOR UPDATE
TO authenticated
USING (
    auth.uid() = caller_id OR 
    auth.uid() = receiver_id
);

-- Ensure RLS is enabled
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON calls TO authenticated;

RAISE NOTICE '✅ Calls table RLS fixed!';

-- ============================================
-- 3. VERIFY REALTIME IS ENABLED
-- ============================================

-- Enable realtime on calls table
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- Enable realtime on profiles table (for online status)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

RAISE NOTICE '✅ Realtime enabled for calls and profiles!';

-- ============================================
-- 4. VERIFY SETUP
-- ============================================

DO $$
DECLARE
    profile_policy_count INTEGER;
    calls_policy_count INTEGER;
BEGIN
    -- Check profiles policies
    SELECT COUNT(*) INTO profile_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    AND policyname = 'profiles_select_policy';
    
    -- Check calls policies
    SELECT COUNT(*) INTO calls_policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'calls';
    
    IF profile_policy_count > 0 THEN
        RAISE NOTICE '✅ Profiles SELECT policy exists';
    ELSE
        RAISE EXCEPTION '❌ Profiles SELECT policy missing!';
    END IF;
    
    IF calls_policy_count >= 3 THEN
        RAISE NOTICE '✅ Calls policies exist (%, policies found)', calls_policy_count;
    ELSE
        RAISE WARNING '⚠️ Only % calls policies found (expected 3)', calls_policy_count;
    END IF;
    
    RAISE NOTICE '🎉 Setup complete! Test your calls now.';
END $$;
