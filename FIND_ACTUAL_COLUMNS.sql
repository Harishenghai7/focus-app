-- FIND ACTUAL COLUMN NAMES
-- Run this in Supabase SQL Editor to see the REAL column names

-- ============================================
-- CHECK FLASH TABLE COLUMNS
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'flash'
ORDER BY ordinal_position;

-- ============================================
-- CHECK MESSAGES TABLE COLUMNS
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- This will show you the ACTUAL column names!
-- Look for columns related to:
-- - media/video/image path
-- - media/video/image type
-- - message content/text/body

-- Copy the EXACT column names and send them to me!
