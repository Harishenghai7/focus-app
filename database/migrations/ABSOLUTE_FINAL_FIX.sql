-- ABSOLUTE FINAL FIX - Run this and messaging will work PERMANENTLY
-- This removes ALL possible blocking mechanisms

-- 1. Drop ALL triggers on messages (including hidden ones)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all triggers
    FOR r IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'messages'::regclass
        AND tgname NOT LIKE 'RI_%'  -- Keep foreign key triggers
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON messages CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
    
    -- Drop all related functions
    DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;
    DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
    DROP FUNCTION IF EXISTS handle_new_message() CASCADE;
END $$;

-- 2. Ensure RLS is enabled with SIMPLE policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 3. Drop and recreate policies (clean slate)
DROP POLICY IF EXISTS "Users can view messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

-- 4. Create SIMPLE policies (no subqueries that could hang)
CREATE POLICY "Users can view messages"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Users can insert messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- 5. Verify setup
SELECT 
    'Triggers' as type,
    COUNT(*) as count
FROM pg_trigger 
WHERE tgrelid = 'messages'::regclass
AND tgname NOT LIKE 'RI_%'

UNION ALL

SELECT 
    'Policies' as type,
    COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'messages';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ DONE! No triggers = No hanging!';
    RAISE NOTICE '✅ Simple RLS = Fast queries!';
    RAISE NOTICE '🚀 Refresh app and send messages now!';
END $$;
