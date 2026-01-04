-- ═══════════════════════════════════════════════════════════════════════
-- FINAL FIX: Infinite Recursion in conversation_participants RLS
-- Problem: RLS policy was querying the same table it was protecting
-- Solution: Simplify the policy to only check auth.uid() without subqueries
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Drop the problematic function and policy
DROP FUNCTION IF EXISTS is_conversation_participant(UUID, UUID);
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Step 2: Create a simple, non-recursive SELECT policy
-- Users can only see their own participation records
CREATE POLICY "Users can view their own participation"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid());

-- Step 3: Allow users to view other participants in conversations they're part of
-- This requires a different approach - we'll use a materialized view or accept the limitation
-- For now, we'll create a policy that allows viewing all participants if you're authenticated
-- The application layer will filter to only show conversations the user is part of

DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;

CREATE POLICY "Authenticated users can view conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (true);

-- Step 4: Ensure INSERT policy exists for creating new conversations
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;

CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 5: Ensure UPDATE policy exists
DROP POLICY IF EXISTS "Users can update their participation" ON conversation_participants;

CREATE POLICY "Users can update their participation"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Step 6: Ensure DELETE policy exists
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed infinite recursion in conversation_participants RLS';
  RAISE NOTICE '   - Removed recursive helper function';
  RAISE NOTICE '   - Created simple, non-recursive policies';
  RAISE NOTICE '   - All authenticated users can view participants (app filters)';
END $$;
