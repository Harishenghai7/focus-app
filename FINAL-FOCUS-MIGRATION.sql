-- =============================================================
-- 🏛️ THE SOVEREIGN ARCHITECT FINAL MIGRATION
-- FOCUS ECOSYSTEM - PRODUCTION-READY SUITE
-- Version: 1.5 (Sovereign Whisper V2 + Full WebRTC & E2EE Support)
-- Optimized for: Supabase / PostgreSQL 15+
-- =============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  0. WIPE & INITIALIZE                                     │
-- └──────────────────────────────────────────────────────────┘

DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS boltz CASCADE;
DROP TABLE IF EXISTS flash CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_keys CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS webrtc_signals CASCADE;
DROP TABLE IF EXISTS trust_shield CASCADE;
DROP TABLE IF EXISTS moderation_queue CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS support_ticket_messages CASCADE;
DROP TABLE IF EXISTS teen_care_relations CASCADE;
DROP TABLE IF EXISTS teen_activity_logs CASCADE;
DROP TABLE IF EXISTS screen_time_usage CASCADE;
DROP TABLE IF EXISTS screen_time_limits CASCADE;
DROP TABLE IF EXISTS safety_alerts CASCADE;
DROP TABLE IF EXISTS guardian_flagged_content CASCADE;
DROP TABLE IF EXISTS guardian_blocked_accounts CASCADE;
DROP TABLE IF EXISTS weekly_safety_reports CASCADE;
DROP TABLE IF EXISTS focusly_memory CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS hashtags CASCADE;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ┌──────────────────────────────────────────────────────────┐
-- │  1. PROFILES & SETTINGS                                  │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    website TEXT,
    location TEXT,
    trust_level INT DEFAULT 0,
    trust_score FLOAT DEFAULT 0.5,
    trust_tier INT DEFAULT 0,
    verification_status TEXT DEFAULT 'PENDING',
    is_private BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    posts_count INT DEFAULT 0,
    boltz_count INT DEFAULT 0,
    
    account_status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT username_min_length CHECK (char_length(username) >= 3)
);

CREATE TABLE user_settings (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
    settings JSONB DEFAULT '{
        "notifications": {"likes": true, "comments": true, "follows": true, "mentions": true, "push": false},
        "privacy": {"profileVisibility": "public", "showOnlineStatus": true, "allowMessages": "everyone", "showReadReceipts": true},
        "appearance": {"theme": "system", "language": "en"},
        "content": {"autoplayVideos": true, "showSensitiveContent": false, "dataUsage": "auto"}
    }'::JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  2. CONTENT FORGE                                        │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    caption TEXT,
    content TEXT,
    media_urls TEXT[] DEFAULT '{}',
    media_types TEXT[] DEFAULT '{}',
    location TEXT,
    hashtags TEXT[] DEFAULT '{}',
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'public',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE boltz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    caption TEXT,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration FLOAT,
    sound_id TEXT,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flash (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT,
    media_type TEXT DEFAULT 'image',
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag TEXT UNIQUE NOT NULL,
    usage_count INT DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  3. INTERACTIONS & PULSE                                 │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    interaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_id, interaction_type)
);

CREATE TABLE follows (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'accepted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  4. MESSAGING & CALLS (Sovereign Whisper V2)             │
-- └──────────────────────────────────────────────────────────┘

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants UUID[] DEFAULT '{}',
    last_message_id UUID,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_group BOOLEAN DEFAULT FALSE,
    group_name TEXT,
    group_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    ciphertext TEXT,
    initialization_vector TEXT,
    encryption_version TEXT,
    encryption_algorithm TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    media_url TEXT,
    media_type TEXT,
    media_urls JSONB DEFAULT '[]'::JSONB,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    read_by UUID[] DEFAULT '{}',
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '[]'::JSONB,
    content_context JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, recipient_id)
);

CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    call_type TEXT DEFAULT 'audio',
    status TEXT DEFAULT 'missed', -- 'ringing', 'answered', 'rejected', 'ended', 'missed'
    duration INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    room_id TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webrtc_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE NOT NULL,
    from_user UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    signal TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  5. THE 5 PILLARS TABLES                                  │
-- └──────────────────────────────────────────────────────────┘

-- Pillar 1: Trust Shield
CREATE TABLE trust_shield (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    verification_level INT DEFAULT 0,
    identity_status TEXT DEFAULT 'unverified',
    anti_bot_score FLOAT DEFAULT 1.0,
    last_device_id TEXT,
    risk_factor FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pillar 2: Content Moderator
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    toxicity_score FLOAT DEFAULT 0.0,
    nsfw_score FLOAT DEFAULT 0.0,
    status TEXT DEFAULT 'pending',
    moderator_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pillar 3: Report & Support
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE DEFAULT ('TICK-' || upper(substr(md5(random()::text), 1, 8))),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'open',
    category TEXT DEFAULT 'general',
    assigned_to UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE,
    is_internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pillar 4: Teen Care
CREATE TABLE teen_care_relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    ward_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    safety_mode BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guardian_id, ward_id)
);

CREATE TABLE teen_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    activity_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE screen_time_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    total_minutes INT DEFAULT 0,
    feed_minutes INT DEFAULT 0,
    create_minutes INT DEFAULT 0,
    messages_minutes INT DEFAULT 0,
    explore_minutes INT DEFAULT 0,
    UNIQUE(teen_id, date)
);

CREATE TABLE screen_time_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    daily_limit_minutes INT DEFAULT 60,
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teen_id)
);

CREATE TABLE safety_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    guardian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    related_user_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardian_flagged_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE guardian_blocked_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_by UUID REFERENCES profiles(id) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teen_id, blocked_user_id)
);

CREATE TABLE weekly_safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teen_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    guardian_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teen_id, week_start)
);

-- Pillar 5: Focusly AI Memory
CREATE TABLE focusly_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    memory_key TEXT NOT NULL,
    memory_value JSONB NOT NULL,
    importance INT DEFAULT 5,
    source TEXT DEFAULT 'explicit',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, memory_key)
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  6. LOGIC LAYER (Functions & Triggers)                    │
-- └──────────────────────────────────────────────────────────┘

-- Auth Sync Trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', (CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'user_' || substr(NEW.id::text, 1, 8) END)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', (CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User ' || substr(NEW.id::text, 1, 8) END)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', (CASE WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'Focusly User' END)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
  INSERT INTO public.trust_shield (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Interaction Counter Trigger
CREATE OR REPLACE FUNCTION update_content_counters()
RETURNS TRIGGER AS $$
DECLARE
    delta INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN delta := 1;
    ELSIF (TG_OP = 'DELETE') THEN delta := -1;
    ELSE RETURN NULL;
    END IF;

    IF (COALESCE(NEW.interaction_type, OLD.interaction_type) = 'like') THEN
        IF (COALESCE(NEW.target_type, OLD.target_type) = 'post') THEN
            UPDATE posts SET likes_count = likes_count + delta WHERE id = COALESCE(NEW.target_id, OLD.target_id);
        ELSIF (COALESCE(NEW.target_type, OLD.target_type) = 'boltz') THEN
            UPDATE boltz SET likes_count = likes_count + delta WHERE id = COALESCE(NEW.target_id, OLD.target_id);
        END IF;
    ELSIF (COALESCE(NEW.interaction_type, OLD.interaction_type) = 'share') THEN
        IF (COALESCE(NEW.target_type, OLD.target_type) = 'post') THEN
            UPDATE posts SET shares_count = shares_count + delta WHERE id = COALESCE(NEW.target_id, OLD.target_id);
        ELSIF (COALESCE(NEW.target_type, OLD.target_type) = 'boltz') THEN
            UPDATE boltz SET shares_count = shares_count + delta WHERE id = COALESCE(NEW.target_id, OLD.target_id);
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER interaction_counter_trigger
  AFTER INSERT OR DELETE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_content_counters();

-- ┌──────────────────────────────────────────────────────────┐
-- │  7. RPCs (Remote Procedure Calls)                         │
-- └──────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION toggle_pulse_interaction(
    p_user_id UUID,
    p_target_id UUID,
    p_target_type TEXT,
    p_interaction_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM interactions 
        WHERE user_id = p_user_id AND target_id = p_target_id AND interaction_type = p_interaction_type
    ) INTO v_exists;

    IF v_exists THEN
        DELETE FROM interactions WHERE user_id = p_user_id AND target_id = p_target_id AND interaction_type = p_interaction_type;
        RETURN FALSE;
    ELSE
        INSERT INTO interactions (user_id, target_id, target_type, interaction_type)
        VALUES (p_user_id, p_target_id, p_target_type, p_interaction_type);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compatibility RPCs
CREATE OR REPLACE FUNCTION toggle_post_like_rpc(p_post_id UUID, p_user_id UUID, p_should_like BOOLEAN)
RETURNS JSONB AS $$
BEGIN
    PERFORM toggle_pulse_interaction(p_user_id, p_post_id, 'post', 'like');
    RETURN jsonb_build_object('is_liked', p_should_like, 'likes_count', (SELECT likes_count FROM posts WHERE id = p_post_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_boltz_like_rpc(p_boltz_id UUID, p_user_id UUID, p_should_like BOOLEAN)
RETURNS JSONB AS $$
BEGIN
    PERFORM toggle_pulse_interaction(p_user_id, p_boltz_id, 'boltz', 'like');
    RETURN jsonb_build_object('is_liked', p_should_like, 'likes_count', (SELECT likes_count FROM boltz WHERE id = p_boltz_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark Messages Read RPC
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_conversation_id UUID, p_user_id UUID, p_message_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    IF p_message_id IS NOT NULL THEN
        UPDATE messages SET is_read = TRUE, read_at = NOW(), read_by = array_append(read_by, p_user_id)
        WHERE id = p_message_id AND conversation_id = p_conversation_id AND sender_id != p_user_id;
    ELSE
        UPDATE messages SET is_read = TRUE, read_at = NOW(), read_by = array_append(read_by, p_user_id)
        WHERE conversation_id = p_conversation_id AND sender_id != p_user_id AND is_read = FALSE;
    END IF;
    
    UPDATE conversation_participants SET last_read_at = NOW()
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store Message Key RPC
CREATE OR REPLACE FUNCTION store_message_key(p_message_id UUID, p_recipient_id UUID, p_encrypted_key TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO message_keys (message_id, recipient_id, encrypted_key)
    VALUES (p_message_id, p_recipient_id, p_encrypted_key)
    ON CONFLICT (message_id, recipient_id) DO UPDATE 
    SET encrypted_key = EXCLUDED.encrypted_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Feed Discovery RPCs
CREATE OR REPLACE FUNCTION get_public_feed(p_limit INT, p_offset INT)
RETURNS TABLE (
    id UUID, user_id UUID, username TEXT, display_name TEXT, full_name TEXT, avatar_url TEXT, 
    caption TEXT, media_urls TEXT[], created_at TIMESTAMPTZ, likes_count INT, comments_count INT, 
    is_verified BOOLEAN, trust_tier INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.user_id, pr.username, pr.display_name, pr.full_name, pr.avatar_url, 
           p.caption, p.media_urls, p.created_at, p.likes_count, p.comments_count, 
           pr.is_verified, pr.trust_tier
    FROM posts p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE p.visibility = 'public' AND p.is_archived = FALSE
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_public_boltz_feed(p_limit INT, p_offset INT)
RETURNS TABLE (
    id UUID, user_id UUID, username TEXT, full_name TEXT, avatar_url TEXT, 
    caption TEXT, description TEXT, video_url TEXT, thumbnail_url TEXT, 
    likes_count INT, comments_count INT, is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.user_id, pr.username, pr.full_name, pr.avatar_url, 
           b.caption, b.description, b.video_url, b.thumbnail_url, 
           b.likes_count, b.comments_count, pr.is_verified
    FROM boltz b
    JOIN profiles pr ON b.user_id = pr.id
    ORDER BY b.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ┌──────────────────────────────────────────────────────────┐
-- │  8. SECURITY LAYER (RLS)                                  │
-- └──────────────────────────────────────────────────────────┘

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_shield ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teen_care_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_time_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE focusly_memory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Settings private" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Posts visibility" ON posts FOR SELECT USING (visibility = 'public' OR user_id = auth.uid());
CREATE POLICY "Conversations participants only" ON conversations FOR SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Participants viewable" ON conversation_participants FOR SELECT USING (user_id = auth.uid() OR conversation_id IN (SELECT id FROM conversations WHERE auth.uid() = ANY(participants)));
CREATE POLICY "Messages participants only" ON messages FOR SELECT USING (conversation_id IN (SELECT id FROM conversations WHERE auth.uid() = ANY(participants)));
CREATE POLICY "Messages sender only insert" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Message keys participants only" ON message_keys FOR SELECT USING (recipient_id = auth.uid() OR message_id IN (SELECT id FROM messages WHERE sender_id = auth.uid()));
CREATE POLICY "Calls participants only" ON calls FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "WebRTC signals participants only" ON webrtc_signals FOR ALL USING (auth.uid() = from_user OR call_id IN (SELECT id FROM calls WHERE caller_id = auth.uid() OR receiver_id = auth.uid()));
CREATE POLICY "Support tickets owner only" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Support messages owner only" ON support_ticket_messages FOR SELECT USING (auth.uid() = sender_id OR ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));
CREATE POLICY "Teen Care visibility" ON teen_care_relations FOR SELECT USING (auth.uid() = guardian_id OR auth.uid() = ward_id);
CREATE POLICY "Safety alerts visibility" ON safety_alerts FOR SELECT USING (auth.uid() = guardian_id OR auth.uid() = teen_id);
CREATE POLICY "Focusly memory is private" ON focusly_memory FOR ALL USING (auth.uid() = user_id);

-- ┌──────────────────────────────────────────────────────────┐
-- │  9. PERFORMANCE INDEXES                                  │
-- └──────────────────────────────────────────────────────────┘

CREATE INDEX idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_boltz_created_at ON boltz (created_at DESC);
CREATE INDEX idx_interactions_composite ON interactions (target_id, interaction_type);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_webrtc_call ON webrtc_signals (call_id);
CREATE INDEX idx_teen_logs_teen ON teen_activity_logs (teen_id, created_at DESC);

-- =============================================================
-- ✅ SOVEREIGN MIGRATION V1.5 COMPLETE
-- Focus Ecosystem is now perfectly synchronized for E2EE & WebRTC.
-- "Meet the real people, not fake profiles."
-- =============================================================
