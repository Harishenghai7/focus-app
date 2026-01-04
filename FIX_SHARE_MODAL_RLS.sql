-- FIX SHARE MODAL ISSUES
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Enable Profiles to be Publicly Readable
-- ============================================
-- This fixes "Send via Message" hanging forever

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policy that allows everyone to read profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Verify it worked
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone';


-- ============================================
-- FIX 2: Enable Flash Creation
-- ============================================
-- This fixes "Share to Flash" not completing

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create flash" ON flash;
DROP POLICY IF EXISTS "Flash visibility" ON flash;

-- Allow users to create their own flash
CREATE POLICY "Users can create flash" 
ON flash FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view flash
CREATE POLICY "Flash visibility" 
ON flash FOR SELECT 
USING (
  expires_at > NOW() AND is_archived = false AND (
    visibility = 'public' OR 
    user_id = auth.uid() OR 
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = flash.user_id
    ))
  )
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'flash';


-- ============================================
-- FIX 3: Test Queries
-- ============================================

-- Test 1: Can you read profiles?
SELECT id, username, full_name FROM profiles LIMIT 5;

-- Test 2: Can you insert flash?
-- (This will fail if you run it directly, but shows the structure)
-- INSERT INTO flash (user_id, media_path, media_type, expires_at)
-- VALUES (auth.uid(), 'test.jpg', 'image', NOW() + INTERVAL '24 hours');


-- ============================================
-- OPTIONAL: If still having issues, temporarily disable RLS
-- ============================================
-- WARNING: Only use for testing! Re-enable after fixing!

-- Disable RLS on profiles (TEMPORARY - for testing only!)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on flash (TEMPORARY - for testing only!)
-- ALTER TABLE flash DISABLE ROW LEVEL SECURITY;

-- To re-enable later:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
