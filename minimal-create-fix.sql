-- MINIMAL CREATE SYSTEM FIX

-- Create missing tables
CREATE TABLE IF NOT EXISTS public.boltz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  caption text,
  video_url text NOT NULL,
  thumbnail_path text,
  duration integer,
  created_at timestamptz DEFAULT now(),
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  visibility text DEFAULT 'public'
);

CREATE TABLE IF NOT EXISTS public.flash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hour'),
  visibility text DEFAULT 'public'
);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Public read access" ON boltz FOR SELECT USING (true);
CREATE POLICY "Users can insert own boltz" ON boltz FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access" ON flash FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can insert own flash" ON flash FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('posts', 'posts', true),
  ('boltz', 'boltz', true),
  ('flash', 'flash', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Own files delete" ON storage.objects FOR DELETE TO authenticated USING (true);

COMMIT;