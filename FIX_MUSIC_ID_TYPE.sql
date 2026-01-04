-- ==============================================================================
-- FIX MUSIC_ID COLUMN TYPE
-- Run this script in your Supabase SQL Editor to resolve the "invalid input syntax for type uuid" error.
-- ==============================================================================

-- Change music_id from UUID to TEXT in all content tables
-- This allows storing external IDs (like Jamendo IDs) or internal UUIDs

-- 1. Posts Table
ALTER TABLE public.posts ALTER COLUMN music_id TYPE TEXT USING music_id::TEXT;

-- 2. Boltz Table
ALTER TABLE public.boltz ALTER COLUMN music_id TYPE TEXT USING music_id::TEXT;

-- 3. Flash Table
ALTER TABLE public.flash ALTER COLUMN music_id TYPE TEXT USING music_id::TEXT;

-- 4. Drafts Table
ALTER TABLE public.drafts ALTER COLUMN music_id TYPE TEXT USING music_id::TEXT;
