-- Fix the status check constraint on calls table

-- Drop the old constraint
ALTER TABLE calls DROP CONSTRAINT IF EXISTS calls_status_check;

-- Add new constraint with correct values
ALTER TABLE calls ADD CONSTRAINT calls_status_check 
CHECK (status IN ('ringing', 'answered', 'rejected', 'ended', 'missed'));

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Status check constraint fixed!';
    RAISE NOTICE '📞 Calls will now work with status: ringing, answered, rejected, ended, missed';
END $$;
