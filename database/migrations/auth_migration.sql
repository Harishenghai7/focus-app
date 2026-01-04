-- ═══════════════════════════════════════════════════════════════════════
-- 🔐 AUTHENTICATION SYSTEM MIGRATION
-- Add date of birth, teen mode, and email fields for complete auth
-- ═══════════════════════════════════════════════════════════════════════

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ STEP 1: Add Missing Columns to Profiles Table                         ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Add email column (store user email for username login support)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add date of birth for age validation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add teen mode flag (ages 13-17)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_teen BOOLEAN DEFAULT false;

-- Add account privacy setting
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_privacy VARCHAR(20) DEFAULT 'public';

-- Create index on email for fast username-to-email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ STEP 2: Enhanced User Settings Table                                  ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Ensure user_settings has content filter level for teen mode
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_settings') THEN
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS content_filter_level VARCHAR(20) DEFAULT 'moderate';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS account_privacy VARCHAR(20) DEFAULT 'public';
        ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ STEP 3: Enhanced Profile Creation Trigger                             ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enhanced trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_age INTEGER;
    is_teen_user BOOLEAN;
    filter_level VARCHAR(20);
BEGIN
    -- Calculate age if date_of_birth is provided
    IF NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN
        user_age := EXTRACT(YEAR FROM AGE(
            CAST(NEW.raw_user_meta_data->>'date_of_birth' AS DATE)
        ));
        is_teen_user := user_age >= 13 AND user_age < 18;
        filter_level := CASE WHEN is_teen_user THEN 'strict' ELSE 'moderate' END;
    ELSE
        user_age := NULL;
        is_teen_user := false;
        filter_level := 'moderate';
    END IF;

    -- Create profile
    INSERT INTO public.profiles (
        id, 
        username, 
        full_name, 
        email,
        date_of_birth,
        is_teen,
        account_privacy,
        created_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        CAST(NEW.raw_user_meta_data->>'date_of_birth' AS DATE),
        is_teen_user,
        'public',
        NOW()
    );

    -- Create user_settings if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_settings') THEN
        INSERT INTO public.user_settings (
            user_id,
            account_privacy,
            notifications_enabled,
            content_filter_level,
            created_at
        )
        VALUES (
            NEW.id,
            'public',
            true,
            filter_level,
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Create user_presence if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_presence') THEN
        INSERT INTO public.user_presence (
            user_id,
            is_online,
            last_seen_at,
            updated_at
        )
        VALUES (
            NEW.id,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ STEP 4: Helper Function for Username Login                            ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Function to get email from username
CREATE OR REPLACE FUNCTION public.get_email_from_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM public.profiles
    WHERE username = username_input
    LIMIT 1;
    
    RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ STEP 5: Update RLS Policies                                           ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

-- Ensure profiles table has proper RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (account_privacy = 'public' OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ╔═══════════════════════════════════════════════════════════════════════╗
-- ║ VERIFICATION                                                          ║
-- ╚═══════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    has_email BOOLEAN;
    has_dob BOOLEAN;
    has_is_teen BOOLEAN;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) INTO has_email;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
    ) INTO has_dob;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_teen'
    ) INTO has_is_teen;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ AUTH MIGRATION COMPLETE!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Email column: %', CASE WHEN has_email THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'Date of birth column: %', CASE WHEN has_dob THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'Is teen column: %', CASE WHEN has_is_teen THEN '✓' ELSE '✗' END;
    RAISE NOTICE 'Trigger created: ✓';
    RAISE NOTICE 'RLS policies updated: ✓';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for auth implementation!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
