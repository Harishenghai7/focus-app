-- FINAL FIX FOR FLASH PERMISSIONS
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Check Current Status
-- ============================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'flash';

-- Should show: rowsecurity = false (RLS disabled)

-- ============================================
-- STEP 2: Grant ALL Permissions
-- ============================================
GRANT ALL PRIVILEGES ON TABLE flash TO authenticated;
GRANT ALL PRIVILEGES ON TABLE flash TO anon;
GRANT ALL PRIVILEGES ON TABLE flash TO postgres;

-- ============================================
-- STEP 3: Make Sure RLS is Disabled
-- ============================================
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Drop ALL Policies (Again)
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'flash') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON flash';
    END LOOP;
END $$;

-- ============================================
-- STEP 5: Verify No Policies Exist
-- ============================================
SELECT policyname FROM pg_policies WHERE tablename = 'flash';
-- Should return NO ROWS

-- ============================================
-- STEP 6: Test Insert
-- ============================================
-- Try inserting a test row
INSERT INTO flash (user_id, media_url, media_type, expires_at)
SELECT 
    auth.uid(),
    'https://test.com/test.mp4',
    'video',
    NOW() + INTERVAL '24 hours'
WHERE auth.uid() IS NOT NULL
RETURNING *;

-- If this works, delete the test:
-- DELETE FROM flash WHERE media_url = 'https://test.com/test.mp4';

-- ============================================
-- STEP 7: Reload Schema
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
