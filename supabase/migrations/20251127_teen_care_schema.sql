-- =====================================================
-- FOCUS TEEN CARE SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Migration: Teen Care Parental Control System
-- Date: 2025-11-27
-- Description: Complete database schema for guardian relationships,
--              screen time management, safety alerts, activity logging,
--              age verification, and emergency features
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: age_verification
-- Purpose: Store age verification and account type info
-- =====================================================
CREATE TABLE IF NOT EXISTS age_verification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  age_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_method VARCHAR(50) DEFAULT 'self_reported', 
  -- 'self_reported', 'id_upload', 'parent_verified'
  
  is_coppa_mode BOOLEAN DEFAULT false, -- Under-13
  is_teen_mode BOOLEAN DEFAULT false,  -- 13-17
  is_adult BOOLEAN DEFAULT false,      -- 18+
  
  account_activated BOOLEAN DEFAULT false,
  requires_guardian BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: guardian_relationships
-- Purpose: Link guardians (parents) to teens
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  teen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  relationship_type VARCHAR(20) DEFAULT 'parent', 
  -- 'parent', 'guardian', 'trusted_adult'
  
  status VARCHAR(20) DEFAULT 'pending', 
  -- 'pending', 'active', 'revoked', 'expired'
  
  -- What parent can see/control (stored as JSONB for flexibility)
  permissions JSONB DEFAULT '{
    "view_activity": true,
    "view_content_summary": true,
    "view_messages": false,
    "set_screen_time": true,
    "set_content_filters": true,
    "set_contact_restrictions": true,
    "receive_safety_alerts": true,
    "emergency_override": true
  }'::jsonb,
  
  -- Invitation tracking
  invitation_code VARCHAR(100) UNIQUE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,
  
  -- Constraints
  UNIQUE(parent_id, teen_id),
  CHECK (parent_id != teen_id)
);

-- =====================================================
-- TABLE: screen_time_limits
-- Purpose: Store screen time restrictions per teen
-- =====================================================
CREATE TABLE IF NOT EXISTS screen_time_limits (
  teen_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  daily_limit_minutes INTEGER DEFAULT 120, -- e.g., 2 hours
  weekly_limit_minutes INTEGER,
  
  -- Time blocks when app is locked (stored as JSONB array)
  -- Example: [{"start": "22:00", "end": "07:00", "days": ["mon","tue","wed","thu","fri"]}]
  time_blocks JSONB DEFAULT '[]'::jsonb,
  
  -- Day-specific limits
  weekday_limit_minutes INTEGER,
  weekend_limit_minutes INTEGER,
  
  -- Grace period before lockout (minutes)
  grace_period_minutes INTEGER DEFAULT 15,
  
  -- Is screen time enforcement enabled?
  enabled BOOLEAN DEFAULT true,
  
  -- Who set these limits
  created_by UUID REFERENCES auth.users(id), -- Guardian who created
  updated_by UUID REFERENCES auth.users(id), -- Last guardian who updated
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: screen_time_usage
-- Purpose: Track daily screen time usage
-- =====================================================
CREATE TABLE IF NOT EXISTS screen_time_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_used INTEGER DEFAULT 0,
  
  -- Session tracking
  session_start TIMESTAMP WITH TIME ZONE,
  session_end TIMESTAMP WITH TIME ZONE,
  
  -- Is user currently locked out?
  is_locked_out BOOLEAN DEFAULT false,
  lockout_started_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, usage_date)
);

-- =====================================================
-- TABLE: safety_alerts
-- Purpose: Log safety issues detected by AI/patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS safety_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  teen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  alert_type VARCHAR(50) NOT NULL, 
  -- 'cyberbullying', 'nsfw_exposure', 'adult_stranger_contact',
  -- 'mental_health_concern', 'personal_info_shared', 'location_sharing',
  -- 'grooming_pattern', 'self_harm', 'eating_disorder', 'meetup_planned'
  
  severity VARCHAR(20) DEFAULT 'medium', 
  -- 'low', 'medium', 'high', 'critical'
  
  title VARCHAR(200),
  description TEXT,
  
  -- Related content/user that triggered alert
  related_content_id UUID, -- Post, message, comment ID
  related_content_type VARCHAR(50), -- 'post', 'message', 'comment', 'dm'
  related_user_id UUID REFERENCES auth.users(id), -- Who triggered it
  
  -- AI analysis data
  ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_analysis_data JSONB, -- Raw AI response
  
  -- Alert status
  status VARCHAR(20) DEFAULT 'new', 
  -- 'new', 'notified', 'reviewed', 'resolved', 'false_positive'
  
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  notification_method VARCHAR(20), -- 'push', 'email', 'sms', 'in_app'
  
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast queries
  INDEX idx_safety_alerts_teen (teen_id, status, created_at DESC),
  INDEX idx_safety_alerts_parent (parent_id, status, severity, created_at DESC)
);

-- =====================================================
-- TABLE: teen_activity_logs
-- Purpose: Track teen activity for dashboard summary
-- =====================================================
CREATE TABLE IF NOT EXISTS teen_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(50) NOT NULL,
  -- 'post_created', 'post_deleted', 'followed_user', 'unfollowed_user',
  -- 'new_follower', 'content_reported', 'account_blocked', 'message_sent',
  -- 'profile_updated', 'location_shared'
  
  -- Activity details (flexible JSONB)
  details JSONB DEFAULT '{}'::jsonb,
  -- Example for 'followed_user': {"user_id": "uuid", "username": "john_doe"}
  -- Example for 'post_created': {"post_id": "uuid", "media_count": 3}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for dashboard queries
  INDEX idx_activity_teen_date (teen_id, created_at DESC),
  INDEX idx_activity_type (teen_id, activity_type, created_at DESC)
);

-- =====================================================
-- TABLE: emergency_contacts
-- Purpose: Trusted adults for emergency situations
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  contact_type VARCHAR(20) DEFAULT 'trusted_adult',
  -- 'trusted_adult', 'guardian', 'counselor', 'family_member'
  
  -- Contact can be a Focus user or external
  contact_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  relationship VARCHAR(50), -- 'parent', 'teacher', 'counselor', 'friend_parent'
  
  -- Always accessible even during lockout
  bypass_restrictions BOOLEAN DEFAULT true,
  
  priority_order INTEGER DEFAULT 1, -- 1 = primary, 2 = secondary, 3 = tertiary
  
  verified BOOLEAN DEFAULT false,
  verification_sent_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Limit to 3 emergency contacts per user
  CHECK (priority_order BETWEEN 1 AND 3),
  UNIQUE(user_id, priority_order)
);

-- =====================================================
-- TABLE: content_filter_settings
-- Purpose: Teen-specific content filter configurations
-- =====================================================
CREATE TABLE IF NOT EXISTS content_filter_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Filter levels
  nsfw_filter_enabled BOOLEAN DEFAULT true,
  violence_filter_enabled BOOLEAN DEFAULT true,
  profanity_filter_enabled BOOLEAN DEFAULT true,
  
  -- Comment filtering
  hide_offensive_comments BOOLEAN DEFAULT true,
  require_comment_approval BOOLEAN DEFAULT false,
  
  -- Content restrictions
  block_stranger_posts BOOLEAN DEFAULT false,
  hide_sensitive_content BOOLEAN DEFAULT true,
  
  -- Download prevention
  prevent_download BOOLEAN DEFAULT true, -- Others can't download teen's content
  
  -- Who can see teen's content
  content_visibility VARCHAR(20) DEFAULT 'followers_only',
  -- 'public', 'followers_only', 'approved_only', 'private'
  
  -- Managed by
  managed_by_guardian BOOLEAN DEFAULT false,
  guardian_locked BOOLEAN DEFAULT false, -- Teen can't change if true
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: contact_restrictions
-- Purpose: Who can contact/interact with teen
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_restrictions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message restrictions
  allow_messages_from VARCHAR(20) DEFAULT 'followers_only',
  -- 'everyone', 'followers_only', 'approved_contacts', 'no_one'
  
  -- Comment restrictions
  allow_comments_from VARCHAR(20) DEFAULT 'followers_only',
  -- 'everyone', 'followers_only', 'off'
  
  -- Mention/tag restrictions
  allow_mentions_from VARCHAR(20) DEFAULT 'followers_only',
  require_mention_approval BOOLEAN DEFAULT false,
  
  -- Group chat restrictions
  allow_group_invites BOOLEAN DEFAULT false,
  require_group_approval BOOLEAN DEFAULT true,
  
  -- Stranger blocking
  block_adult_strangers BOOLEAN DEFAULT true, -- Auto-block adults (25+) who aren't followers
  alert_on_stranger_message BOOLEAN DEFAULT true,
  
  -- Approved contacts list (JSONB array of user IDs)
  approved_contacts JSONB DEFAULT '[]'::jsonb,
  blocked_contacts JSONB DEFAULT '[]'::jsonb,
  
  -- Managed by
  managed_by_guardian BOOLEAN DEFAULT false,
  guardian_locked BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: panic_button_logs
-- Purpose: Track emergency panic button usage
-- =====================================================
CREATE TABLE IF NOT EXISTS panic_button_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Location data (if shared)
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_accuracy DECIMAL(10, 2), -- meters
  
  -- Context
  reason TEXT,
  emergency_type VARCHAR(50), -- 'danger', 'harassment', 'need_help', 'other'
  
  -- Notifications sent
  guardians_notified UUID[] DEFAULT ARRAY[]::UUID[],
  emergency_contacts_notified UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Response tracking
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: weekly_reports
-- Purpose: Generated weekly safety reports for guardians
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  teen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Aggregated data (stored as JSONB for flexibility)
  report_data JSONB DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "total_time_spent_minutes": 840,
  --   "posts_created": 5,
  --   "new_followers": 12,
  --   "followed_users": 8,
  --   "safety_alerts": {"high": 1, "medium": 3, "low": 5},
  --   "blocked_accounts": 2,
  --   "content_reported": 1
  -- }
  
  -- Generated report (HTML/Markdown)
  report_html TEXT,
  report_markdown TEXT,
  
  -- Email delivery
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_opened BOOLEAN DEFAULT false,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(teen_id, parent_id, week_start_date)
);

-- =====================================================
-- TABLE: consent_log
-- Purpose: Track all consent actions for compliance
-- =====================================================
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  consent_type VARCHAR(50) NOT NULL,
  -- 'coppa', 'guardian_linking', 'privacy_policy', 'terms_of_service',
  -- 'data_processing', 'age_verification'
  
  consented_by UUID REFERENCES auth.users(id), -- Guardian user ID if applicable
  consent_given BOOLEAN NOT NULL,
  
  -- Audit trail
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(20), -- Version of policy/terms they consented to
  
  consent_text TEXT, -- The actual text they agreed to
  consent_metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Age verification lookups
CREATE INDEX IF NOT EXISTS idx_age_verification_mode 
  ON age_verification(is_teen_mode, is_coppa_mode, requires_guardian);

-- Guardian relationships - frequently queried
CREATE INDEX IF NOT EXISTS idx_guardian_parent 
  ON guardian_relationships(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_guardian_teen 
  ON guardian_relationships(teen_id, status);

-- Screen time - daily lookups
CREATE INDEX IF NOT EXISTS idx_screen_time_usage_date 
  ON screen_time_usage(user_id, usage_date);

-- Emergency contacts - fast access
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user 
  ON emergency_contacts(user_id, priority_order);

-- Weekly reports - generation queries
CREATE INDEX IF NOT EXISTS idx_weekly_reports_teen_date 
  ON weekly_reports(teen_id, week_start_date DESC);

-- Consent log - compliance audits
CREATE INDEX IF NOT EXISTS idx_consent_log_user 
  ON consent_log(user_id, consent_type, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE age_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_button_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICY: age_verification
-- Users can read their own, guardians can read their teens'
-- =====================================================
CREATE POLICY "Users can view own age verification"
  ON age_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view teen age verification"
  ON age_verification FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = age_verification.user_id
        AND gr.status = 'active'
    )
  );

CREATE POLICY "Users can update own age verification"
  ON age_verification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own age verification"
  ON age_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICY: guardian_relationships
-- Teens and parents can see their relationships
-- =====================================================
CREATE POLICY "Users can view own guardian relationships"
  ON guardian_relationships FOR SELECT
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);

CREATE POLICY "Parents can create guardian relationships"
  ON guardian_relationships FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Teens can approve guardian relationships"
  ON guardian_relationships FOR UPDATE
  USING (auth.uid() = teen_id AND status = 'pending');

CREATE POLICY "Parents and teens can revoke relationships"
  ON guardian_relationships FOR UPDATE
  USING (auth.uid() = parent_id OR auth.uid() = teen_id);

-- =====================================================
-- RLS POLICY: screen_time_limits
-- Teens can read, guardians can read/write
-- =====================================================
CREATE POLICY "Teens can view own screen time limits"
  ON screen_time_limits FOR SELECT
  USING (auth.uid() = teen_id);

CREATE POLICY "Guardians can view teen screen time limits"
  ON screen_time_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = screen_time_limits.teen_id
        AND gr.status = 'active'
        AND gr.permissions->>'set_screen_time' = 'true'
    )
  );

CREATE POLICY "Guardians can manage screen time limits"
  ON screen_time_limits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = screen_time_limits.teen_id
        AND gr.status = 'active'
        AND gr.permissions->>'set_screen_time' = 'true'
    )
  );

-- =====================================================
-- RLS POLICY: screen_time_usage
-- Teens and guardians can view
-- =====================================================
CREATE POLICY "Users can view own screen time usage"
  ON screen_time_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view teen screen time usage"
  ON screen_time_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = screen_time_usage.user_id
        AND gr.status = 'active'
    )
  );

CREATE POLICY "Users can update own usage"
  ON screen_time_usage FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICY: safety_alerts
-- Parents can see their teens' alerts
-- =====================================================
CREATE POLICY "Parents can view teen safety alerts"
  ON safety_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = safety_alerts.teen_id
        AND gr.status = 'active'
        AND gr.permissions->>'receive_safety_alerts' = 'true'
    )
  );

CREATE POLICY "Parents can update alert status"
  ON safety_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = safety_alerts.teen_id
        AND gr.status = 'active'
    )
  );

CREATE POLICY "System can create safety alerts"
  ON safety_alerts FOR INSERT
  WITH CHECK (true); -- Alerts created by backend/triggers

-- =====================================================
-- RLS POLICY: teen_activity_logs
-- Guardians can view teen activity
-- =====================================================
CREATE POLICY "Teens can view own activity logs"
  ON teen_activity_logs FOR SELECT
  USING (auth.uid() = teen_id);

CREATE POLICY "Guardians can view teen activity logs"
  ON teen_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = teen_activity_logs.teen_id
        AND gr.status = 'active'
        AND gr.permissions->>'view_activity' = 'true'
    )
  );

CREATE POLICY "System can create activity logs"
  ON teen_activity_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS POLICY: emergency_contacts
-- Only user can manage their emergency contacts
-- =====================================================
CREATE POLICY "Users can manage own emergency contacts"
  ON emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view teen emergency contacts"
  ON emergency_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = emergency_contacts.user_id
        AND gr.status = 'active'
    )
  );

-- =====================================================
-- RLS POLICY: content_filter_settings
-- Teens and guardians can view/manage
-- =====================================================
CREATE POLICY "Users can view own content filters"
  ON content_filter_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can manage teen content filters"
  ON content_filter_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = content_filter_settings.user_id
        AND gr.status = 'active'
        AND gr.permissions->>'set_content_filters' = 'true'
    )
  );

CREATE POLICY "Users can update own filters if not locked"
  ON content_filter_settings FOR UPDATE
  USING (auth.uid() = user_id AND guardian_locked = false);

-- =====================================================
-- RLS POLICY: contact_restrictions
-- Similar to content filters
-- =====================================================
CREATE POLICY "Users can view own contact restrictions"
  ON contact_restrictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can manage teen contact restrictions"
  ON contact_restrictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = contact_restrictions.user_id
        AND gr.status = 'active'
        AND gr.permissions->>'set_contact_restrictions' = 'true'
    )
  );

CREATE POLICY "Users can update own restrictions if not locked"
  ON contact_restrictions FOR UPDATE
  USING (auth.uid() = user_id AND guardian_locked = false);

-- =====================================================
-- RLS POLICY: panic_button_logs
-- User and guardians can view, system can create
-- =====================================================
CREATE POLICY "Users can view own panic logs"
  ON panic_button_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view teen panic logs"
  ON panic_button_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_relationships gr
      WHERE gr.parent_id = auth.uid()
        AND gr.teen_id = panic_button_logs.user_id
        AND gr.status = 'active'
    )
  );

CREATE POLICY "Users can create panic logs"
  ON panic_button_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- RLS POLICY: weekly_reports
-- Parents can view their reports
-- =====================================================
CREATE POLICY "Parents can view weekly reports"
  ON weekly_reports FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Teens can view their reports"
  ON weekly_reports FOR SELECT
  USING (auth.uid() = teen_id);

CREATE POLICY "System can create reports"
  ON weekly_reports FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- RLS POLICY: consent_log
-- Users can view their own consents, system can create
-- =====================================================
CREATE POLICY "Users can view own consent log"
  ON consent_log FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = consented_by);

CREATE POLICY "System can create consent records"
  ON consent_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_age_verification_updated_at
  BEFORE UPDATE ON age_verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screen_time_limits_updated_at
  BEFORE UPDATE ON screen_time_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screen_time_usage_updated_at
  BEFORE UPDATE ON screen_time_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_filter_settings_updated_at
  BEFORE UPDATE ON content_filter_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_restrictions_updated_at
  BEFORE UPDATE ON contact_restrictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-apply teen mode settings on age verification
CREATE OR REPLACE FUNCTION apply_teen_mode_defaults()
RETURNS TRIGGER AS $$
DECLARE
  user_age INTEGER;
BEGIN
  -- Calculate age
  user_age := EXTRACT(YEAR FROM AGE(NEW.birth_date));
  
  -- Set mode flags
  IF user_age < 13 THEN
    NEW.is_coppa_mode := true;
    NEW.is_teen_mode := false;
    NEW.is_adult := false;
    NEW.requires_guardian := true;
    NEW.account_activated := false; -- Needs guardian approval
  ELSIF user_age >= 13 AND user_age < 18 THEN
    NEW.is_coppa_mode := false;
    NEW.is_teen_mode := true;
    NEW.is_adult := false;
    NEW.requires_guardian := false; -- Optional
    NEW.account_activated := true;
  ELSE
    NEW.is_coppa_mode := false;
    NEW.is_teen_mode := false;
    NEW.is_adult := true;
    NEW.requires_guardian := false;
    NEW.account_activated := true;
  END IF;
  
  -- Apply default settings for teens
  IF NEW.is_teen_mode OR NEW.is_coppa_mode THEN
    -- Insert default content filters
    INSERT INTO content_filter_settings (user_id, managed_by_guardian)
    VALUES (NEW.user_id, NEW.is_coppa_mode)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default contact restrictions
    INSERT INTO contact_restrictions (user_id, managed_by_guardian, guardian_locked)
    VALUES (NEW.user_id, NEW.is_coppa_mode, NEW.is_coppa_mode)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default screen time limits (2 hours/day for teens)
    IF NEW.is_coppa_mode THEN
      INSERT INTO screen_time_limits (teen_id, daily_limit_minutes, created_by)
      VALUES (NEW.user_id, 60, NEW.user_id) -- 1 hour for under-13
      ON CONFLICT (teen_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apply_teen_mode_on_age_verification
  BEFORE INSERT OR UPDATE ON age_verification
  FOR EACH ROW EXECUTE FUNCTION apply_teen_mode_defaults();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Insert a comment to track migration
COMMENT ON TABLE guardian_relationships IS 'Focus Teen Care - Parental control guardian relationships - Migration 2025-11-27';
COMMENT ON TABLE safety_alerts IS 'Focus Teen Care - AI-powered safety alert system - Migration 2025-11-27';
COMMENT ON TABLE teen_activity_logs IS 'Focus Teen Care - Teen activity tracking for guardian dashboard - Migration 2025-11-27';
