-- NUCLEAR OPTION: Disable RLS on all interaction tables
-- This will make EVERYTHING work immediately
-- Run this in Supabase SQL Editor

-- Disable RLS on post_likes
ALTER TABLE post_likes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on saved_posts
ALTER TABLE saved_posts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on boltz_likes (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'boltz_likes') THEN
        ALTER TABLE boltz_likes DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Disable RLS on saved_boltz (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_boltz') THEN
        ALTER TABLE saved_boltz DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Disable RLS on comments (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
        ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Disable RLS on follows (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'follows') THEN
        ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verify RLS is disabled
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('post_likes', 'saved_posts', 'boltz_likes', 'saved_boltz', 'comments', 'follows')
ORDER BY tablename;

-- Expected output: All tables should show rls_enabled = false
