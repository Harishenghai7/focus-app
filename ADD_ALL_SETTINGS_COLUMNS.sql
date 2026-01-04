-- ==============================================================================
-- ADD ALL MISSING COLUMNS TO USER_SETTINGS
-- Run this script in your Supabase SQL Editor to resolve "column not found" errors.
-- ==============================================================================

-- Appearance
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS font_size VARCHAR(20) DEFAULT 'medium';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS high_contrast_mode BOOLEAN DEFAULT false;

-- Privacy & Security
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS show_activity_status BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS who_can_view_profile VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS who_can_view_posts VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS who_can_view_stories VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS who_can_view_boltz VARCHAR(20) DEFAULT 'everyone';

-- Notifications
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_followers BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_boltz BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notify_flash BOOLEAN DEFAULT true;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS notification_sound VARCHAR(50) DEFAULT 'default';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS quiet_hours_start TIME;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS quiet_hours_end TIME;

-- Ensure RLS is enabled and policies are correct (just in case)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
