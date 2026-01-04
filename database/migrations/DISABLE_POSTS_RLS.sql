-- ==========================================
-- EMERGENCY: DISABLE RLS ON POSTS TABLE
-- ==========================================
-- This will allow posts to be created immediately
-- Re-enable RLS after confirming it works

ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- ✅ Try uploading now - it should work!
-- ==========================================
-- To re-enable later:
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ==========================================
