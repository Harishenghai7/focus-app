-- Check RLS policies on messages table
SELECT * FROM pg_policies WHERE tablename = 'messages';
