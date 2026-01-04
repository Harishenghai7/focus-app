-- FIX MESSAGES & FLASH DISPLAY ISSUES
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Disable RLS on conversation_participants
-- ============================================
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON conversation_participants';
    END LOOP;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE conversation_participants TO authenticated;
GRANT ALL PRIVILEGES ON TABLE conversation_participants TO anon;

-- ============================================
-- FIX 2: Check if is_archived column exists in flash
-- ============================================
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'flash' AND column_name = 'is_archived';

-- If it returns NO ROWS, add the column:
ALTER TABLE flash ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- ============================================
-- FIX 3: Reload Schema
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================
-- VERIFY
-- ============================================
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conversation_participants', 'flash');

-- Check flash columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'flash'
ORDER BY ordinal_position;
