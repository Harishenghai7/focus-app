-- ============================================================
-- EMERGENCY FIX: Add Missing Columns to user_settings Table
-- Launch Day Critical - May 8th 2026
-- ============================================================

-- Add missing notification columns
ALTER TABLE user_settings 
    ADD COLUMN IF NOT EXISTS notify_boltz BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notify_flash BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS content_filter_level VARCHAR(20) DEFAULT 'balanced',
    ADD COLUMN IF NOT EXISTS biometric_lock_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure all notification columns exist with proper defaults
DO $$
BEGIN
    -- Check and add any missing notification columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'notify_boltz') THEN
        ALTER TABLE user_settings ADD COLUMN notify_boltz BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'notify_flash') THEN
        ALTER TABLE user_settings ADD COLUMN notify_flash BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'content_filter_level') THEN
        ALTER TABLE user_settings ADD COLUMN content_filter_level VARCHAR(20) DEFAULT 'balanced';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'biometric_lock_enabled') THEN
        ALTER TABLE user_settings ADD COLUMN biometric_lock_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_settings' AND column_name = 'compact_mode') THEN
        ALTER TABLE user_settings ADD COLUMN compact_mode BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update existing rows to have default values for new columns
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Verify the fix
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;
