-- Check what's blocking the insert NOW

-- 1. Check for triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

-- 2. Check for active locks
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    wait_event_type,
    wait_event
FROM pg_stat_activity 
WHERE datname = current_database()
AND state != 'idle'
ORDER BY query_start DESC;

-- 3. Kill any hanging queries (if needed)
-- SELECT pg_terminate_backend(pid) 
-- FROM pg_stat_activity 
-- WHERE datname = current_database() 
-- AND pid != pg_backend_pid()
-- AND state = 'active'
-- AND query LIKE '%messages%';
