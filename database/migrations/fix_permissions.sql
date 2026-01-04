-- 1. Ensure RLS is definitely disabled
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access to the 'authenticated' role (logged in users)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;

-- 3. Grant full access to the 'anon' role (just in case)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON conversations TO anon;
GRANT ALL ON conversation_participants TO anon;
GRANT ALL ON messages TO anon;

-- 4. Grant access to sequences (for ID generation)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
