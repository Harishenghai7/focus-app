-- blocked_content
CREATE TABLE IF NOT EXISTS blocked_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  content_id UUID,
  type VARCHAR(50), -- 'post', 'comment', 'boltz', etc.
  reason VARCHAR(100),
  toxic_score NUMERIC,
  nsfw_score NUMERIC,
  block_type VARCHAR(10), -- 'soft', 'hard', 'shadow'
  status VARCHAR(20) DEFAULT 'blocked', -- 'blocked', 'appealed', 'approved'
  admin_action VARCHAR(30),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- appeals
CREATE TABLE IF NOT EXISTS content_appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocked_content_id UUID REFERENCES blocked_content(id),
  user_id UUID REFERENCES users(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  admin_id UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies (Basic examples, refine as needed)
ALTER TABLE blocked_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_appeals ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view all blocked content" ON blocked_content
  FOR SELECT USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can view their own blocked content
CREATE POLICY "Users can view own blocked content" ON blocked_content
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can update blocked content
CREATE POLICY "Admins can update blocked content" ON blocked_content
  FOR UPDATE USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can insert appeals
CREATE POLICY "Users can create appeals" ON content_appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON content_appeals
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view/update all appeals
CREATE POLICY "Admins can view all appeals" ON content_appeals
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
