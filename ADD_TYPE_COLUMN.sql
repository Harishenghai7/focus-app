-- ==============================================================================
-- ADD TYPE COLUMN TO POSTS TABLE
-- Run this script in your Supabase SQL Editor to resolve the "column not found" errors.
-- ==============================================================================

-- Add type column (e.g., 'image', 'video', 'carousel')
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'image';
