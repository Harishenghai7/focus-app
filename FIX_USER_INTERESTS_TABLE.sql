-- ==============================================================================
-- FIX USER_INTERESTS TABLE - PERMANENT SOLUTION
-- Run this script in your Supabase SQL Editor
-- ==============================================================================

-- Drop the table if it exists (to ensure clean state)
DROP TABLE IF EXISTS public.user_interests CASCADE;

-- Create the user_interests table
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  interest VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX idx_user_interests_interest ON public.user_interests(interest);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Interests are viewable by everyone" ON public.user_interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can delete their own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can update their own interests" ON public.user_interests;

-- Create RLS Policies
-- Allow everyone to view interests (public profile information)
CREATE POLICY "Interests are viewable by everyone" 
ON public.user_interests FOR SELECT 
USING (true);

-- Allow users to insert their own interests
CREATE POLICY "Users can insert their own interests" 
ON public.user_interests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own interests
CREATE POLICY "Users can update their own interests" 
ON public.user_interests FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own interests
CREATE POLICY "Users can delete their own interests" 
ON public.user_interests FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;
GRANT SELECT ON public.user_interests TO anon;

-- Verify the table was created
SELECT 
    'user_interests table created successfully!' as message,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_interests';
