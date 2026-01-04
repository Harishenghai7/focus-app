-- ==============================================================================
-- CREATE USER_INTERESTS TABLE
-- Run this script in your Supabase SQL Editor to fix the "Could not find the table" error.
-- ==============================================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interest VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Allow users to view their own interests (or public if that's the intent, but usually interests are public profile info)
-- Let's make them viewable by everyone for now as they are part of the profile
CREATE POLICY "Interests are viewable by everyone" 
ON public.user_interests FOR SELECT 
USING (true);

-- Allow users to insert their own interests
CREATE POLICY "Users can insert their own interests" 
ON public.user_interests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own interests
CREATE POLICY "Users can delete their own interests" 
ON public.user_interests FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Grant permissions
GRANT SELECT, INSERT, DELETE ON public.user_interests TO authenticated;
GRANT SELECT ON public.user_interests TO anon;
