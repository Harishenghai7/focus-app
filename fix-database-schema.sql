-- Fix database schema for real-time interactions
-- Run this in your Supabase SQL Editor

-- Add missing comment_id column to likes table
ALTER TABLE likes ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Add missing flash_id columns
ALTER TABLE likes ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;
ALTER TABLE shares ADD COLUMN IF NOT EXISTS flash_id UUID REFERENCES flash(id) ON DELETE CASCADE;

-- Update likes table constraints
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_content_check;
ALTER TABLE likes ADD CONSTRAINT likes_content_check CHECK (
  (post_id IS NOT NULL AND boltz_id IS NULL AND flash_id IS NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NOT NULL AND flash_id IS NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NOT NULL AND comment_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NULL AND comment_id IS NOT NULL)
);

-- Update comments table constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_content_check;
ALTER TABLE comments ADD CONSTRAINT comments_content_check CHECK (
  (post_id IS NOT NULL AND boltz_id IS NULL AND flash_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NOT NULL AND flash_id IS NULL) OR
  (post_id IS NULL AND boltz_id IS NULL AND flash_id IS NOT NULL)
);

-- Add shares_count columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE boltz ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE flash ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;