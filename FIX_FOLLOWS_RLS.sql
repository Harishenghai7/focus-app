-- ==============================================================================
-- FIX RLS POLICIES FOR FOLLOWS TABLE
-- Run this script in your Supabase SQL Editor to resolve "permission denied" errors.
-- ==============================================================================

-- 1. Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Anyone can read follows" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
DROP POLICY IF EXISTS "Users can update follow status" ON public.follows;

-- 3. Create new policies

-- Allow anyone (authenticated or anon) to read follows (needed for profile stats, etc.)
CREATE POLICY "Anyone can read follows"
ON public.follows FOR SELECT
USING (true);

-- Allow authenticated users to create a follow record (follower_id must be their own)
CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Allow users to unfollow (delete their own follow record)
CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- Allow users to update follow status (e.g., accepting a request)
-- This allows the 'following' user to update the status (e.g. accept pending)
-- AND the 'follower' to update (though less common)
CREATE POLICY "Users can update follow status"
ON public.follows FOR UPDATE
USING (auth.uid() = following_id OR auth.uid() = follower_id);

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT SELECT ON public.follows TO anon;
