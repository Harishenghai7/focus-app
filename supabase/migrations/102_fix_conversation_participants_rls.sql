-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Infinite Recursion in conversation_participants RLS Policy
-- Issue: The SELECT policy was querying the same table it was protecting
-- Solution: Use a SECURITY DEFINER function to bypass RLS during the check
-- ═══════════════════════════════════════════════════════════════════════

-- Create a helper function that checks if user is in a conversation
-- SECURITY DEFINER allows it to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION is_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Create a non-recursive policy using the helper function
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    is_conversation_participant(conversation_id, auth.uid())
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed infinite recursion in conversation_participants RLS policy';
  RAISE NOTICE '   - Created helper function: is_conversation_participant()';
  RAISE NOTICE '   - Updated RLS policy to use SECURITY DEFINER function';
END $$;
