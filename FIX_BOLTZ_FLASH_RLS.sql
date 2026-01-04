-- ==============================================================================
-- FIX RLS POLICIES FOR BOLTZ AND FLASH TABLES
-- Run this script in your Supabase SQL Editor.
-- ==============================================================================

-- BOLTZ TABLE
ALTER TABLE public.boltz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view boltz" ON public.boltz;
DROP POLICY IF EXISTS "Users can create their own boltz" ON public.boltz;
DROP POLICY IF EXISTS "Users can update their own boltz" ON public.boltz;
DROP POLICY IF EXISTS "Users can delete their own boltz" ON public.boltz;

CREATE POLICY "Anyone can view boltz" ON public.boltz FOR SELECT USING (true);
CREATE POLICY "Users can create their own boltz" ON public.boltz FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boltz" ON public.boltz FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boltz" ON public.boltz FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boltz TO authenticated;
GRANT SELECT ON public.boltz TO anon;


-- FLASH TABLE
ALTER TABLE public.flash ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view flash" ON public.flash;
DROP POLICY IF EXISTS "Users can create their own flash" ON public.flash;
DROP POLICY IF EXISTS "Users can delete their own flash" ON public.flash;

CREATE POLICY "Anyone can view flash" ON public.flash FOR SELECT USING (true);
CREATE POLICY "Users can create their own flash" ON public.flash FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flash" ON public.flash FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flash TO authenticated;
GRANT SELECT ON public.flash TO anon;
