-- =====================================================
-- FOLLOWERS/FOLLOWING FIX - RLS POLICIES
-- =====================================================
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. First, check if follows table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'follows'
);

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON follows;
DROP POLICY IF EXISTS "Enable read access for all users" ON follows;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON follows;
DROP POLICY IF EXISTS "Enable delete for users based on follower_id" ON follows;

-- 3. Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE, PERMISSIVE policies
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create follows"
ON follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- 5. Grant permissions
GRANT SELECT, INSERT, DELETE ON follows TO authenticated;
GRANT SELECT, INSERT, DELETE ON follows TO anon;

-- 6. Test query (replace with your user ID)
SELECT follower_id, created_at 
FROM follows 
WHERE following_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6'
ORDER BY created_at DESC
LIMIT 20;
