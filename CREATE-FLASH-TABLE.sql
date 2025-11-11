-- Create Flash table
CREATE TABLE flash (
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

-- Flash views tracking
CREATE TABLE flash_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_id, viewer_id)
);

-- Enable RLS
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Flash visibility" ON flash FOR SELECT USING (
  expires_at > NOW() AND is_archived = false AND (
    visibility = 'public' OR 
    user_id = auth.uid() OR 
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = flash.user_id
    ))
  )
);

CREATE POLICY "Users can create flash" ON flash FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flash" ON flash FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flash" ON flash FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view flash views" ON flash_views FOR SELECT USING (
  viewer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM flash WHERE flash.id = flash_views.flash_id AND flash.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert flash views" ON flash_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);