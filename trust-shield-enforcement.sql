-- ==============================================================================
-- Focus Trust Shield — Strict Database Enforcement Policies
-- ==============================================================================

-- 1. Create or Update ENUM Type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
        CREATE TYPE verification_status_enum AS ENUM ('UNVERIFIED', 'PENDING_GUARDIAN', 'VERIFIED', 'VERIFIED_MINOR');
    END IF;
END $$;

-- 2. Add verification_status column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='verification_status') THEN
        ALTER TABLE public.profiles ADD COLUMN verification_status verification_status_enum DEFAULT 'UNVERIFIED';
    END IF;
END $$;

-- Add identity_metadata for storing OCR and Face similarity scores
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='identity_metadata') THEN
        ALTER TABLE public.profiles ADD COLUMN identity_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ==============================================================================
-- 3. THE WIPE (Unverified User Data Purge)
-- As requested: Wipe all existing posts/messages from unverified accounts.
-- ==============================================================================

-- Wipe unverified posts
DELETE FROM public.posts 
WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE verification_status NOT IN ('VERIFIED', 'VERIFIED_MINOR')
       OR verification_status IS NULL
) OR user_id IS NULL;

-- Wipe unverified messages
DELETE FROM public.messages
WHERE sender_id IN (
    SELECT id FROM public.profiles
    WHERE verification_status NOT IN ('VERIFIED', 'VERIFIED_MINOR')
       OR verification_status IS NULL
) OR sender_id IS NULL;


-- ==============================================================================
-- 4. RESTRICTIVE RLS POLICIES
-- ==============================================================================

-- A) POSTS

-- Drop existing generic select/insert policies to override with Trust Shield
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Verified users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Insert posts" ON public.posts;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Select Policy: Only fully verified users can fetch the feed
CREATE POLICY "Trust Shield: Verified Users Only Can View Posts" 
ON public.posts 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND verification_status IN ('VERIFIED', 'VERIFIED_MINOR')
    )
);

-- Insert Policy: Only fully verified users can post
CREATE POLICY "Trust Shield: Verified Users Only Can Insert Posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND verification_status IN ('VERIFIED', 'VERIFIED_MINOR')
    )
);

-- B) MESSAGES
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select Policy: Only verified sender/receiver can view
CREATE POLICY "Trust Shield: Verified Users Only Can View Messages" 
ON public.messages 
FOR SELECT 
USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND verification_status IN ('VERIFIED', 'VERIFIED_MINOR')
    )
);

-- Insert Policy: Only verified users can send
CREATE POLICY "Trust Shield: Verified Users Only Can Insert Messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND verification_status IN ('VERIFIED', 'VERIFIED_MINOR')
    )
);

-- Note: Admins or edge functions bypassing RLS should use the service_role key.
