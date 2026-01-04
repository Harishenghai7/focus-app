-- ============================================
-- FOCUS APP - REPORT & SUPPORT SYSTEM SCHEMA
-- Complete moderation and support ticket system
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENHANCED REPORTS TABLE
-- ============================================
DROP TABLE IF EXISTS reports CASCADE;

CREATE TABLE reports (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_id UUID,
  content_type VARCHAR(50), -- 'post', 'boltz', 'flash', 'comment', 'message', 'profile'
  category VARCHAR(50) NOT NULL, -- 'fake_account', 'harassment', 'spam', 'violence', 'nsfw', 'false_info', etc.
  description TEXT,
  evidence_urls TEXT[], -- Screenshots/proof
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  admin_action VARCHAR(50), -- 'warning', 'content_removed', 'suspended', 'banned', etc.
  admin_notes TEXT,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- 'FS-12345'
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
 category VARCHAR(50) NOT NULL, -- 'account', 'bug', 'feature_request', 'privacy', 'billing', 'general'
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[], -- File URLs
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin assigned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. SUPPORT TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[],
  is_admin BOOLEAN DEFAULT FALSE, -- TRUE if sent by admin
  is_internal_note BOOLEAN DEFAULT FALSE, -- TRUE if note only visible to admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. CONTENT MODERATION QUEUE TABLE
-- ============================================
CREATE TABLE content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'post', 'boltz', 'comment', etc.
  flags JSONB DEFAULT '[]', -- Array of detected flags: ['hate_speech', 'spam', etc.]
  confidence_score FLOAT DEFAULT 0, -- 0.0 to 1.0
  auto_action_taken VARCHAR(50), -- 'hidden', 'flagged', 'none'
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. REPORT STATISTICS TABLE (For Analytics)
-- ============================================
CREATE TABLE report_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_reports INTEGER DEFAULT 0,
  pending_reports INTEGER DEFAULT 0,
  resolved_reports INTEGER DEFAULT 0,
  dismissed_reports INTEGER DEFAULT 0,
  fake_account_reports INTEGER DEFAULT 0,
  harassment_reports INTEGER DEFAULT 0,
  spam_reports INTEGER DEFAULT 0,
  violence_reports INTEGER DEFAULT 0 nsfw_reports INTEGER DEFAULT 0,
  other_reports INTEGER DEFAULT 0,
  avg_resolution_hours FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Reports indexes
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_status_priority ON reports(status, priority);

-- Support tickets indexes
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_ticket_number ON support_tickets(ticket_number);

-- Support messages indexes
CREATE INDEX idx_support_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX idx_support_messages_created_at ON support_ticket_messages(created_at);

-- Moderation queue indexes
CREATE INDEX idx_moderation_queue_content_id ON content_moderation_queue(content_id);
CREATE INDEX idx_moderation_queue_reviewed ON content_moderation_queue(reviewed);
CREATE INDEX idx_moderation_queue_created_at ON content_moderation_queue(created_at DESC);

-- Statistics index
CREATE INDEX idx_report_stats_date ON report_statistics(date DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to generate ticket numbers (FS-10001, FS-10002, etc.)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  ticket_num TEXT;
BEGIN
  -- Get the latest ticket number
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 10000) + 1
  INTO next_num
  FROM support_tickets;
  
  ticket_num := 'FS-' || next_num::TEXT;
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_number();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to update daily statistics
CREATE OR REPLACE FUNCTION update_daily_report_statistics()
RETURNS VOID AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Upsert today's statistics
  INSERT INTO report_statistics (
    date,
    total_reports,
    pending_reports,
    resolved_reports,
    dismissed_reports,
    fake_account_reports,
    harassment_reports,
    spam_reports,
    violence_reports,
    nsfw_reports,
    other_reports,
    avg_resolution_hours
  )
  SELECT
    today,
    COUNT(*) FILTER (WHERE created_at::date = today),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_at::date = today),
    COUNT(*) FILTER (WHERE status = 'dismissed' AND resolved_at::date = today),
    COUNT(*) FILTER (WHERE category = 'fake_account' AND created_at::date = today),
    COUNT(*) FILTER (WHERE category = 'harassment' AND created_at::date = today),
    COUNT(*) FILTER (WHERE category = 'spam' AND created_at::date = today),
    COUNT(*) FILTER (WHERE category IN ('violence', 'dangerous_content') AND created_at::date = today),
    COUNT(*) FILTER (WHERE category IN ('nsfw', 'nudity') AND created_at::date = today),
    COUNT(*) FILTER (WHERE category = 'other' AND created_at::date = today),
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at::date = today)
  FROM reports
  ON CONFLICT (date)
  DO UPDATE SET
    total_reports = EXCLUDED.total_reports,
    pending_reports = EXCLUDED.pending_reports,
    resolved_reports = EXCLUDED.resolved_reports,
    dismissed_reports = EXCLUDED.dismissed_reports,
    fake_account_reports = EXCLUDED.fake_account_reports,
    harassment_reports = EXCLUDED.harassment_reports,
    spam_reports = EXCLUDED.spam_reports,
    violence_reports = EXCLUDED.violence_reports,
    nsfw_reports = EXCLUDED.nsfw_reports,
    other_reports = EXCLUDED.other_reports,
    avg_resolution_hours = EXCLUDED.avg_resolution_hours;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_statistics ENABLE ROW LEVEL SECURITY;

-- Reports RLS Policies
DROP POLICY IF EXISTS "Users can view own submitted reports" ON reports;
CREATE POLICY "Users can view own submitted reports" ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Support Tickets RLS Policies
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets" ON support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets" ON support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support Messages RLS Policies
DROP POLICY IF EXISTS "Users can view messages in own tickets" ON support_ticket_messages;
CREATE POLICY "Users can view messages in own tickets" ON support_ticket_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own tickets" ON support_ticket_messages;
CREATE POLICY "Users can send messages in own tickets" ON support_ticket_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

-- Moderation Queue - Admin only (via service role)
-- Statistics - Public read
DROP POLICY IF EXISTS "Anyone can view report statistics" ON report_statistics;
CREATE POLICY "Anyone can view report statistics" ON report_statistics
  FOR SELECT
  USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE reports IS 'User-submitted reports for content moderation';
COMMENT ON TABLE support_tickets IS 'Support ticket system for user assistance';
COMMENT ON TABLE support_ticket_messages IS 'Conversation thread for support tickets';
COMMENT ON TABLE content_moderation_queue IS 'Auto-flagged content from AI moderation';
COMMENT ON TABLE report_statistics IS 'Daily aggregated report metrics for analytics';

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert initial statistics row for today
INSERT INTO report_statistics (date)
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN
  RAISE NOTICE 'Report & Support System database schema created successfully!';
  RAISE NOTICE 'Tables: reports, support_tickets, support_ticket_messages, content_moderation_queue, report_statistics';
  RAISE NOTICE 'Next steps: Create React hooks and components';
END $$;
