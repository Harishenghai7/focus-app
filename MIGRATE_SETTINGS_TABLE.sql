-- ============================================================
-- LAUNCH DAY CRITICAL: Complete user_settings Table Migration
-- Run this in Supabase SQL Editor immediately
-- ============================================================

-- Step 1: Ensure the table exists
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    font_size VARCHAR(20) DEFAULT 'medium',
    glassmorphism_enabled BOOLEAN DEFAULT true,
    high_contrast_mode BOOLEAN DEFAULT false,
    account_visibility VARCHAR(20) DEFAULT 'public',
    two_factor_enabled BOOLEAN DEFAULT false,
    show_activity_status BOOLEAN DEFAULT true,
    who_can_view_profile VARCHAR(20) DEFAULT 'everyone',
    who_can_view_posts VARCHAR(20) DEFAULT 'everyone',
    who_can_view_stories VARCHAR(20) DEFAULT 'everyone',
    who_can_view_boltz VARCHAR(20) DEFAULT 'everyone',
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
    content_filter_level VARCHAR(20) DEFAULT 'balanced',
    biometric_lock_enabled BOOLEAN DEFAULT false,
    compact_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add missing columns one by one (safe if they already exist)
DO $$
BEGIN
    -- Add notify_boltz if missing
    BEGIN
        ALTER TABLE user_settings ADD COLUMN notify_boltz BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'Column notify_boltz already exists';
    END;
    
    -- Add notify_flash if missing
    BEGIN
        ALTER TABLE user_settings ADD COLUMN notify_flash BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'Column notify_flash already exists';
    END;
    
    -- Add content_filter_level if missing
    BEGIN
        ALTER TABLE user_settings ADD COLUMN content_filter_level VARCHAR(20) DEFAULT 'balanced';
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'Column content_filter_level already exists';
    END;
    
    -- Add biometric_lock_enabled if missing
    BEGIN
        ALTER TABLE user_settings ADD COLUMN biometric_lock_enabled BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'Column biometric_lock_enabled already exists';
    END;
    
    -- Add compact_mode if missing
    BEGIN
        ALTER TABLE user_settings ADD COLUMN compact_mode BOOLEAN DEFAULT false;
    EXCEPTION WHEN duplicate_column THEN
        RAISE NOTICE 'Column compact_mode already exists';
    END;
END $$;

-- Step 3: Create RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Create policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Step 5: Update existing rows with null values
UPDATE user_settings 
SET 
    notify_boltz = COALESCE(notify_boltz, true),
    notify_flash = COALESCE(notify_flash, true),
    content_filter_level = COALESCE(content_filter_level, 'balanced'),
    biometric_lock_enabled = COALESCE(biometric_lock_enabled, false),
    compact_mode = COALESCE(compact_mode, false),
    updated_at = COALESCE(updated_at, NOW())
WHERE 
    notify_boltz IS NULL 
    OR notify_flash IS NULL 
    OR content_filter_level IS NULL
    OR biometric_lock_enabled IS NULL
    OR compact_mode IS NULL;

-- Step 6: Create function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Create trigger
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify the table structure
SELECT 
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;
