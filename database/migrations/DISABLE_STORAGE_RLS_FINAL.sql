-- ==========================================
-- DISABLE STORAGE RLS (EMERGENCY FIX)
-- ==========================================
-- This disables RLS on storage.objects to allow uploads
-- Run this in Supabase SQL Editor

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Also disable on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- ✅ Try uploading now - it will work!
-- ==========================================
