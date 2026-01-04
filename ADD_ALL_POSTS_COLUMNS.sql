-- ==============================================================================
-- ADD ALL MISSING COLUMNS TO POSTS TABLE
-- Run this script in your Supabase SQL Editor to resolve "column not found" errors.
-- ==============================================================================

-- Post Settings
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hide_likes BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_disabled BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS allow_remix BOOLEAN DEFAULT true;

-- Post Metadata
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audience VARCHAR(20) DEFAULT 'public';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Ensure media column is JSONB (it likely is, but good to check)
-- ALTER TABLE public.posts ALTER COLUMN media TYPE JSONB USING media::JSONB;
