-- ==============================================================================
-- FIX MEDIA_URLS CONSTRAINT
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- Make media_urls nullable since we are now using the 'media' JSONB column
ALTER TABLE public.posts ALTER COLUMN media_urls DROP NOT NULL;
