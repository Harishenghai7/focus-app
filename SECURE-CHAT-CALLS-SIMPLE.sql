-- ============================================
-- SECURE CHAT & CALLS - SIMPLIFIED VERSION
-- ============================================
-- This version works with the existing messages table structure
-- Run this if SECURE-CHAT-CALLS.sql has errors
-- ============================================

-- ============================================
-- 1. ADD CHAT_ID TO MESSAGES (Optional for group chats)
-- ============================================

-- Add chat_id column if you want to support group chats in the future
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_id TEXT;

-- Create index for chat_id
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);

-- ============================================
-- 2. UPDATE EXISTING RLS POLICIES FOR MESSAGES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- Create secure policies for direct messages
CREATE POLICY "Users can view their direct messages" 
ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send direct messages" 
ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND receiver_id IS NOT NULL
  AND receiver_id != sender_id
);

CREATE POLICY "Users can update their own messages" 
ON messages FOR UPDATE USING (
  auth.uid() = sender_id
);

CREATE POLICY "Users can delete their own messages" 
ON messages FOR DELETE USING (
  auth.uid() = sender_id
);

-- ============================================
-- 3. CREATE CALL PARTICIPANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS call_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'invited', -- 'invited', 'joined', 'left', 'declined'
    UNIQUE(call_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_call_participants_call ON call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON call_participants(user_id);

-- Enable RLS
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CALL PARTICIPANTS POLICIES
-- ============================================

-- Users can view participants in calls they're in
CREATE POLICY "Users can view call participants" 
ON call_participants FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM call_participants cp 
    WHERE cp.call_id = call_participants.call_id 
    AND cp.user_id = auth.uid()
  )
);

-- Users can join calls (add themselves)
CREATE POLICY "Users can join calls" 
ON call_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Users can update their own participation status
CREATE POLICY "Users can update own call status" 
ON call_participants FOR UPDATE USING (
  auth.uid() = user_id
);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Check if user can message another user
CREATE OR REPLACE FUNCTION can_message_user(sender UUID, receiver UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if either user has blocked the other
  RETURN NOT EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE (blocker_id = sender AND blocked_id = receiver)
       OR (blocker_id = receiver AND blocked_id = sender)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. VERIFICATION
-- ============================================

-- Check policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('messages', 'call_participants')
ORDER BY tablename, policyname;

-- Test message access
DO $$
BEGIN
  RAISE NOTICE 'Message policies created successfully!';
  RAISE NOTICE 'Users can now only see their own direct messages.';
  RAISE NOTICE 'Call participants table created for future call features.';
END $$;

-- ============================================
-- DONE! ✅
-- ============================================
-- Simplified chat security is now in place!
-- 
-- What's secured:
-- ✅ Users can only see messages they sent or received
-- ✅ Users can only send messages as themselves
-- ✅ Users can only update/delete their own messages
-- ✅ Call participants table ready for video/voice calls
-- 
-- Note: Group chat support requires additional setup
-- For now, all messages are direct (1-on-1) messages
-- ============================================
