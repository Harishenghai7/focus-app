-- Migration: Group Notifications
-- Date: 2025-11-08
-- Description: Add notification support for group messages with mute functionality

-- Add muted_until column to group_members for mute functionality
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Create index for muted groups
CREATE INDEX IF NOT EXISTS idx_group_members_muted ON group_members(user_id, muted_until) 
WHERE muted_until IS NOT NULL AND muted_until > NOW();

-- Function to increment unread count for group members
CREATE OR REPLACE FUNCTION increment_group_unread_count()
RETURNS TRIGGER AS $
BEGIN
  -- Increment unread count for all members except the sender
  UPDATE group_members
  SET unread_count = unread_count + 1
  WHERE group_id = NEW.group_id
  AND user_id != NEW.sender_id
  AND (muted_until IS NULL OR muted_until < NOW());
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to increment unread count on new group message
DROP TRIGGER IF EXISTS trigger_increment_group_unread ON group_messages;
CREATE TRIGGER trigger_increment_group_unread
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_group_unread_count();

-- Function to reset unread count when user views group
CREATE OR REPLACE FUNCTION reset_group_unread_count(
  p_group_id UUID,
  p_user_id UUID
)
RETURNS void AS $
BEGIN
  UPDATE group_members
  SET unread_count = 0
  WHERE group_id = p_group_id
  AND user_id = p_user_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mute/unmute group
CREATE OR REPLACE FUNCTION toggle_group_mute(
  p_group_id UUID,
  p_user_id UUID,
  p_duration_hours INTEGER DEFAULT NULL -- NULL to unmute, or hours to mute
)
RETURNS void AS $
BEGIN
  IF p_duration_hours IS NULL THEN
    -- Unmute
    UPDATE group_members
    SET muted_until = NULL
    WHERE group_id = p_group_id
    AND user_id = p_user_id;
  ELSE
    -- Mute for specified duration
    UPDATE group_members
    SET muted_until = NOW() + (p_duration_hours || ' hours')::INTERVAL
    WHERE group_id = p_group_id
    AND user_id = p_user_id;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get group unread counts for a user
CREATE OR REPLACE FUNCTION get_group_unread_counts(p_user_id UUID)
RETURNS TABLE(
  group_id UUID,
  unread_count INTEGER,
  is_muted BOOLEAN
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    gm.group_id,
    gm.unread_count,
    (gm.muted_until IS NOT NULL AND gm.muted_until > NOW()) as is_muted
  FROM group_members gm
  WHERE gm.user_id = p_user_id
  AND gm.unread_count > 0
  ORDER BY gm.unread_count DESC;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for group message
CREATE OR REPLACE FUNCTION notify_group_message()
RETURNS TRIGGER AS $
DECLARE
  member_record RECORD;
  group_name TEXT;
  sender_username TEXT;
BEGIN
  -- Get group name
  SELECT name INTO group_name
  FROM group_chats
  WHERE id = NEW.group_id;
  
  -- Get sender username
  SELECT username INTO sender_username
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification for each member (except sender and muted members)
  FOR member_record IN
    SELECT user_id
    FROM group_members
    WHERE group_id = NEW.group_id
    AND user_id != NEW.sender_id
    AND (muted_until IS NULL OR muted_until < NOW())
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content_id,
      content_type,
      text,
      reference_id
    ) VALUES (
      member_record.user_id,
      'group_message',
      NEW.sender_id,
      NEW.id,
      'group_message',
      sender_username || ' sent a message in ' || group_name,
      NEW.group_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for group message notifications
DROP TRIGGER IF EXISTS trigger_notify_group_message ON group_messages;
CREATE TRIGGER trigger_notify_group_message
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_group_message();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION reset_group_unread_count(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_group_mute(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_group_unread_counts(UUID) TO authenticated;

-- Add comment
COMMENT ON COLUMN group_members.muted_until IS 'Timestamp until which the group is muted for this user';
COMMENT ON COLUMN group_members.unread_count IS 'Number of unread messages in this group for this user';

COMMIT;
