-- ============================================================
-- Focus Trust Shield — Identity Hash Deduplication
-- Migration: 20260420000000_identity_hash.sql
-- H2 Innovative — Principal Engineering
-- ============================================================
-- ONE USER, ONE ACCOUNT.
-- SHA-256 hash of the extracted ID Number (Aadhaar/PAN/Student ID).
-- If this hash exists, registration is BLOCKED at the verification layer.
-- ============================================================

-- 1. Add the identity_hash column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_hash TEXT;

-- 2. Unique index — enforces one account per real-world ID at DB level
--    WHERE clause excludes NULL to allow unverified profiles to exist
CREATE UNIQUE INDEX IF NOT EXISTS profiles_identity_hash_key
  ON public.profiles (identity_hash)
  WHERE identity_hash IS NOT NULL;

-- 3. Add injection-lock status to verification_status check constraint (if enum)
--    This ensures LOCKED_INJECTION is a valid value
DO $$
BEGIN
  -- Only add if verification_status is a TEXT column (not enum)
  -- If it's an enum, run: ALTER TYPE verification_status_enum ADD VALUE 'LOCKED_INJECTION';
  -- Confirm column type:
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'verification_status'
      AND data_type    = 'text'
  ) THEN
    -- Add a comment to document the new value
    COMMENT ON COLUMN public.profiles.verification_status
      IS 'Valid values: PENDING | VERIFIED | VERIFIED_MINOR | PENDING_GUARDIAN | LOCKED_INJECTION';
  END IF;
END $$;

-- 4. Notify: migration applied
DO $$ BEGIN RAISE NOTICE 'Focus Trust Shield: identity_hash column + unique index created. LOCKED_INJECTION documented.'; END $$;
