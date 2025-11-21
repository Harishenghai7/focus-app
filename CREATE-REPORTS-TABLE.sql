-- Create reports table for content and user reporting
-- This table stores all reports submitted by users

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_type VARCHAR(50) NOT NULL, -- 'post', 'user', 'comment', 'message', 'boltz'
  reported_id UUID NOT NULL, -- ID of the reported content
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Owner of the reported content
  reason VARCHAR(100) NOT NULL, -- 'spam', 'harassment', 'hate_speech', etc.
  details TEXT, -- Additional context provided by reporter
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'under_review', 'resolved', 'dismissed'
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin who reviewed
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT, -- Notes from moderator
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(reported_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at DESC);

-- Add RLS policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own submitted reports
CREATE POLICY reports_select_own ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can insert their own reports
CREATE POLICY reports_insert_own ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins/moderators can view all reports (handled via service role)
-- Only admins/moderators can update reports (handled via service role)

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();

-- Add comments
COMMENT ON TABLE reports IS 'Stores user reports for content moderation';
COMMENT ON COLUMN reports.reporter_id IS 'User who submitted the report';
COMMENT ON COLUMN reports.reported_type IS 'Type of content being reported';
COMMENT ON COLUMN reports.reported_id IS 'ID of the reported content';
COMMENT ON COLUMN reports.reported_user_id IS 'Owner of the reported content';
COMMENT ON COLUMN reports.reason IS 'Primary reason for the report';
COMMENT ON COLUMN reports.details IS 'Additional context from reporter';
COMMENT ON COLUMN reports.status IS 'Current status of the report';
