-- CHECK FLASH TABLE COLUMNS
-- Run this in Supabase SQL Editor

-- See actual column names
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'flash'
ORDER BY ordinal_position;

-- This will show you the REAL column names!
