-- CLEAN DATABASE SETUP - Handles existing policies
-- Run this in your Supabase SQL Editor

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Storage policies for media bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create missing tables only
CREATE TABLE IF NOT EXISTS boltz (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flashes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Boltz are viewable by everyone" ON boltz;
DROP POLICY IF EXISTS "Authenticated users can insert boltz" ON boltz;
DROP POLICY IF EXISTS "Users can update own boltz" ON boltz;
DROP POLICY IF EXISTS "Users can delete own boltz" ON boltz;

DROP POLICY IF EXISTS "Flashes are viewable by everyone" ON flashes;
DROP POLICY IF EXISTS "Authenticated users can insert flashes" ON flashes;
DROP POLICY IF EXISTS "Users can update own flashes" ON flashes;
DROP POLICY IF EXISTS "Users can delete own flashes" ON flashes;

-- Create new policies
CREATE POLICY "Boltz are viewable by everyone" ON boltz FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert boltz" ON boltz FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boltz" ON boltz FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boltz" ON boltz FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Flashes are viewable by everyone" ON flashes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert flashes" ON flashes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashes" ON flashes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashes" ON flashes FOR DELETE USING (auth.uid() = user_id);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'likes' AND column_name = 'boltz_id') THEN
        ALTER TABLE likes ADD COLUMN boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'boltz_id') THEN
        ALTER TABLE comments ADD COLUMN boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_boltz_user_id ON boltz(user_id);
CREATE INDEX IF NOT EXISTS idx_boltz_created_at ON boltz(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashes_user_id ON flashes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashes_expires_at ON flashes(expires_at);
CREATE INDEX IF NOT EXISTS idx_likes_boltz_id ON likes(boltz_id);
CREATE INDEX IF NOT EXISTS idx_comments_boltz_id ON comments(boltz_id);

COMMIT;