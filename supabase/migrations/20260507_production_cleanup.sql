-- ============================================================================
-- SOVEREIGN SCRUB: PRODUCTION DATA CLEANUP
-- ============================================================================
-- This script clears all test data while preserving the database architecture.
-- Run this in Supabase SQL Editor before production launch.
-- ============================================================================

-- CLEAR ALL TEST DATA BUT KEEP THE ARCHITECTURE
TRUNCATE TABLE public.posts, public.boltz, public.flash, public.interactions, public.reports, public.focusly_memory CASCADE;

-- RESET COUNTERS
UPDATE public.profiles SET strike_count = 0, is_restricted = false;

-- ADD THE FOUNDER'S FIRST PERMANENT MEMORY
-- REPLACE 'hariharun' WITH YOUR ACTUAL USERNAME
INSERT INTO public.focusly_memory (user_id, memory_type, content, importance_score)
SELECT id, 'milestone', 'The Nation was officially born. May 8, 2026.', 5
FROM public.profiles WHERE username = 'hariharun'; -- Replace with your actual handle
