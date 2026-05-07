CREATE TABLE IF NOT EXISTS content_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strike_number int NOT NULL CHECK (strike_number >= 1 AND strike_number <= 3),
  violation_type text NOT NULL,
  reason text NOT NULL,
  content_id uuid,
  content_type text NOT NULL DEFAULT 'post',
  content_snapshot text,
  action_taken text NOT NULL DEFAULT 'warning',
  shadow_ban_until timestamptz,
  gemini_explanation text,
  educational_acknowledged boolean DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_strikes_user_id ON content_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_strikes_created_at ON content_strikes(created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid,
  content_type text NOT NULL DEFAULT 'post',
  moderation_status text NOT NULL,
  moderation_reason text,
  moderation_score numeric(5,4),
  moderation_categories text[],
  purity_score numeric(5,4),
  toxicity_score numeric(5,4),
  profanity_score numeric(5,4),
  nsfw_score numeric(5,4),
  moderator_type text DEFAULT 'auto',
  raw_analysis jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_content_id ON moderation_logs(content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON moderation_logs(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'strike_count') THEN
    ALTER TABLE profiles ADD COLUMN strike_count int DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'account_status') THEN
    ALTER TABLE profiles ADD COLUMN account_status text DEFAULT 'ACTIVE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shadow_banned_until') THEN
    ALTER TABLE profiles ADD COLUMN shadow_banned_until timestamptz;
  END IF;
END $$;

ALTER TABLE content_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_strikes_select_own" ON content_strikes;
CREATE POLICY "content_strikes_select_own"
  ON content_strikes FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "moderation_logs_select_own" ON moderation_logs;
CREATE POLICY "moderation_logs_select_own"
  ON moderation_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "moderation_logs_insert_own" ON moderation_logs;
CREATE POLICY "moderation_logs_insert_own"
  ON moderation_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
