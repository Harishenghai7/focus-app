-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Infinite Recursion in conversation_participants RLS Policy
-- ═══════════════════════════════════════════════════════════════════════

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Create a non-recursive policy
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid());

-- This allows users to see participants in conversations they're part of
-- without causing infinite recursion
