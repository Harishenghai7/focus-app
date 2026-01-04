-- ═══════════════════════════════════════════════════════════════════════
-- FIX PROFILES RLS FOR NEW MESSAGE SEARCH
-- Ensures authenticated users can search and view all profiles
-- ═══════════════════════════════════════════════════════════════════════

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create a comprehensive SELECT policy for authenticated users
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Ensure users can insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed profiles RLS for search functionality';
  RAISE NOTICE '   - All authenticated users can view all profiles';
  RAISE NOTICE '   - Users can update their own profile';
  RAISE NOTICE '   - Proper permissions granted';
END $$;
