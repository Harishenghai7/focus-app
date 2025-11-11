-- Create Flashes table (plural)
CREATE TABLE flashes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  visibility TEXT DEFAULT 'followers' CHECK (visibility IN ('public', 'followers', 'private')),
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_archived BOOLEAN DEFAULT FALSE
);

ALTER TABLE flashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flashes visibility" ON flashes FOR SELECT USING (
  expires_at > NOW() AND is_archived = false AND (
    visibility = 'public' OR 
    user_id = auth.uid() OR 
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = flashes.user_id
    ))
  )
);

CREATE POLICY "Users can create flashes" ON flashes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashes" ON flashes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashes" ON flashes FOR DELETE USING (auth.uid() = user_id);