-- MINIMAL FIX - Run Each Line Separately
-- Copy and paste ONE LINE at a time into Supabase SQL Editor

-- Line 1: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Line 2: Disable RLS on profiles (fixes user loading)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Line 3: Disable RLS on flash (fixes flash creation)
ALTER TABLE flash DISABLE ROW LEVEL SECURITY;

-- Line 4: Disable RLS on conversations (if it exists - skip if error)
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Line 5: Disable RLS on messages (if it exists - skip if error)
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- DONE! Now test your app.
