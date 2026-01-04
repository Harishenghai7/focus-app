-- ==============================================================================
-- FIX RLS POLICIES FOR USER_SETTINGS TABLE
-- Run this script in your Supabase SQL Editor to resolve the "permission denied" errors.
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on the user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;

-- 3. Create permissive policies for User Settings

-- Allow users to view their own settings
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to insert their own settings (in case the trigger didn't catch it)
CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Grant necessary permissions to roles
GRANT SELECT, INSERT, UPDATE ON user_settings TO authenticated;
GRANT SELECT ON user_settings TO anon;

-- 5. Ensure the table exists and has the correct structure (Idempotent check)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notify_likes BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  notify_follows BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  nsfw_filter_enabled BOOLEAN DEFAULT true,
  violence_filter_enabled BOOLEAN DEFAULT true,
  profanity_filter_enabled BOOLEAN DEFAULT false,
  sensitivity_level VARCHAR(20) DEFAULT 'medium',
  show_online_status BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  glassmorphism_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
