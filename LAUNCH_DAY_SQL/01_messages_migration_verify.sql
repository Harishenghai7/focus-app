-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS APP LAUNCH - STEP 1: VERIFY MESSAGES MIGRATION
-- Run this FIRST to check if migration is needed
-- ═══════════════════════════════════════════════════════════════════════

-- Check if messaging tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
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
)
ORDER BY table_name;

-- Expected result: 9 rows, all with status ✅ EXISTS
-- If any are missing, run the full migration from:
-- supabase/migrations/100_focus_messages_production.sql
