-- ============================================
-- User Settings Schema
-- ============================================

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
CREATE TRIGGER update_user_settings_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp();

-- Helper function to get or create settings
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
    v_settings jsonb;
BEGIN
    SELECT settings INTO v_settings
    FROM user_settings
    WHERE user_id = p_user_id;
    
    IF v_settings IS NULL THEN
        INSERT INTO user_settings (user_id, settings)
        VALUES (p_user_id, '{}'::jsonb)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING settings INTO v_settings;
    END IF;
    
    RETURN COALESCE(v_settings, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to update a specific setting
CREATE OR REPLACE FUNCTION update_user_setting(
    p_user_id UUID,
    p_key TEXT,
    p_value jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_settings jsonb;
BEGIN
    -- Upsert settings
    INSERT INTO user_settings (user_id, settings)
    VALUES (p_user_id, jsonb_build_object(p_key, p_value))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        settings = user_settings.settings || jsonb_build_object(p_key, p_value),
        updated_at = NOW()
    RETURNING settings INTO v_settings;
    
    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
