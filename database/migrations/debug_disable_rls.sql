-- NUCLEAR OPTION: Temporarily disable ALL RLS to test
-- This will help us determine if RLS is the problem or something else

-- WARNING: This makes your data publicly accessible! Only for testing!
-- Run this, test sending a message, then re-enable RLS immediately

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
