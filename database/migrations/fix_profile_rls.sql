-- Fix: Allow users to update their own online status
-- This fixes the "Header shows wrong timings" issue

-- 1. Enable RLS on profiles (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing update policy if any
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Profiles RLS updated to allow online status updates!';
END $$;
