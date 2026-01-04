-- Focus Badge System Database Schema
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Badge Definitions Table
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  criteria JSONB NOT NULL,
  is_manual BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  date_awarded TIMESTAMPTZ DEFAULT NOW(),
  date_revoked TIMESTAMPTZ,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  admin_notes TEXT,
  UNIQUE(user_id, badge_id)
);

-- Badge Applications Table
CREATE TABLE IF NOT EXISTS badge_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badge_definitions(id) ON DELETE CASCADE,
  application_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Badge Audit Log Table
CREATE TABLE IF NOT EXISTS badge_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID REFERENCES badge_definitions(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_status ON user_badges(status);
CREATE INDEX IF NOT EXISTS idx_badge_applications_user_id ON badge_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_applications_status ON badge_applications(status);
CREATE INDEX IF NOT EXISTS idx_badge_audit_log_user_id ON badge_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_audit_log_timestamp ON badge_audit_log(timestamp);

-- Enable Row Level Security
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badge_definitions (public read)
CREATE POLICY "Badge definitions are viewable by everyone"
  ON badge_definitions FOR SELECT
  USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id OR visibility = 'public');

CREATE POLICY "Users can update their badge visibility"
  ON user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for badge_applications
CREATE POLICY "Users can view their own applications"
  ON badge_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON badge_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for badge_audit_log (read-only for users)
CREATE POLICY "Users can view audit logs for their badges"
  ON badge_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Seed initial badge definitions
INSERT INTO badge_definitions (name, description, icon, color, criteria, is_manual, sort_order) VALUES
  ('verified', 'Verified authentic account', 'FaCheckCircle', '#1DA1F2', '{"type": "manual", "requires_application": true}', true, 1),
  ('trusted_user', 'Trusted community member', 'FaShieldAlt', '#22c55e', '{"trust_score_min": 80, "days_maintained": 30, "account_age_days": 90, "no_violations": true}', false, 2),
  ('creator', 'Content creator', 'FaStar', '#a855f7', '{"followers_min": 1000, "posts_min": 50, "engagement_rate_min": 0.05}', false, 3),
  ('early_adopter', 'Early adopter', 'FaBolt', '#f59e0b', '{"account_created_before": "2025-03-01", "verified": true}', false, 4),
  ('community_guardian', 'Community guardian', 'FaShield', '#94a3b8', '{"accurate_reports_min": 100, "moderation_score_min": 90}', true, 5),
  ('oauth_linked', 'Social accounts linked', 'FaLink', '#3b82f6', '{"oauth_providers_min": 2}', false, 6),
  ('biometric_verified', 'Biometric verification enabled', 'FaFingerprint', '#8b5cf6', '{"biometric_enabled": true}', false, 7),
  ('milestone_100_posts', '100 Posts milestone', 'FaFire', '#ef4444', '{"posts_count": 100}', false, 8),
  ('helpful', 'Helpful community member', 'FaHeart', '#ec4899', '{"helpful_votes_min": 50}', false, 9),
  ('trendsetter', 'Trendsetter', 'FaTrendingUp', '#06b6d4', '{"trending_posts_count": 5}', false, 10)
ON CONFLICT (name) DO NOTHING;
