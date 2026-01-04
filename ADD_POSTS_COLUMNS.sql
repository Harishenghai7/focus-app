-- ==============================================================================
-- ADD MISSING COLUMNS TO POSTS TABLE
-- Run this script in your Supabase SQL Editor to resolve the "column not found" errors.
-- ==============================================================================

-- Add audience column
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS audience VARCHAR(20) DEFAULT 'public';

-- Add scheduled_at column (implied by the "Schedule" button in your screenshot)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add status column if it doesn't exist (for Drafts)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';

-- Add location column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Add tags column if it doesn't exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS tags TEXT[];
