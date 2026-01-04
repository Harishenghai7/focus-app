-- Focus App Settings System - Supabase Migration
-- Run this script in your Supabase SQL Editor to set up all required tables

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Appearance Settings
  theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'auto')),
  font_size VARCHAR(10) DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  glassmorphism_enabled BOOLEAN DEFAULT true,
  high_contrast_mode BOOLEAN DEFAULT false,
  
  -- Privacy Settings
  account_visibility VARCHAR(10) DEFAULT 'public' CHECK (account_visibility IN ('public', 'private')),
  two_factor_enabled BOOLEAN DEFAULT false,
  show_activity_status BOOLEAN DEFAULT true,
  who_can_view_profile VARCHAR(20) DEFAULT 'everyone' CHECK (who_can_view_profile IN ('everyone', 'followers', 'nobody')),
  who_can_view_posts VARCHAR(20) DEFAULT 'everyone' CHECK (who_can_view_posts IN ('everyone', 'followers', 'nobody')),
  who_can_view_stories VARCHAR(20) DEFAULT 'everyone' CHECK (who_can_view_stories IN ('everyone', 'followers', 'nobody')),
  who_can_view_boltz VARCHAR(20) DEFAULT 'everyone' CHECK (who_can_view_boltz IN ('everyone', 'followers', 'nobody')),
  
  -- Notification Settings
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  notify_likes BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  notify_followers BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  notify_boltz BOOLEAN DEFAULT true,
  notify_flash BOOLEAN DEFAULT true,
  notification_sound VARCHAR(50) DEFAULT 'default',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- ============================================
-- BLOCKED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

-- ============================================
-- LINKED ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS linked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'github', 'discord')),
  provider_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider)
);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info JSONB,
  ip_address INET,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  mood INTEGER CHECK (mood >= 0 AND mood <= 4),
  message TEXT NOT NULL,
  screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user_id ON linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- USER SETTINGS POLICIES
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- BLOCKED USERS POLICIES
CREATE POLICY "Users can view their blocked users"
  ON blocked_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can block other users"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- LINKED ACCOUNTS POLICIES
CREATE POLICY "Users can view their linked accounts"
  ON linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can link accounts"
  ON linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlink accounts"
  ON linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- USER SESSIONS POLICIES
CREATE POLICY "Users can view their sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- FEEDBACK POLICIES
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Note: Run this in the Supabase Storage section, not SQL Editor
-- 
-- Bucket name: feedback-screenshots
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/*

-- Storage Policy (run after creating bucket):
-- CREATE POLICY "Users can upload feedback screenshots"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'feedback-screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "Users can view their feedback screenshots"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'feedback-screenshots' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
