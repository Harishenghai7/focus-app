-- ===================================
-- EMERGENCY FIX - DISABLE RLS FOR MESSAGING
-- This will make messaging work immediately
-- Run this in Supabase SQL Editor NOW
-- ===================================

-- Disable RLS on messaging tables (TEMPORARY - for development)
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS DISABLED for messaging tables!';
  RAISE NOTICE '⚠️  WARNING: This is for development only!';
  RAISE NOTICE '📝 Remember to enable RLS with proper policies before production!';
END $$;
