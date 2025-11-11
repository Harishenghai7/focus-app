-- Remove trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Make profiles table optional
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;