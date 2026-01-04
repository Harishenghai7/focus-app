-- Messaging System Enhancements - Complete Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add online status tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;

-- 2. Add message types for media support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- 3. Add message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON message_reactions(user_id);

-- 4. Add scheduled messages support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_scheduled_messages ON messages(scheduled_for) WHERE is_scheduled = true;

-- 5. Add pinned messages support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages ON messages(conversation_id, is_pinned) WHERE is_pinned = true;

-- 6. Add starred messages support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS starred_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_starred_messages ON messages(conversation_id, is_starred) WHERE is_starred = true;

-- 7. Add message editing support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 8. Add reply/forward support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES messages(id);
CREATE INDEX IF NOT EXISTS idx_message_replies ON messages(reply_to);

-- Grant permissions (if needed)
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON message_reactions TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Messaging system database migration completed successfully!';
END $$;
