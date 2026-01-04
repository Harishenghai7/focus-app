-- ═══════════════════════════════════════════════════════════════════════
-- FIX PROFILES TABLE PERMISSIONS FOR MESSAGES
-- Run this in Supabase SQL Editor if you're getting permission errors
-- ═══════════════════════════════════════════════════════════════════════

-- Check if profiles table has RLS enabled
DO $$
BEGIN
  -- If RLS is enabled, add a policy to allow users to read all profiles
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    
    -- Create policy to allow authenticated users to read all profiles
    CREATE POLICY "Public profiles are viewable by everyone"
      ON profiles FOR SELECT
      TO authenticated
      USING (true);
    
    -- Grant SELECT permission to authenticated role
    GRANT SELECT ON profiles TO authenticated;
    
    RAISE NOTICE '✅ Profiles table permissions fixed!';
    RAISE NOTICE '   - Policy created: Public profiles viewable';
    RAISE NOTICE '   - SELECT granted to authenticated users';
  ELSE
    RAISE NOTICE '⚠️  Profiles table does not exist!';
    RAISE NOTICE '   Please create the profiles table first.';
  END IF;
END $$;
