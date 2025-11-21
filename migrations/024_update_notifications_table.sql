-- Migration: Update notifications table for comprehensive notification system
-- This migration updates the notifications table to support all notification types

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add actor_id column (alias for from_user_id for consistency)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'actor_id') THEN
    ALTER TABLE notifications ADD COLUMN actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  -- Add content_id column (generic reference to any content)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'content_id') THEN
    ALTER TABLE notifications ADD COLUMN content_id UUID;
  END IF;

  -- Add content_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'content_type') THEN
    ALTER TABLE notifications ADD COLUMN content_type TEXT;
  END IF;

  -- Add text/message column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'text') THEN
    ALTER TABLE notifications ADD COLUMN text TEXT;
  END IF;

  -- Add is_read column (standardized name)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Migrate data from old columns to new columns
UPDATE notifications 
SET actor_id = from_user_id 
WHERE actor_id IS NULL AND from_user_id IS NOT NULL;

UPDATE notifications 
SET is_read = read 
WHERE is_read IS NULL AND read IS NOT NULL;

UPDATE notifications 
SET text = content 
WHERE text IS NULL AND content IS NOT NULL;

-- Migrate post_id and boltz_id to content_id/content_type
UPDATE notifications 
SET content_id = post_id, content_type = 'post'
WHERE content_id IS NULL AND post_id IS NOT NULL;

UPDATE notifications 
SET content_id = boltz_id, content_type = 'boltz'
WHERE content_id IS NULL AND boltz_id IS NOT NULL;

-- Update type column to support new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like', 'comment', 'follow', 'follow_request', 'follow_request_accepted', 
                  'mention', 'message', 'call', 'call_missed', 'system'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_content ON notifications(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Create RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone can insert notifications (for creating notifications)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = user_uuid AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM notifications WHERE user_id = user_uuid AND is_read = false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'Stores all user notifications for likes, comments, follows, mentions, messages, and calls';
COMMENT ON COLUMN notifications.actor_id IS 'User who performed the action that triggered the notification';
COMMENT ON COLUMN notifications.content_id IS 'Generic reference to related content (post, boltz, flash, comment, etc.)';
COMMENT ON COLUMN notifications.content_type IS 'Type of content referenced by content_id';
COMMENT ON COLUMN notifications.text IS 'Notification message text';
COMMENT ON COLUMN notifications.is_read IS 'Whether the notification has been read by the user';
