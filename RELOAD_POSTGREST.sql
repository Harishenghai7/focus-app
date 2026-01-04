-- FORCE POSTGREST TO RELOAD (Alternative to Restart)
-- Run this in Supabase SQL Editor

-- This forces PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait 5 seconds, then test your app!
