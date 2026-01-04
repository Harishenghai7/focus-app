-- FIX SCHEMA CACHE ISSUE
-- The column names ARE correct, but Supabase cache is stale!
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Force Schema Reload
-- ============================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait 5 seconds, then continue...

-- ============================================
-- STEP 2: Verify Flash Table Columns
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'flash'
ORDER BY ordinal_position;

-- Should show:
-- media_path | text
-- media_type | text

-- ============================================
-- STEP 3: Verify Messages Table Columns
-- ============================================
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Should show:
-- text | text

-- ============================================
-- STEP 4: Test Insert (Optional)
-- ============================================
-- Test if you can insert into flash
INSERT INTO flash (user_id, media_path, media_type, expires_at)
VALUES (
  auth.uid(),
  'https://test.com/test.mp4',
  'video',
  NOW() + INTERVAL '24 hours'
)
RETURNING *;

-- If this works, the schema is fine!
-- Delete the test row:
-- DELETE FROM flash WHERE media_path = 'https://test.com/test.mp4';

-- ============================================
-- STEP 5: Restart PostgREST (IMPORTANT!)
-- ============================================
-- Go to Supabase Dashboard:
-- Settings → API → Click "Restart" next to PostgREST
-- This forces it to reload the schema cache!
