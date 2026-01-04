-- ==============================================================================
-- ADD MEDIA COLUMN TO POSTS TABLE
-- Run this script in your Supabase SQL Editor to resolve the "column not found" errors.
-- ==============================================================================

-- Add media column as JSONB (for storing array of media objects with metadata)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- If you previously had media_urls (text array), you might want to keep it for backward compatibility
-- or migrate data. This script assumes we are moving forward with the 'media' JSONB column.
