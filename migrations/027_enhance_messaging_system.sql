-- ============================================
-- ENHANCE MESSAGING SYSTEM
-- Add columns for delivery status, read receipts, and message deletion
-- ============================================

-- Add new columns to messages table
DO $$ 
BEGIN
    -- Add is_read column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Add delivered_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'delivered_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE messages ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add deleted_for_sender column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'deleted_for_sender'
    ) THEN
        ALTER TABLE messages ADD COLUMN deleted_for_sender BOOLEAN DEFAULT false;
    END IF;

    -- Add deleted_for_receiver column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'deleted_for_receiver'
    ) THEN
        ALTER TABLE messages ADD COLUMN deleted_for_receiver BOOLEAN DEFAULT false;
    END IF;

    -- Add reply_to_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'reply_to_id'
    ) THEN
        ALTER TABLE messages ADD COLUMN reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;
    END IF;

    -- Add voice_duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'voice_duration'
    ) THEN
        ALTER TABLE messages ADD COLUMN voice_duration INTEGER;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Function to mark messages as delivered
CREATE OR REPLACE FUNCTION mark_messages_delivered(
    p_chat_id TEXT,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET delivered_at = NOW()
    WHERE chat_id = p_chat_id
    AND receiver_id = p_user_id
    AND delivered_at IS NULL
    AND sender_id != p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
    p_chat_id TEXT,
    p_user_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET 
        is_read = true,
        read_at = NOW()
    WHERE chat_id = p_chat_id
    AND receiver_id = p_user_id
    AND is_read = false
    AND sender_id != p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS TABLE(chat_id TEXT, unread_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.chat_id,
        COUNT(*) as unread_count
    FROM messages m
    WHERE m.receiver_id = p_user_id
    AND m.is_read = false
    AND m.deleted_for_receiver = false
    GROUP BY m.chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;
DROP POLICY IF EXISTS "Users can delete messages" ON messages;

-- Users can view messages in their chats (excluding deleted messages)
CREATE POLICY "Users can view messages in their chats" 
ON messages FOR SELECT USING (
    (
        -- Direct messages - sender can see if not deleted for sender
        (auth.uid() = sender_id AND deleted_for_sender = false)
        OR 
        -- Direct messages - receiver can see if not deleted for receiver
        (auth.uid() = receiver_id AND deleted_for_receiver = false)
    )
    OR
    (
        -- Group chats
        chat_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.chat_id = messages.chat_id 
            AND chat_participants.user_id = auth.uid()
            AND chat_participants.left_at IS NULL
        )
        AND deleted_at IS NULL
    )
);

-- Users can send messages
CREATE POLICY "Users can send messages" 
ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
        -- Direct message
        receiver_id IS NOT NULL
        OR
        -- Group chat - user must be participant
        (
            chat_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM chat_participants 
                WHERE chat_participants.chat_id = messages.chat_id 
                AND chat_participants.user_id = auth.uid()
                AND chat_participants.left_at IS NULL
            )
        )
    )
);

-- Users can update their own messages (for read receipts and deletion)
CREATE POLICY "Users can update messages" 
ON messages FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Users can delete their own messages
CREATE POLICY "Users can delete messages" 
ON messages FOR DELETE USING (
    auth.uid() = sender_id
);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION mark_messages_delivered(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_read(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(UUID) TO authenticated;

COMMIT;
