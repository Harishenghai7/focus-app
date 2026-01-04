-- FOCUS TEEN CARE - Database Schema
-- Parental Control and Teen Safety System

-- ===========================================
-- GUARDIAN RELATIONSHIPS
-- ===========================================

-- Guardian relationships table
CREATE TABLE guardian_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL DEFAULT 'parent', -- 'parent', 'guardian', 'teacher'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'revoked', 'expired'
  
  -- Permissions (what guardian can see/control)
  permissions JSONB DEFAULT '{
    "view_activity": true,
    "view_contacts": true,
    "view_content_flags": true,
    "control_screen_time": true,
    "control_contacts": true,
    "control_content_filters": true,
    "receive_alerts": true
  }'::jsonb,
  
  -- Invitation details
  invitation_code VARCHAR(8) UNIQUE,
  invitation_expires_at TIMESTAMP,
  invited_by UUID, -- Who initiated the link
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  
  CONSTRAINT unique_guardian_teen UNIQUE (guardian_id, teen_id)
);

-- Indexes for guardian relationships
CREATE INDEX idx_guardian_relationships_guardian ON guardian_relationships(guardian_id);
CREATE INDEX idx_guardian_relationships_teen ON guardian_relationships(teen_id);
CREATE INDEX idx_guardian_relationships_status ON guardian_relationships(status);
CREATE INDEX idx_guardian_relationships_code ON guardian_relationships(invitation_code);

-- ===========================================
-- TEEN SAFETY SETTINGS
-- ===========================================

-- Teen safety settings table
CREATE TABLE teen_safety_settings (
  teen_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Age & Verification
  birth_date DATE,
  age_verified BOOLEAN DEFAULT false,
  age_verification_method VARCHAR(50), -- 'id_upload', 'parent_verified', 'ai_estimated'
  coppa_mode BOOLEAN DEFAULT false, -- Under 13 mode
  
  -- Default safety settings
  strict_content_filter BOOLEAN DEFAULT true,
  private_account BOOLEAN DEFAULT true,
  dm_restrictions VARCHAR(20) DEFAULT 'followers_only', -- 'everyone', 'followers_only', 'approved_only', 'nobody'
  location_sharing BOOLEAN DEFAULT false,
  download_prevention BOOLEAN DEFAULT true,
  comment_filter BOOLEAN DEFAULT true,
  stranger_blocking BOOLEAN DEFAULT true,
  
  -- Contact settings
  who_can_message VARCHAR(20) DEFAULT 'approved_only',
  who_can_comment VARCHAR(20) DEFAULT 'followers_only',
  who_can_mention VARCHAR(20) DEFAULT 'followers_only',
  group_chat_approval BOOLEAN DEFAULT true,
  
  -- Safety features
  panic_button_enabled BOOLEAN DEFAULT true,
  trusted_contacts UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- SCREEN TIME MANAGEMENT
-- ===========================================

-- Screen time limits table
CREATE TABLE screen_time_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Daily limits
  daily_limit_minutes INTEGER DEFAULT 120, -- 2 hours default
  weekend_limit_minutes INTEGER DEFAULT 180, -- 3 hours on weekends
  
  -- Time blocks (when app is blocked)
  time_blocks JSONB DEFAULT '[]'::jsonb,
  /* Example:
  [
    {"name": "Bedtime", "start": "22:00", "end": "07:00", "days": ["mon","tue","wed","thu","fri"]},
    {"name": "Study Time", "start": "16:00", "end": "18:00", "days": ["mon","tue","wed","thu","fri"]},
    {"name": "Family Time", "start": "18:00", "end": "20:00", "days": ["sun"]}
  ]
  */
  
  -- Grace period
  grace_period_minutes INTEGER DEFAULT 15,
  
  -- Status
  enabled BOOLEAN DEFAULT true,
  
  -- Who set these limits
  created_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_screen_time_limits_teen ON screen_time_limits(teen_id);

-- Screen time usage tracking
CREATE TABLE screen_time_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Usage stats
  total_minutes INTEGER DEFAULT 0,
  sessions JSONB DEFAULT '[]'::jsonb, -- [{start: timestamp, end: timestamp, duration: minutes}]
  
  -- Breakdown
  feed_minutes INTEGER DEFAULT 0,
  create_minutes INTEGER DEFAULT 0,
  messages_minutes INTEGER DEFAULT 0,
  explore_minutes INTEGER DEFAULT 0,
  
  -- Lockout info
  was_locked_out BOOLEAN DEFAULT false,
  lockout_times JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_teen_date UNIQUE (teen_id, date)
);

CREATE INDEX idx_screen_time_usage_teen_date ON screen_time_usage(teen_id, date);

-- ===========================================
-- SAFETY ALERTS
-- ===========================================

-- Safety alerts table
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  /* Types:
    - cyberbullying_detected
    - nsfw_exposure
    - nsfw_shared
    - stranger_contact
    - grooming_detected
    - location_shared
    - self_harm_detected
    - suicide_content
    - eating_disorder
    - stranger_meetup
    - personal_info_shared
    - suspicious_user
    - screen_time_exceeded
  */
  
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Related content
  related_content_id UUID,
  related_content_type VARCHAR(50), -- 'post', 'comment', 'message', 'user'
  related_user_id UUID REFERENCES users(id),
  
  -- AI confidence
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Status
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'viewed', 'reviewed', 'resolved', 'dismissed'
  
  -- Notification tracking
  push_sent BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_alerts_teen ON safety_alerts(teen_id);
CREATE INDEX idx_safety_alerts_guardian ON safety_alerts(guardian_id);
CREATE INDEX idx_safety_alerts_status ON safety_alerts(status);
CREATE INDEX idx_safety_alerts_severity ON safety_alerts(severity);
CREATE INDEX idx_safety_alerts_type ON safety_alerts(alert_type);
CREATE INDEX idx_safety_alerts_created ON safety_alerts(created_at DESC);

-- ===========================================
-- ACTIVITY LOGGING
-- ===========================================

-- Teen activity logs for guardian dashboard
CREATE TABLE teen_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(50) NOT NULL,
  /* Types:
    - post_created
    - post_deleted
    - comment_created
    - followed_user
    - unfollowed_user
    - new_follower
    - blocked_user
    - reported_content
    - content_flagged
    - message_sent
    - profile_updated
    - settings_changed
    - location_shared
  */
  
  -- Activity details (summary only, respecting privacy)
  details JSONB,
  /* Examples:
    - {post_type: 'photo', has_caption: true}
    - {followed_username: 'user123', is_adult: false}
    - {flag_type: 'nsfw', content_type: 'post'}
  */
  
  -- Privacy flag (some activities are private even from guardians)
  is_private BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_teen_activity_teen ON teen_activity_logs(teen_id);
CREATE INDEX idx_teen_activity_type ON teen_activity_logs(activity_type);
CREATE INDEX idx_teen_activity_created ON teen_activity_logs(created_at DESC);

-- ===========================================
-- CONTENT MONITORING
-- ===========================================

-- Flagged content for guardian review
CREATE TABLE guardian_flagged_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'post', 'comment', 'message', 'bio'
  
  flag_reason VARCHAR(100) NOT NULL,
  /* Reasons:
    - inappropriate_language
    - nsfw_content
    - violence
    - bullying
    - self_harm
    - personal_info
    - location_shared
    - suspicious_contact
  */
  
  -- AI analysis
  ai_score DECIMAL(3,2),
  ai_categories JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'removed', 'escalated'
  
  -- Guardian action
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_flagged_content_teen ON guardian_flagged_content(teen_id);
CREATE INDEX idx_flagged_content_status ON guardian_flagged_content(status);

-- ===========================================
-- BLOCKED ACCOUNTS (Guardian managed)
-- ===========================================

-- Guardian-blocked accounts
CREATE TABLE guardian_blocked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  blocked_by UUID REFERENCES users(id), -- Guardian who blocked
  reason VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_guardian_block UNIQUE (teen_id, blocked_user_id)
);

-- ===========================================
-- WEEKLY REPORTS
-- ===========================================

-- Weekly safety reports for guardians
CREATE TABLE weekly_safety_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- Summary stats
  total_screen_time_minutes INTEGER,
  avg_daily_minutes INTEGER,
  posts_created INTEGER,
  new_followers INTEGER,
  new_following INTEGER,
  messages_sent INTEGER,
  
  -- Safety overview
  total_alerts INTEGER,
  critical_alerts INTEGER,
  flagged_content_count INTEGER,
  blocked_accounts_count INTEGER,
  
  -- Report content
  summary_text TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  
  -- Delivery
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weekly_reports_guardian ON weekly_safety_reports(guardian_id);
CREATE INDEX idx_weekly_reports_teen ON weekly_safety_reports(teen_id);
CREATE INDEX idx_weekly_reports_week ON weekly_safety_reports(week_start);

-- ===========================================
-- AGE VERIFICATION
-- ===========================================

-- Age verification requests
CREATE TABLE age_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Claimed age info
  claimed_birth_date DATE,
  claimed_age INTEGER,
  
  -- Verification method
  method VARCHAR(50), -- 'id_upload', 'parent_verification', 'ai_estimation', 'credit_card'
  
  -- ID verification (optional)
  id_document_type VARCHAR(50), -- 'passport', 'drivers_license', 'school_id'
  id_document_url TEXT, -- Encrypted/secure storage
  id_verification_service VARCHAR(100),
  
  -- AI estimation
  ai_estimated_age INTEGER,
  ai_confidence DECIMAL(3,2),
  
  -- Parent verification
  verified_by_parent UUID REFERENCES users(id),
  parent_relationship VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'expired'
  
  -- Review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_age_verifications_user ON age_verifications(user_id);
CREATE INDEX idx_age_verifications_status ON age_verifications(status);

-- ===========================================
-- EMERGENCY CONTACTS
-- ===========================================

-- Trusted/Emergency contacts
CREATE TABLE trusted_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  contact_user_id UUID REFERENCES users(id),
  contact_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  
  relationship VARCHAR(50), -- 'parent', 'teacher', 'counselor', 'other_adult'
  
  -- Permissions
  can_message_during_lockout BOOLEAN DEFAULT true,
  receives_panic_alerts BOOLEAN DEFAULT false,
  
  -- Status
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trusted_contacts_teen ON trusted_contacts(teen_id);

-- Panic button activations
CREATE TABLE panic_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Location at activation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(10, 2),
  
  -- Message
  message TEXT,
  
  -- Notification tracking
  guardians_notified UUID[] DEFAULT '{}',
  emergency_services_contacted BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'false_alarm'
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_panic_activations_teen ON panic_activations(teen_id);
CREATE INDEX idx_panic_activations_status ON panic_activations(status);

-- ===========================================
-- EDUCATIONAL RESOURCES
-- ===========================================

-- Educational resources
CREATE TABLE safety_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  content_type VARCHAR(50), -- 'article', 'video', 'guide', 'quiz'
  
  -- Audience
  audience VARCHAR(20), -- 'parent', 'teen', 'both'
  min_age INTEGER,
  max_age INTEGER,
  
  -- Categorization
  category VARCHAR(100), -- 'digital_parenting', 'online_safety', 'cyberbullying', 'privacy', 'mental_health'
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- Crisis resource
  is_crisis_resource BOOLEAN DEFAULT false,
  crisis_hotline VARCHAR(50),
  
  -- Status
  published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_resources_audience ON safety_resources(audience);
CREATE INDEX idx_safety_resources_category ON safety_resources(category);

-- ===========================================
-- USER PROFILE EXTENSION
-- ===========================================

-- Add teen care fields to users table (or create extension table)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  is_teen BOOLEAN DEFAULT false,
  is_guardian BOOLEAN DEFAULT false,
  birth_date DATE,
  account_type VARCHAR(20) DEFAULT 'standard', -- 'standard', 'teen', 'guardian', 'coppa'
  teen_mode_enabled BOOLEAN DEFAULT false,
  guardian_required BOOLEAN DEFAULT false;

-- ===========================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_safety_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_activity_logs ENABLE ROW LEVEL SECURITY;

-- Guardians can view their teens' data
CREATE POLICY guardian_view_teen_settings ON teen_safety_settings
  FOR SELECT USING (
    teen_id = auth.uid() OR
    teen_id IN (
      SELECT teen_id FROM guardian_relationships
      WHERE guardian_id = auth.uid() AND status = 'active'
    )
  );

-- Guardians can view alerts for their teens
CREATE POLICY guardian_view_alerts ON safety_alerts
  FOR SELECT USING (
    teen_id = auth.uid() OR
    guardian_id = auth.uid()
  );

-- Teens can view their own activity (transparency)
CREATE POLICY teen_view_own_activity ON teen_activity_logs
  FOR SELECT USING (teen_id = auth.uid());

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Function to check if user is a teen
CREATE OR REPLACE FUNCTION is_user_teen(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teen_safety_settings
    WHERE teen_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user's age
CREATE OR REPLACE FUNCTION get_user_age(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_birth_date DATE;
BEGIN
  SELECT birth_date INTO user_birth_date
  FROM teen_safety_settings
  WHERE teen_id = user_id;
  
  IF user_birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(YEAR FROM age(user_birth_date));
END;
$$ LANGUAGE plpgsql;

-- Function to check screen time limit
CREATE OR REPLACE FUNCTION check_screen_time_limit(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  limit_record RECORD;
  usage_record RECORD;
  remaining_minutes INTEGER;
  is_blocked BOOLEAN;
  current_block TEXT;
BEGIN
  -- Get limits
  SELECT * INTO limit_record
  FROM screen_time_limits
  WHERE teen_id = user_id AND enabled = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('limited', false);
  END IF;
  
  -- Get today's usage
  SELECT * INTO usage_record
  FROM screen_time_usage
  WHERE teen_id = user_id AND date = CURRENT_DATE;
  
  -- Calculate remaining time
  remaining_minutes := limit_record.daily_limit_minutes - COALESCE(usage_record.total_minutes, 0);
  
  -- Check time blocks
  -- TODO: Implement time block checking
  
  RETURN jsonb_build_object(
    'limited', true,
    'daily_limit', limit_record.daily_limit_minutes,
    'used_today', COALESCE(usage_record.total_minutes, 0),
    'remaining', GREATEST(0, remaining_minutes),
    'exceeded', remaining_minutes <= 0,
    'grace_period', limit_record.grace_period_minutes
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create teen settings when user marked as teen
CREATE OR REPLACE FUNCTION create_teen_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_teen = true AND OLD.is_teen = false THEN
    INSERT INTO teen_safety_settings (teen_id, birth_date)
    VALUES (NEW.id, NEW.birth_date)
    ON CONFLICT (teen_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_becomes_teen
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.is_teen = true AND OLD.is_teen = false)
  EXECUTE FUNCTION create_teen_settings();
