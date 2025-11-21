-- Migration: Group Messaging Support
-- Date: 2025-11-07
-- Description: Complete group chat functionality with members, messages, and permissions

-- Group Chats Table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Group Messages Table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES group_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'file')),
  media_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at DESC);

-- RLS Policies
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Group Chats Policies
CREATE POLICY "Users can view groups they're members of"
  ON group_chats FOR SELECT
  USING (id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create groups"
  ON group_chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update groups"
  ON group_chats FOR UPDATE
  USING (id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Group Members Policies
CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (group_id IN (
    SELECT group_id FROM group_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- Group Messages Policies
CREATE POLICY "Members can view group messages"
  ON group_messages FOR SELECT
  USING (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_chats SET updated_at = NOW() WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_on_message
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_timestamp();

COMMENT ON TABLE group_chats IS 'Group chat conversations';
COMMENT ON TABLE group_members IS 'Members of group chats with roles';
COMMENT ON TABLE group_messages IS 'Messages sent in group chats';
