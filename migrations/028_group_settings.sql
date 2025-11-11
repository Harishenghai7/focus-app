-- Migration: Group Settings
-- Date: 2025-11-08
-- Description: Add admin_only_messaging field to group_chats table

-- Add admin_only_messaging field
ALTER TABLE group_chats 
ADD COLUMN IF NOT EXISTS admin_only_messaging BOOLEAN DEFAULT false;

-- Update RLS policy for group messages to respect admin_only_messaging
DROP POLICY IF EXISTS "Members can send messages" ON group_messages;

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) AND
    (
      -- Either admin_only_messaging is false
      NOT EXISTS (SELECT 1 FROM group_chats WHERE id = group_id AND admin_only_messaging = true)
      OR
      -- Or user is an admin
      EXISTS (SELECT 1 FROM group_members WHERE group_id = group_messages.group_id AND user_id = auth.uid() AND role = 'admin')
    )
  );

COMMENT ON COLUMN group_chats.admin_only_messaging IS 'When true, only admins can send messages in the group';
