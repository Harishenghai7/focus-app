-- Remove ALL triggers and functions completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_missing_profiles() CASCADE;

-- Check if there are any other triggers
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- Remove profiles table foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;