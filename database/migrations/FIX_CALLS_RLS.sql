-- Fix RLS policy for calls table
-- Allow authenticated users to insert their own calls

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert calls" ON calls;
DROP POLICY IF EXISTS "Users can view their calls" ON calls;
DROP POLICY IF EXISTS "Users can update their calls" ON calls;

-- Create simple, working policies
CREATE POLICY "Users can insert calls"
ON calls FOR INSERT
TO authenticated
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can view their calls"
ON calls FOR SELECT
TO authenticated
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can update their calls"
ON calls FOR UPDATE
TO authenticated
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'calls';

DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies fixed for calls table!';
    RAISE NOTICE '📞 You can now create calls!';
END $$;
