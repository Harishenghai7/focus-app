-- ============================================================
-- EMERGENCY FIX - LAUNCH DAY: Add ALL Missing Columns
-- Run this in Supabase SQL Editor NOW
-- ============================================================

-- Add ALL missing columns in a single transaction
DO $$
BEGIN
    -- quiet_hours columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'quiet_hours_enabled') THEN
        ALTER TABLE user_settings ADD COLUMN quiet_hours_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'quiet_hours_start') THEN
        ALTER TABLE user_settings ADD COLUMN quiet_hours_start TIME;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'quiet_hours_end') THEN
        ALTER TABLE user_settings ADD COLUMN quiet_hours_end TIME;
    END IF;
    
    -- notification columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'notify_boltz') THEN
        ALTER TABLE user_settings ADD COLUMN notify_boltz BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'notify_flash') THEN
        ALTER TABLE user_settings ADD COLUMN notify_flash BOOLEAN DEFAULT true;
    END IF;
    
    -- content filter
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'content_filter_level') THEN
        ALTER TABLE user_settings ADD COLUMN content_filter_level VARCHAR(20) DEFAULT 'balanced';
    END IF;
    
    -- biometric
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'biometric_lock_enabled') THEN
        ALTER TABLE user_settings ADD COLUMN biometric_lock_enabled BOOLEAN DEFAULT false;
    END IF;
    
    -- compact mode
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'compact_mode') THEN
        ALTER TABLE user_settings ADD COLUMN compact_mode BOOLEAN DEFAULT false;
    END IF;
    
    -- notification sound
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'notification_sound') THEN
        ALTER TABLE user_settings ADD COLUMN notification_sound VARCHAR(50) DEFAULT 'default';
    END IF;
    
    -- glassmorphism
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'glassmorphism_enabled') THEN
        ALTER TABLE user_settings ADD COLUMN glassmorphism_enabled BOOLEAN DEFAULT true;
    END IF;
    
    -- high contrast
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'high_contrast_mode') THEN
        ALTER TABLE user_settings ADD COLUMN high_contrast_mode BOOLEAN DEFAULT false;
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'updated_at') THEN
        ALTER TABLE user_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify all columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;
