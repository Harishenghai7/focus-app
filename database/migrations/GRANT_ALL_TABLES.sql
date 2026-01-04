-- ==========================================
-- GRANT PERMISSIONS ON ALL CONTENT TABLES
-- ==========================================

-- Grant permissions on posts table
GRANT ALL ON posts TO authenticated;
GRANT ALL ON posts TO anon;
GRANT ALL ON posts TO service_role;

-- Grant permissions on boltz table
GRANT ALL ON boltz TO authenticated;
GRANT ALL ON boltz TO anon;
GRANT ALL ON boltz TO service_role;

-- Grant permissions on stories table
GRANT ALL ON stories TO authenticated;
GRANT ALL ON stories TO anon;
GRANT ALL ON stories TO service_role;

-- Disable RLS on these tables (temporary - for testing)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE boltz DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- ✅ Try uploading now - all tables accessible!
-- ==========================================
