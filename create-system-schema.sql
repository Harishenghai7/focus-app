-- CREATE SYSTEM DATABASE SCHEMA

-- Update posts table for new structure
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS save_count integer DEFAULT 0;

-- Create boltz table
CREATE TABLE IF NOT EXISTS public.boltz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  caption text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer,
  created_at timestamptz DEFAULT now(),
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'))
);

-- Create flash table
CREATE TABLE IF NOT EXISTS public.flash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  caption text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz GENERATED ALWAYS AS (created_at + interval '24 hour') STORED,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private'))
);

-- Enable RLS
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;

-- RLS Policies for boltz
CREATE POLICY "Boltz visible to auth users" ON boltz FOR SELECT TO authenticated
USING (
  visibility = 'public'
  OR user_id = auth.uid()
  OR (
    visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows f
      WHERE f.follower_id = auth.uid() AND f.following_id = boltz.user_id
    )
  )
);

CREATE POLICY "Users can insert own boltz" ON boltz FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boltz" ON boltz FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own boltz" ON boltz FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for flash
CREATE POLICY "Flash visible to auth users" ON flash FOR SELECT TO authenticated
USING (
  expires_at > now() AND (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (
      visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = flash.user_id
      )
    )
  )
);

CREATE POLICY "Users can insert own flash" ON flash FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flash" ON flash FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flash" ON flash FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_boltz_user_created ON boltz(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boltz_visibility ON boltz(visibility);
CREATE INDEX IF NOT EXISTS idx_flash_user_created ON flash(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flash_expires ON flash(expires_at);

-- Function to clean expired flash content
CREATE OR REPLACE FUNCTION cleanup_expired_flash()
RETURNS void AS $$
BEGIN
  DELETE FROM flash WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for counter updates
CREATE OR REPLACE FUNCTION update_boltz_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE boltz SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE boltz SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'likes' THEN
      UPDATE boltz SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
      UPDATE boltz SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

COMMIT;