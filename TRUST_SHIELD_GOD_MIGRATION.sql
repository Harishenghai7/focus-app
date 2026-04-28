-- ═══════════════════════════════════════════════════════════════════════════
-- 🏛️ TRUST SHIELD GOD-LEVEL SQL MIGRATION
-- Focus Platform — Sovereign Identity Law
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Add sovereign_identity_hash to profiles (safe, no-op if exists) ─────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sovereign_identity_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_step INT DEFAULT 1;

-- Unique index: One hash = One account. Period.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_sovereign_hash
  ON profiles(sovereign_identity_hash)
  WHERE sovereign_identity_hash IS NOT NULL;

-- Index for fast step lookup during session restore
CREATE INDEX IF NOT EXISTS idx_profiles_verification_step
  ON profiles(id, verification_step);

-- ── 2. verify_unique_identity RPC ─────────────────────────────────────────
-- Called from the frontend with the SHA-256 sovereign hash.
-- Returns JSON { unique: true } or { unique: false, message, redirect }.
-- SECURITY DEFINER: runs as DB owner, bypasses RLS.

CREATE OR REPLACE FUNCTION verify_unique_identity(
  p_hash    TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_id   UUID;
  existing_name TEXT;
BEGIN
  -- Null/empty check
  IF p_hash IS NULL OR length(trim(p_hash)) < 10 THEN
    RETURN json_build_object(
      'unique', false,
      'message', 'Invalid identity hash — cannot verify.',
      'redirect', '/auth'
    );
  END IF;

  -- Check for existing account with same hash (excluding current user)
  SELECT id, full_name
    INTO existing_id, existing_name
    FROM profiles
   WHERE sovereign_identity_hash = p_hash
     AND (p_user_id IS NULL OR id <> p_user_id)
   LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'unique',    false,
      'message',   'Identity already linked to another account. You cannot create multiple accounts on Focus.',
      'redirect',  '/auth',
      'collision', true
    );
  END IF;

  -- All clear
  RETURN json_build_object('unique', true);
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION verify_unique_identity(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_unique_identity(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_unique_identity(TEXT, UUID) TO anon;

-- ── 3. update_sovereign_hash RPC ─────────────────────────────────────────
-- Called after successful verification to store the hash on the profile.

CREATE OR REPLACE FUNCTION update_sovereign_hash(
  p_user_id UUID,
  p_hash    TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure caller is the profile owner
  IF auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE profiles
     SET sovereign_identity_hash = p_hash,
         updated_at = NOW()
   WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION update_sovereign_hash(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_sovereign_hash(UUID, TEXT) TO authenticated;

-- ── 4. sync_verification_step RPC ─────────────────────────────────────────
-- Called on every step transition to persist step to DB.

CREATE OR REPLACE FUNCTION sync_verification_step(
  p_user_id UUID,
  p_step    INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE profiles
     SET verification_step = p_step,
         updated_at = NOW()
   WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'step', p_step);
END;
$$;

REVOKE ALL ON FUNCTION sync_verification_step(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sync_verification_step(UUID, INT) TO authenticated;

-- ── 5. RLS Policy: profiles can read their own verification_step ──────────
-- (profiles table RLS should already be enabled — this just adds the column policy)
-- If RLS is disabled on profiles, skip this section.

-- Allow users to update their own sovereign hash and step
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can update own sovereign fields'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Users can update own sovereign fields"
        ON profiles FOR UPDATE
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    $pol$;
  END IF;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- ✅ MIGRATION COMPLETE
-- One Person. One Hash. One Account. This is the Law.
-- ══════════════════════════════════════════════════════════════════════════
