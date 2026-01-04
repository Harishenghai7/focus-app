-- ==============================================================================
-- ADD MISSING COLUMNS TO USER_SETTINGS
-- Run this script in your Supabase SQL Editor to resolve the "column not found" errors.
-- ==============================================================================

-- Add account_visibility column if it doesn't exist
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS account_visibility VARCHAR(20) DEFAULT 'public';

-- Add other potentially missing columns that might be used in Privacy settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS activity_status VARCHAR(20) DEFAULT 'online';

ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS story_sharing VARCHAR(20) DEFAULT 'everyone';

-- Refresh the schema cache is handled automatically by Supabase usually, 
-- but sometimes restarting the app is needed.
