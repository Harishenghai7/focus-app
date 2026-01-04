-- EMERGENCY: Kill ONLY your own active connections to release locks
-- Run this to clear stuck queries

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid <> pg_backend_pid()
AND datname = current_database()
AND usename = current_user; -- Only kill processes belonging to the current user

-- Check for locks again (just for info)
SELECT 
    t.relname,
    l.locktype,
    l.mode,
    l.granted
FROM pg_locks l
JOIN pg_class t ON l.relation = t.oid
WHERE t.relname IN ('messages', 'conversations');
