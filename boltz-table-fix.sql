-- Ensure boltz table exists for video content
CREATE TABLE IF NOT EXISTS boltz (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  video_url TEXT,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Boltz are viewable by everyone" ON boltz FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can create boltz" ON boltz FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own boltz" ON boltz FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own boltz" ON boltz FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_boltz_user_id ON boltz(user_id);
CREATE INDEX IF NOT EXISTS idx_boltz_created_at ON boltz(created_at);

-- Update likes table to support boltz
ALTER TABLE likes ADD COLUMN IF NOT EXISTS boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE;

-- Update comments table to support boltz  
ALTER TABLE comments ADD COLUMN IF NOT EXISTS boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE;

-- Update notifications table to support boltz
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE;