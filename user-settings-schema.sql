-- User Settings Table for Focus App
-- Handles all user preferences and settings

CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Account Settings
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'de', 'it', 'pt')),
  
  -- Privacy Settings
  private_account BOOLEAN DEFAULT FALSE,
  show_activity_status BOOLEAN DEFAULT TRUE,
  allow_message_requests BOOLEAN DEFAULT TRUE,
  
  -- Notification Settings
  push_notifications BOOLEAN DEFAULT TRUE,
  notify_likes BOOLEAN DEFAULT TRUE,
  notify_comments BOOLEAN DEFAULT TRUE,
  notify_follows BOOLEAN DEFAULT TRUE,
  notify_messages BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  
  -- Security Settings
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Function to create default settings for new users
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create settings when profile is created
CREATE TRIGGER trigger_create_user_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();