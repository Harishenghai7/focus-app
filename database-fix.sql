-- Fix for user signup database error
-- Run this in your Supabase SQL editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- Generate a unique username
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
  
  -- Ensure username is unique by appending numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := new_username || floor(random() * 1000)::text;
  END LOOP;
  
  -- Insert the new profile
  INSERT INTO public.profiles (id, username, full_name, avatar_url, bio)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    ''
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Also create a function to manually create profiles for existing users
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  new_username TEXT;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Generate username
    new_username := COALESCE(
      user_record.raw_user_meta_data->>'username',
      'user_' || substr(replace(user_record.id::text, '-', ''), 1, 8)
    );
    
    -- Ensure username is unique
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
      new_username := new_username || floor(random() * 1000)::text;
    END LOOP;
    
    -- Insert profile
    INSERT INTO public.profiles (id, username, full_name, avatar_url, bio)
    VALUES (
      user_record.id,
      new_username,
      COALESCE(user_record.raw_user_meta_data->>'full_name', ''),
      COALESCE(user_record.raw_user_meta_data->>'avatar_url', ''),
      ''
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to create profiles for any existing users
SELECT public.create_missing_profiles();