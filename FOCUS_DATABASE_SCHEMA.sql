-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "postgis";         -- For location-based features

-- Set timezone
SET timezone = 'UTC';

-- ===================================
-- 2. ENUMS & TYPES
-- ===================================

-- Content visibility levels
CREATE TYPE visibility_type AS ENUM ('public', 'followers', 'close_friends', 'private');

-- User verification status
CREATE TYPE verification_status AS ENUM ('none', 'pending', 'verified', 'rejected');

-- Content moderation status
CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'flagged', 'removed');

-- Report status
CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');

-- Guardian relationship status
CREATE TYPE guardian_status AS ENUM ('pending', 'active', 'revoked');

-- ===================================
-- 3. CORE AUTHENTICATION & PROFILES
-- ===================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  cover_photo_url TEXT,
  
  -- Verification & Trust
  verified BOOLEAN DEFAULT false,
  verification_status verification_status DEFAULT 'none',
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Privacy settings
  is_private BOOLEAN DEFAULT false,
  allow_messages_from VARCHAR(20) DEFAULT 'everyone', -- 'everyone', 'followers', 'none'
  
  -- Account metadata
  website VARCHAR(255),
  location VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  
  -- Status
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Statistics (denormalized for performance)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification preferences
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notify_likes BOOLEAN DEFAULT true,
  notify_comments BOOLEAN DEFAULT true,
  notify_follows BOOLEAN DEFAULT true,
  notify_mentions BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  
  -- Content preferences
  nsfw_filter_enabled BOOLEAN DEFAULT true,
  violence_filter_enabled BOOLEAN DEFAULT true,
  profanity_filter_enabled BOOLEAN DEFAULT false,
  sensitivity_level VARCHAR(20) DEFAULT 'medium',
  
  -- Privacy
  show_online_status BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  
  -- UI Preferences
  theme VARCHAR(20) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  glassmorphism_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Age Verification & COPPA Compliance
CREATE TABLE IF NOT EXISTS age_verification (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  is_adult BOOLEAN DEFAULT false,
  is_teen_mode BOOLEAN DEFAULT false,
  is_coppa_mode BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 4. CONTENT TABLES
-- ===================================

-- Posts (Instagram-style photos/videos)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  caption TEXT,
  media_urls TEXT[] NOT NULL, -- Array for carousel
  media_types VARCHAR(10)[], -- 'image', 'video'
  thumbnail_url TEXT,
  
  -- Metadata
  location VARCHAR(255),
  location_geom GEOMETRY(Point, 4326),
  tagged_users UUID[],
  hashtags TEXT[],
  music_id UUID, -- References music_library(id)
  
  -- Privacy
  visibility visibility_type DEFAULT 'public',
  comments_disabled BOOLEAN DEFAULT false,
  likes_hidden BOOLEAN DEFAULT false,
  
  -- Statistics (denormalized)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  
  -- AI Moderation scores
  nsfw_score NUMERIC(5,2) DEFAULT 0,
  violence_score NUMERIC(5,2) DEFAULT 0,
  hate_speech_score NUMERIC(5,2) DEFAULT 0,
  overall_safety_score NUMERIC(5,2) DEFAULT 0,
  moderation_status moderation_status DEFAULT 'approved',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Boltz (TikTok-style short videos)
CREATE TABLE IF NOT EXISTS boltz (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  
  -- Metadata
  music_id UUID,
  hashtags TEXT[],
  ar_filter_id UUID,
  
  -- Statistics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- AI Moderation
  nsfw_score NUMERIC(5,2) DEFAULT 0,
  violence_score NUMERIC(5,2) DEFAULT 0,
  moderation_status moderation_status DEFAULT 'approved',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash (Snapchat/Instagram Stories)
CREATE TABLE IF NOT EXISTS flash (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL, -- 'image', 'video'
  duration INTEGER DEFAULT 15, -- seconds to display
  
  -- Interactive elements
  stickers JSONB, -- [{type, position, data}]
  text_overlays JSONB,
  music_id UUID,
  
  -- Privacy
  visibility visibility_type DEFAULT 'public',
  selected_viewers UUID[],
  
  -- Statistics
  views_count INTEGER DEFAULT 0,
  
  -- Auto-deletion
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash Highlights (Collections of stories)
CREATE TABLE IF NOT EXISTS flash_highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(50) NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash Stories in Highlights (Junction)
CREATE TABLE IF NOT EXISTS highlight_stories (
  highlight_id UUID REFERENCES flash_highlights(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (highlight_id, flash_id)
);

-- Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- 'post', 'boltz', 'flash'
  
  -- Content
  media_urls TEXT[],
  caption TEXT,
  hashtags TEXT[],
  mentions UUID[],
  location_id UUID,
  music_id UUID,
  
  -- Editor State
  filter_name VARCHAR(50),
  adjustments JSONB,
  stickers JSONB,
  text_overlays JSONB,
  
  -- Settings
  audience visibility_type DEFAULT 'public',
  settings JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 5. INTERACTIONS
-- ===================================

-- Likes (polymorphic)
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic fields
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  comment_id UUID, -- References comments(id)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one content type is liked
  CONSTRAINT one_content_type CHECK (
    (post_id IS NOT NULL)::INTEGER +
    (boltz_id IS NOT NULL)::INTEGER +
    (flash_id IS NOT NULL)::INTEGER +
    (comment_id IS NOT NULL)::INTEGER = 1
  ),
  
  -- Prevent duplicate likes
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, boltz_id),
  UNIQUE (user_id, flash_id),
  UNIQUE (user_id, comment_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic content
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  
  -- Comment data
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For replies
  
  -- Metadata
  mentions UUID[],
  
  -- Statistics
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Moderation
  profanity_detected BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_content_type CHECK (
    (post_id IS NOT NULL)::INTEGER +
    (boltz_id IS NOT NULL)::INTEGER +
    (flash_id IS NOT NULL)::INTEGER = 1
  )
);

-- Shares
CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic content
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE,
  
  platform VARCHAR(50), -- 'copy', 'whatsapp', 'instagram', 'story', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_content_type CHECK (
    (post_id IS NOT NULL)::INTEGER +
    (boltz_id IS NOT NULL)::INTEGER +
    (flash_id IS NOT NULL)::INTEGER = 1
  )
);

-- Save Collections
CREATE TABLE IF NOT EXISTS save_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saves/Bookmarks
CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Polymorphic content
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  
  collection_id UUID REFERENCES save_collections(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT one_content_type CHECK (
    (post_id IS NOT NULL)::INTEGER +
    (boltz_id IS NOT NULL)::INTEGER = 1
  ),
  
  UNIQUE (user_id, post_id),
  UNIQUE (user_id, boltz_id)
);

-- Story Views
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (flash_id, user_id)
);

-- ===================================
-- 6. SOCIAL GRAPH
-- ===================================

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  status VARCHAR(20) DEFAULT 'accepted', -- 'pending', 'accepted'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Close Friends
CREATE TABLE IF NOT EXISTS close_friends (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- Blocked Users
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Muted Users
CREATE TABLE IF NOT EXISTS mutes (
  muter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  muted_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id)
);

-- ===================================
-- 7. MESSAGING SYSTEM
-- ===================================

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_group BOOLEAN DEFAULT false,
  group_name VARCHAR(100),
  group_avatar_url TEXT,
  created_by UUID REFERENCES profiles(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settings
  muted BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  
  -- State
  last_read_message_id UUID,
  last_read_at TIMESTAMP WITH TIME ZONE,
  
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Content
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(20), -- 'image', 'video', 'audio', 'file'
  
  -- Type
  type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'video', 'audio', 'post_share'
  
  -- Shared Content
  shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  shared_boltz_id UUID REFERENCES boltz(id) ON DELETE SET NULL,
  shared_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  
  -- Reactions
  reactions JSONB DEFAULT '[]', -- [{user_id, emoji}]
  
  -- Reply
  reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Typing Indicators
CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ===================================
-- 8. NOTIFICATIONS
-- ===================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Type
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'mention', 'message'
  
  -- Actors & Content
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  
  -- Content
  title VARCHAR(255),
  body TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  seen BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 9. TRUST & SAFETY SYSTEM
-- ===================================

-- User Trust Scores
CREATE TABLE IF NOT EXISTS user_trust_scores (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 50 CHECK (score >= 0 AND score <= 100),
  
  -- Breakdown
  account_age_score INTEGER DEFAULT 0,
  verification_score INTEGER DEFAULT 0,
  report_score INTEGER DEFAULT 50,
  engagement_score INTEGER DEFAULT 0,
  content_safety_score INTEGER DEFAULT 50,
  
  -- History
  violations_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  bans_count INTEGER DEFAULT 0,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reporter & Target
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_content_id UUID,
  content_type VARCHAR(20), -- 'post', 'comment', 'message', 'profile'
  
  -- Details
  category VARCHAR(50), -- 'spam', 'harassment', 'nsfw', 'hate_speech'
  subcategory VARCHAR(50),
  description TEXT,
  evidence_urls TEXT[],
  
  -- Status
  priority VARCHAR(10) DEFAULT 'P2', -- 'P0', 'P1', 'P2', 'P3'
  status report_status DEFAULT 'pending',
  
  -- Resolution
  assigned_to UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution VARCHAR(50),
  resolution_note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Moderation Logs
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID,
  content_type VARCHAR(20),
  user_id UUID REFERENCES profiles(id),
  
  -- AI Analysis
  nsfw_score NUMERIC(5,2),
  violence_score NUMERIC(5,2),
  hate_speech_score NUMERIC(5,2),
  spam_score NUMERIC(5,2),
  
  -- Decision
  status moderation_status,
  auto_decision BOOLEAN DEFAULT true,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Action
  action_taken VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banned Content/Keywords
CREATE TABLE IF NOT EXISTS banned_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20), -- 'word', 'phrase', 'url', 'image_hash'
  content TEXT,
  severity VARCHAR(20),
  language VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 10. GUARDIAN & TEEN CARE
-- ===================================

-- Guardian Relationships
CREATE TABLE IF NOT EXISTS guardian_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES profiles(id),
  teen_id UUID REFERENCES profiles(id),
  relationship_type VARCHAR(20) DEFAULT 'parent',
  
  status guardian_status DEFAULT 'pending',
  permissions JSONB DEFAULT '{}',
  
  -- Invitation
  invitation_code VARCHAR(50),
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES profiles(id),
  revoke_reason TEXT
);

-- Screen Time Limits
CREATE TABLE IF NOT EXISTS screen_time_limits (
  teen_id UUID PRIMARY KEY REFERENCES profiles(id),
  daily_limit_minutes INTEGER DEFAULT 120,
  time_blocks JSONB DEFAULT '[]', -- [{start, end, days}]
  enabled BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screen Time Usage
CREATE TABLE IF NOT EXISTS screen_time_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  
  total_minutes INTEGER DEFAULT 0,
  feed_minutes INTEGER DEFAULT 0,
  create_minutes INTEGER DEFAULT 0,
  messages_minutes INTEGER DEFAULT 0,
  explore_minutes INTEGER DEFAULT 0,
  
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (teen_id, date)
);

-- Safety Alerts
CREATE TABLE IF NOT EXISTS safety_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  alert_type VARCHAR(50), -- 'cyberbullying', 'nsfw_exposure', 'late_night'
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  
  related_content_id UUID,
  related_user_id UUID,
  
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'reviewed', 'resolved'
  resolution_notes TEXT,
  
  parent_notified_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teen Activity Logs
CREATE TABLE IF NOT EXISTS teen_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50), -- 'post_created', 'followed_user', 'message_sent'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardian Blocked Accounts
CREATE TABLE IF NOT EXISTS guardian_blocked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_by UUID REFERENCES profiles(id), -- Guardian ID
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (teen_id, blocked_user_id)
);

-- ===================================
-- 11. ADDITIONAL FEATURES
-- ===================================

-- Music Library
CREATE TABLE IF NOT EXISTS music_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  duration INTEGER,
  file_url TEXT,
  cover_url TEXT,
  genre VARCHAR(50),
  trending_score NUMERIC DEFAULT 0,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trending Hashtags
CREATE TABLE IF NOT EXISTS trending_hashtags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hashtag VARCHAR(255) UNIQUE,
  post_count INTEGER DEFAULT 0,
  last_24h_count INTEGER DEFAULT 0,
  trending_score NUMERIC DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  search_query TEXT,
  search_type VARCHAR(20), -- 'account', 'hashtag', 'location'
  result_id UUID,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon_url TEXT,
  category VARCHAR(50), -- 'achievement', 'verification', 'community'
  tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum'
  requirements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active',
  visibility VARCHAR(20) DEFAULT 'public',
  progress JSONB,
  UNIQUE (user_id, badge_id)
);

-- ===================================
-- 12. INDEXES & PERFORMANCE
-- ===================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_username ON profiles USING GIN(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_fullname ON profiles USING GIN(full_name gin_trgm_ops);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST(location_geom);

-- Boltz
CREATE INDEX IF NOT EXISTS idx_boltz_user_created ON boltz(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boltz_created_at ON boltz(created_at DESC);

-- Flash
CREATE INDEX IF NOT EXISTS idx_flash_user_created ON flash(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flash_expires ON flash(expires_at);

-- Interactions
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_boltz ON likes(boltz_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_boltz ON comments(boltz_id);

-- Social Graph
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

-- ===================================
-- 13. FUNCTIONS & TRIGGERS
-- ===================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment/decrement counts
CREATE OR REPLACE FUNCTION update_counts()
RETURNS TRIGGER AS $$
DECLARE
  table_name TEXT;
  column_name TEXT;
  record_id UUID;
  delta INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    delta := 1;
  ELSE
    delta := -1;
  END IF;

  -- Handle Likes
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = likes_count + 1 WHERE id = NEW.boltz_id;
      END IF;
    ELSE
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET likes_count = likes_count - 1 WHERE id = OLD.boltz_id;
      END IF;
    END IF;
  
  -- Handle Comments
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      ELSIF NEW.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = comments_count + 1 WHERE id = NEW.boltz_id;
      END IF;
    ELSE
      IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
      ELSIF OLD.boltz_id IS NOT NULL THEN
        UPDATE boltz SET comments_count = comments_count - 1 WHERE id = OLD.boltz_id;
      END IF;
    END IF;

  -- Handle Follows
  ELSIF TG_TABLE_NAME = 'follows' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
      UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    ELSE
      UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
      UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply count triggers
CREATE TRIGGER trigger_likes_count AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_counts();

CREATE TRIGGER trigger_comments_count AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_counts();

CREATE TRIGGER trigger_follows_count AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_counts();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new auth users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ===================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Settings Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Posts Policies
CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (
    visibility = 'public' OR
    user_id = auth.uid() OR
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = auth.uid() AND following_id = posts.user_id
    ))
  );

CREATE POLICY "Users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
CREATE POLICY "Users can view their conversations" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Guardian Policies
CREATE POLICY "Guardians and teens can view relationships" ON guardian_relationships
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = teen_id);

-- ===================================
-- 15. REALTIME SUBSCRIPTIONS
-- ===================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE boltz;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE guardian_relationships;
ALTER PUBLICATION supabase_realtime ADD TABLE safety_alerts;

-- ===================================
-- 16. SEED DATA (OPTIONAL)
-- ===================================

-- Insert default banned words
INSERT INTO banned_content (type, content, severity, language) VALUES
  ('word', 'spam', 'low', 'en'),
  ('word', 'scam', 'medium', 'en')
ON CONFLICT DO NOTHING;

-- End of Schema

-- ===================================
-- SETTINGS PAGE ADDITIONAL TABLES
-- ===================================

-- User Sessions (for active sessions management)
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_name VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  ip_address INET,
  location VARCHAR(100),
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Linked OAuth Accounts  
CREATE TABLE IF NOT EXISTS linked_accounts (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255),
  provider_email VARCHAR(255),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- User Verifications
CREATE TABLE IF NOT EXISTS user_verifications (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  identity_verified_at TIMESTAMP WITH TIME ZONE,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS users_view_own_sessions ON user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS users_delete_own_sessions ON user_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS users_view_own_linked_accounts ON linked_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS users_manage_own_linked_accounts ON linked_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS users_view_own_verifications ON user_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS users_update_own_verifications ON user_verifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE linked_accounts;
