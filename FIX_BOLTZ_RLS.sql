-- Fix RLS policies for boltz table to allow updates
-- Run this in Supabase SQL Editor

-- First, let's see what policies exist
-- SELECT * FROM pg_policies WHERE tablename = 'boltz';

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own boltz" ON boltz;
DROP POLICY IF EXISTS "Users can update their own boltz" ON boltz;
DROP POLICY IF EXISTS "update_own_boltz" ON boltz;

-- Create a proper update policy
CREATE POLICY "Users can update own boltz"
ON boltz
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure the select policy exists (needed for .select() to work)
DROP POLICY IF EXISTS "Users can view all boltz" ON boltz;
DROP POLICY IF EXISTS "Boltz are viewable by everyone" ON boltz;
DROP POLICY IF EXISTS "select_boltz" ON boltz;

CREATE POLICY "Boltz are viewable by everyone"
ON boltz
FOR SELECT
USING (true);

-- Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'boltz'
ORDER BY cmd, policyname;
