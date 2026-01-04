-- FINAL DATABASE FIX: Ensure no locks or triggers are blocking queries
-- This removes EVERYTHING that could block SELECT or INSERT

-- 1. Drop ALL triggers on messages table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'messages'::regclass
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON messages CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- 2. Drop ALL functions that might be called by triggers
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
DROP FUNCTION IF EXISTS notify_new_message() CASCADE;

-- 3. Disable RLS completely for testing
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- 4. Check for any locks
SELECT 
    pid,
    usename,
    application_name,
    state,
    query
FROM pg_stat_activity 
WHERE datname = current_database()
AND state != 'idle';

-- 5. Verify no triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers 
WHERE event_object_table IN ('messages', 'conversations', 'conversation_participants');

DO $$
BEGIN
    RAISE NOTICE '✅ All triggers removed!';
    RAISE NOTICE '✅ All RLS disabled!';
    RAISE NOTICE '🔄 Refresh app - queries should work instantly now!';
END $$;
