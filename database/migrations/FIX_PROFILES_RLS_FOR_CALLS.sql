-- Fix profiles table RLS to allow reading profiles during calls
-- This ensures that when a call comes in, the receiver can fetch the caller's profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Create a simple, permissive SELECT policy for all authenticated users
CREATE POLICY "Allow authenticated users to view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Ensure the table has RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Verify the policy was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Allow authenticated users to view all profiles'
    ) THEN
        RAISE NOTICE '✅ Profile SELECT policy created successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to create profile SELECT policy';
    END IF;
END $$;
