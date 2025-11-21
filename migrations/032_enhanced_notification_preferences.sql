-- Migration: Enhanced notification preferences
-- Adds more granular notification control options

-- Add additional notification preference columns if they don't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_tags BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_story_views BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_post_likes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_comment_likes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_new_followers BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_follow_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_accepted_requests BOOLEAN DEFAULT TRUE;

-- Add email notification preferences
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_product_updates BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_tips BOOLEAN DEFAULT TRUE;

-- Add push notification sound preference
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notification_vibration BOOLEAN DEFAULT TRUE;

-- Comment on new columns
COMMENT ON COLUMN user_settings.notify_mentions IS 'Receive notifications when mentioned in comments';
COMMENT ON COLUMN user_settings.notify_tags IS 'Receive notifications when tagged in posts';
COMMENT ON COLUMN user_settings.notify_story_views IS 'Receive notifications for story views';
COMMENT ON COLUMN user_settings.notify_post_likes IS 'Receive notifications for post likes';
COMMENT ON COLUMN user_settings.notify_comment_likes IS 'Receive notifications for comment likes';
COMMENT ON COLUMN user_settings.notify_new_followers IS 'Receive notifications for new followers';
COMMENT ON COLUMN user_settings.notify_follow_requests IS 'Receive notifications for follow requests';
COMMENT ON COLUMN user_settings.notify_accepted_requests IS 'Receive notifications when follow requests are accepted';
COMMENT ON COLUMN user_settings.email_marketing IS 'Receive marketing emails';
COMMENT ON COLUMN user_settings.email_product_updates IS 'Receive product update emails';
COMMENT ON COLUMN user_settings.email_tips IS 'Receive tips and tricks emails';
COMMENT ON COLUMN user_settings.notification_sound IS 'Play sound for notifications';
COMMENT ON COLUMN user_settings.notification_vibration IS 'Vibrate for notifications';
