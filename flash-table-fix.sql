-- FLASH TABLE FIX

CREATE TABLE IF NOT EXISTS public.flash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hour')
);

ALTER TABLE flash ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Flash read policy" ON flash;
CREATE POLICY "Flash read policy" ON flash FOR SELECT USING (true);

DROP POLICY IF EXISTS "Flash insert policy" ON flash;
CREATE POLICY "Flash insert policy" ON flash FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;