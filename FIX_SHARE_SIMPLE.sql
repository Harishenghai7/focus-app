-- SIMPLE FIX - Only Essential Tables
-- Run this in Supabase SQL Editor

-- ============================================
-- Step 1: Refresh Schema Cache
-- ============================================
NOTIFY pgrst, 'reload schema';


-- ============================================
-- Step 2: Disable RLS on Essential Tables Only
-- ============================================

-- Fix user loading
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Fix flash creation
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;

-- Fix messaging (only if tables exist)
DO $$ 
BEGIN
    -- Disable RLS on conversations if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Disable RLS on messages if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Disable RLS on chat_participants if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
        ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;


-- ============================================
-- Step 3: Verify
-- ============================================

-- Check which tables have RLS disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'flash', 'conversations', 'messages', 'chat_participants')
ORDER BY tablename;

-- Should show rowsecurity = false for all
