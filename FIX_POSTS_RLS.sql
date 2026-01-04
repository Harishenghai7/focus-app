-- Fix RLS policies for posts table to allow updates
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'posts';

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "update_own_posts" ON posts;

-- Create a proper update policy
CREATE POLICY "Users can update own posts"
ON posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure the select policy exists (needed for .select() to work)
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "select_posts" ON posts;

CREATE POLICY "Posts are viewable by everyone"
ON posts
FOR SELECT
USING (true);

-- Verify the policies
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
WHERE tablename = 'posts'
ORDER BY cmd, policyname;
