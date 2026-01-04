-- ═══════════════════════════════════════════════════════════════════════
-- VERIFY DATABASE SETUP - Run this after migration to check everything
-- ═══════════════════════════════════════════════════════════════════════
-- Copy and paste this into Supabase SQL Editor to verify setup

-- Check if all tables exist
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'conversations',
        'conversation_participants',
        'messages',
        'message_attachments',
        'calls',
        'typing_indicators',
        'user_presence',
        'blocked_users',
        'reports'
    );

    IF table_count = 9 THEN
        RAISE NOTICE '✅ All 9 tables exist';
    ELSE
        RAISE NOTICE '❌ Only % out of 9 tables exist', table_count;
    END IF;
END $$;

-- Check if RLS is enabled
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
        'conversations',
        'conversation_participants',
        'messages',
        'message_attachments',
        'calls',
        'typing_indicators',
        'user_presence',
        'blocked_users',
        'reports'
    );

    IF rls_count = 9 THEN
        RAISE NOTICE '✅ RLS enabled on all 9 tables';
    ELSE
        RAISE NOTICE '⚠️  RLS enabled on only % out of 9 tables', rls_count;
    END IF;
END $$;

-- Check if helper functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_or_create_conversation') THEN
        RAISE NOTICE '✅ Function: get_or_create_conversation';
    ELSE
        RAISE NOTICE '❌ Function: get_or_create_conversation - MISSING';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_messages_as_read') THEN
        RAISE NOTICE '✅ Function: mark_messages_as_read';
    ELSE
        RAISE NOTICE '❌ Function: mark_messages_as_read - MISSING';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_unsend_message') THEN
        RAISE NOTICE '✅ Function: can_unsend_message';
    ELSE
        RAISE NOTICE '❌ Function: can_unsend_message - MISSING';
    END IF;
END $$;

-- Check indexes
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN (
        'conversations',
        'conversation_participants',
        'messages',
        'message_attachments',
        'calls',
        'typing_indicators',
        'user_presence',
        'blocked_users',
        'reports'
    );

    RAISE NOTICE '✅ % indexes created for performance', index_count;
END $$;

-- Check storage bucket (this will fail if not created yet)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets WHERE name = 'message-media'
        ) THEN '✅ Storage bucket: message-media exists'
        ELSE '❌ Storage bucket: message-media - NOT CREATED'
    END AS bucket_status;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 VERIFICATION COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'If you see all ✅ marks above, your database is ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create message-media storage bucket (if not exists)';
    RAISE NOTICE '2. Add storage policies';
    RAISE NOTICE '3. Test sending a message from your app';
    RAISE NOTICE '';
END $$;
