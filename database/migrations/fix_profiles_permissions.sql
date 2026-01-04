-- Disable RLS on profiles to ensure they can be fetched
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
