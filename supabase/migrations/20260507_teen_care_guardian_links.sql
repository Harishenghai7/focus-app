-- Teen Care (Guardian/Ward) - Guardian Links + Teen Safety Profiles

CREATE TABLE IF NOT EXISTS guardian_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ward_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pairing_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'linked', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  linked_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(pairing_code)
);

CREATE INDEX IF NOT EXISTS idx_guardian_links_pairing_code ON guardian_links(pairing_code);
CREATE INDEX IF NOT EXISTS idx_guardian_links_guardian ON guardian_links(guardian_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_ward ON guardian_links(ward_id);
CREATE INDEX IF NOT EXISTS idx_guardian_links_status ON guardian_links(status);

CREATE TABLE IF NOT EXISTS teen_safety_profiles (
  ward_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  dm_restricted BOOLEAN NOT NULL DEFAULT true,
  night_lock_enabled BOOLEAN NOT NULL DEFAULT true,
  ghost_mode_enabled BOOLEAN NOT NULL DEFAULT true,
  night_lock_start TIME NOT NULL DEFAULT '22:00',
  night_lock_end TIME NOT NULL DEFAULT '06:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teen_safety_profiles_dm_restricted ON teen_safety_profiles(dm_restricted);

ALTER TABLE guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_safety_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardian_links_select" ON guardian_links;
CREATE POLICY "guardian_links_select"
  ON guardian_links FOR SELECT
  USING (
    guardian_id = auth.uid() OR ward_id = auth.uid()
  );

DROP POLICY IF EXISTS "guardian_links_insert" ON guardian_links;
CREATE POLICY "guardian_links_insert"
  ON guardian_links FOR INSERT
  WITH CHECK (ward_id = auth.uid());

DROP POLICY IF EXISTS "guardian_links_update" ON guardian_links;
CREATE POLICY "guardian_links_update"
  ON guardian_links FOR UPDATE
  USING (guardian_id = auth.uid() OR ward_id = auth.uid());

DROP POLICY IF EXISTS "teen_safety_profiles_select" ON teen_safety_profiles;
CREATE POLICY "teen_safety_profiles_select"
  ON teen_safety_profiles FOR SELECT
  USING (ward_id = auth.uid());

DROP POLICY IF EXISTS "teen_safety_profiles_upsert" ON teen_safety_profiles;
CREATE POLICY "teen_safety_profiles_upsert"
  ON teen_safety_profiles FOR ALL
  USING (ward_id = auth.uid())
  WITH CHECK (ward_id = auth.uid());

CREATE OR REPLACE FUNCTION focus_calculate_age(dob DATE)
RETURNS INTEGER AS $$
DECLARE
  years INTEGER;
BEGIN
  IF dob IS NULL THEN
    RETURN NULL;
  END IF;
  years := EXTRACT(YEAR FROM age(dob));
  RETURN years;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION focus_is_trust_shield_verified(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  status TEXT;
BEGIN
  SELECT COALESCE(verification_status, trust_shield_status, focus_trust_status) INTO status
  FROM profiles
  WHERE id = p_user_id;

  status := UPPER(COALESCE(status, ''));

  RETURN status = 'VERIFIED';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION focus_is_teen(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  dob DATE;
  a INTEGER;
BEGIN
  SELECT date_of_birth::date INTO dob
  FROM profiles
  WHERE id = p_user_id;

  a := focus_calculate_age(dob);
  RETURN a IS NOT NULL AND a < 18;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION focus_is_mutual_follow(p_user1 UUID, p_user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_user1 AND following_id = p_user2
  ) AND EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = p_user2 AND following_id = p_user1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_link_code()
RETURNS TABLE(pairing_code TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
  code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  LOOP
    code := UPPER(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM guardian_links gl WHERE gl.pairing_code = code AND gl.status = 'pending');
  END LOOP;

  expires_at := NOW() + interval '10 minutes';

  INSERT INTO guardian_links (ward_id, pairing_code, status, expires_at)
  VALUES (auth.uid(), code, 'pending', expires_at);

  pairing_code := code;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_link_code(p_pairing_code TEXT)
RETURNS UUID AS $$
DECLARE
  link_row guardian_links%ROWTYPE;
  guardian UUID;
BEGIN
  guardian := auth.uid();
  IF guardian IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  IF NOT focus_is_trust_shield_verified(guardian) THEN
    RAISE EXCEPTION 'TRUST_SHIELD_REQUIRED';
  END IF;

  SELECT * INTO link_row
  FROM guardian_links
  WHERE pairing_code = UPPER(TRIM(p_pairing_code))
    AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;

  IF link_row.expires_at < NOW() THEN
    UPDATE guardian_links SET status = 'expired' WHERE id = link_row.id;
    RAISE EXCEPTION 'CODE_EXPIRED';
  END IF;

  UPDATE guardian_links
  SET guardian_id = guardian,
      status = 'linked',
      linked_at = NOW()
  WHERE id = link_row.id;

  INSERT INTO teen_safety_profiles (ward_id)
  VALUES (link_row.ward_id)
  ON CONFLICT (ward_id) DO UPDATE
    SET updated_at = NOW();

  UPDATE profiles
  SET guardian_approved = true
  WHERE id = link_row.ward_id;

  RETURN link_row.ward_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  restricted BOOLEAN;
BEGIN
  restricted := false;

  IF focus_is_teen(user1_id) OR focus_is_teen(user2_id) THEN
    restricted := true;
  END IF;

  IF restricted THEN
    IF EXISTS (SELECT 1 FROM teen_safety_profiles WHERE ward_id IN (user1_id, user2_id) AND dm_restricted = true) THEN
      IF NOT focus_is_mutual_follow(user1_id, user2_id) THEN
        RAISE EXCEPTION 'DM_RESTRICTED_MUTUAL_ONLY';
      END IF;
    END IF;
  END IF;

  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  INNER JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  INNER JOIN conversations c
    ON c.id = cp1.conversation_id
  WHERE cp1.user_id = user1_id
    AND cp2.user_id = user2_id
    AND c.type = 'direct'
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (type, created_at)
    VALUES ('direct', NOW())
    RETURNING id INTO conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
