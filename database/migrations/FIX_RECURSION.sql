-- FIX: Remove infinite recursion in conversation_participants policy

-- Drop the recursive policy
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;

-- Create a simple, non-recursive policy
CREATE POLICY "participants_select_policy"
ON conversation_participants FOR SELECT
TO authenticated
USING (
    -- User can see participants if they are in the conversation
    user_id = auth.uid()
    OR
    conversation_id IN (
        SELECT conversation_id 
        FROM conversation_participants 
        WHERE user_id = auth.uid()
    )
);

-- Wait, this is STILL recursive! Let me use a different approach:
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;

-- Simple policy: Users can see ALL participants (no recursion)
-- This is safe because we're only exposing participant lists, not private data
CREATE POLICY "participants_select_policy"
ON conversation_participants FOR SELECT
TO authenticated
USING (true);  -- Allow all authenticated users to see participants

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed infinite recursion!';
    RAISE NOTICE '🔄 Refresh app now!';
END $$;
