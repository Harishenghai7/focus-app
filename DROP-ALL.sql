-- ============================================
-- DROP ALL EXISTING DATABASE OBJECTS
-- ============================================
-- ⚠️ WARNING: This will delete ALL data!
-- Run this in Supabase SQL Editor before setup
-- ============================================
-- ✅ This script is ERROR-PROOF
-- ✅ Won't fail if objects don't exist
-- ✅ Safe to run multiple times
-- ============================================

-- ============================================
-- DROP ALL FUNCTIONS (Error-proof)
-- ============================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- DROP ALL TABLES (in correct order)
-- ============================================
-- CASCADE will automatically drop:
-- - All triggers
-- - All indexes
-- - All policies
-- - All foreign keys
-- - All constraints

DROP TABLE IF EXISTS highlight_stories CASCADE;
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;
DROP TABLE IF EXISTS close_friends CASCADE;
DROP TABLE IF EXISTS saves CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS flashes CASCADE;
DROP TABLE IF EXISTS boltz CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- DROP CUSTOM TYPES
-- ============================================
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================
-- DROP STORAGE POLICIES (Error-proof)
-- ============================================
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;

-- ============================================
-- CLEAN STORAGE (Error-proof)
-- ============================================
-- Note: This might show notices if buckets don't exist
-- That's normal and safe to ignore

DO $$ 
DECLARE
    bucket_name TEXT;
BEGIN
    -- Delete all objects from buckets
    FOR bucket_name IN SELECT unnest(ARRAY['avatars', 'posts', 'boltz', 'flash', 'messages', 'thumbnails'])
    LOOP
        BEGIN
            DELETE FROM storage.objects WHERE bucket_id = bucket_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not delete objects from bucket: %', bucket_name;
        END;
    END LOOP;
    
    -- Delete buckets
    FOR bucket_name IN SELECT unnest(ARRAY['avatars', 'posts', 'boltz', 'flash', 'messages', 'thumbnails'])
    LOOP
        BEGIN
            DELETE FROM storage.buckets WHERE id = bucket_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not delete bucket: %', bucket_name;
        END;
    END LOOP;
END $$;

-- ============================================
-- VERIFICATION (Optional - Uncomment to run)
-- ============================================

-- Check remaining tables (should be empty or only system tables)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check remaining functions (should be empty)
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- Check storage buckets (should be empty)
-- SELECT * FROM storage.buckets;

-- ============================================
-- ✅ DONE! Database is clean!
-- ============================================
-- Next step: Run SUPABASE-SETUP.sql
-- ============================================
