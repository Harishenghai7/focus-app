-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔱 PART 1: ADD ALL COLUMNS FIRST
-- Run this FIRST, then run PART 2
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_step INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_metadata JSONB DEFAULT '{}'::jsonb;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('device_id', 'verification_step', 'verification_locked', 'ip_hash')
ORDER BY column_name;
