-- =============================================================
-- 🏛️ H2 INNOVATIVE — FIVE PILLARS SQL MIGRATION
-- Focus Platform v3.0 — The Constitution of Focus
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  PILLAR 1: TRUST SHIELD — Identity & Device Tables       │
-- └──────────────────────────────────────────────────────────┘

-- Verification Audit Trail (enhanced — may already exist)
CREATE TABLE IF NOT EXISTS verification_audit_trail (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id   TEXT,
    stage       TEXT NOT NULL,
    result      TEXT NOT NULL,  -- 'PASS', 'FAIL', 'PENDING'
    reason      TEXT,
    score       FLOAT,
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian Approvals (enhanced — may already exist)
CREATE TABLE IF NOT EXISTS guardian_approvals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teen_user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
    handshake_token  TEXT UNIQUE NOT NULL,
    approval_status  TEXT DEFAULT 'PENDING',  -- 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'
    guardian_name    TEXT,
    guardian_email   TEXT,
    guardian_phone   TEXT,
    qr_code_url      TEXT,
    approved_at      TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    metadata         JSONB DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Device Registry (enhanced)
CREATE TABLE IF NOT EXISTS user_devices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_hash    TEXT NOT NULL,
    device_info    JSONB DEFAULT '{}'::jsonb,
    is_suspicious  BOOLEAN DEFAULT false,
    is_primary     BOOLEAN DEFAULT false,
    last_active    TIMESTAMPTZ DEFAULT NOW(),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(device_hash)  -- One device = one account, period.
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  PILLAR 2: CONTENT MODERATOR — Strike System Tables      │
-- └──────────────────────────────────────────────────────────┘

-- Content Strikes (The 3-Strike System)
CREATE TABLE IF NOT EXISTS content_strikes (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                    UUID REFERENCES profiles(id) ON DELETE CASCADE,
    strike_number              INT NOT NULL,
    reason                     TEXT NOT NULL,
    violation_type             TEXT NOT NULL,  -- 'nsfw', 'hate_speech', 'violence', 'propaganda', 'spam'
    content_id                 UUID,
    content_type               TEXT,  -- 'post', 'comment', 'message', 'boltz'
    content_snapshot           TEXT,  -- Truncated content that triggered the flag
    action_taken               TEXT NOT NULL,  -- 'warning', 'shadow_ban', 'quarantine'
    shadow_ban_until           TIMESTAMPTZ,
    educational_acknowledged   BOOLEAN DEFAULT false,
    acknowledged_at            TIMESTAMPTZ,
    gemini_explanation         TEXT,  -- AI-generated explanation of why it was blocked
    scan_metadata              JSONB DEFAULT '{}'::jsonb,
    created_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation Log (Full audit trail for admin)
CREATE TABLE IF NOT EXISTS moderation_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content_id      UUID,
    content_type    TEXT,
    action          TEXT NOT NULL,  -- 'auto_blocked', 'flagged', 'admin_reviewed', 'appeal_accepted'
    reason          TEXT,
    nsfw_score      FLOAT DEFAULT 0,
    toxicity_score  FLOAT DEFAULT 0,
    violence_score  FLOAT DEFAULT 0,
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add shadow_ban columns to profiles (safe ALTER — no-op if exists)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS shadow_banned_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE',  -- 'ACTIVE', 'SHADOW_BANNED', 'QUARANTINED', 'SUSPENDED'
    ADD COLUMN IF NOT EXISTS strike_count INT DEFAULT 0;

-- ┌──────────────────────────────────────────────────────────┐
-- │  PILLAR 3: FOCUSLY AI — Memory Palace Tables             │
-- └──────────────────────────────────────────────────────────┘

-- Focusly Memory Palace (Long-term user memory)
CREATE TABLE IF NOT EXISTS focusly_memory (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
    memory_key    TEXT NOT NULL,
    memory_value  JSONB NOT NULL,
    category      TEXT NOT NULL DEFAULT 'general',  -- 'personal_info', 'goals', 'achievements', 'family', 'academic', 'emotional'
    importance    INT DEFAULT 5,  -- 1-10 importance weight
    source        TEXT DEFAULT 'extracted',  -- 'extracted', 'explicit', 'inferred'
    last_recalled TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, memory_key)
);

-- Focusly Presence Tracking (Inactivity detection)
CREATE TABLE IF NOT EXISTS focusly_presence (
    user_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    last_post_at       TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    inactivity_nudge_sent BOOLEAN DEFAULT false,
    nudge_sent_at      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  PILLAR 4: TEEN CARE — Safety Tables                     │
-- └──────────────────────────────────────────────────────────┘

-- DM Restrictions (Adult → Teen messaging filter)
CREATE TABLE IF NOT EXISTS dm_restrictions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
    restriction_reason TEXT NOT NULL,  -- 'unverified_adult', 'not_in_contacts', 'blocked_by_guardian'
    attempted_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Life Break Logs (45-min Boltz break tracking)
CREATE TABLE IF NOT EXISTS life_break_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
    triggered_at          TIMESTAMPTZ DEFAULT NOW(),
    break_taken           BOOLEAN DEFAULT false,
    activity_chosen       TEXT,
    duration_before_break INT NOT NULL,  -- Minutes on Boltz before nudge
    snooze_count          INT DEFAULT 0,
    completed_at          TIMESTAMPTZ
);

-- ┌──────────────────────────────────────────────────────────┐
-- │  PILLAR 5: REPORT & SUPPORT — Escalation Tables          │
-- └──────────────────────────────────────────────────────────┘

-- Support Escalations (Critical cases requiring human)
CREATE TABLE IF NOT EXISTS support_escalations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
    report_id        UUID,  -- References the original report if applicable
    escalation_type  TEXT NOT NULL,  -- 'distress', 'identity_fraud', 'safety', 'abuse'
    priority         TEXT NOT NULL DEFAULT 'MEDIUM',  -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    status           TEXT NOT NULL DEFAULT 'OPEN',  -- 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    triage_result    JSONB DEFAULT '{}'::jsonb,  -- AI triage output
    distress_signals TEXT[],  -- Detected distress keywords
    assigned_to      UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at      TIMESTAMPTZ,
    resolution_notes TEXT,
    sla_deadline     TIMESTAMPTZ,  -- For CRITICAL: now + 5 mins
    resolved_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 🔒 RLS POLICIES — Row Level Security
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all new tables
ALTER TABLE content_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE focusly_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE focusly_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_break_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- ── content_strikes ──────────────────────────────────────
CREATE POLICY "Users can view their own strikes" ON content_strikes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert strikes" ON content_strikes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all strikes" ON content_strikes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can acknowledge their strikes" ON content_strikes
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── moderation_log ────────────────────────────────────────
CREATE POLICY "Admins can view moderation log" ON moderation_log
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "System can insert moderation logs" ON moderation_log
    FOR INSERT WITH CHECK (true);

-- ── focusly_memory ───────────────────────────────────────
CREATE POLICY "Users can manage their own memories" ON focusly_memory
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── focusly_presence ─────────────────────────────────────
CREATE POLICY "Users can manage their own presence" ON focusly_presence
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ── dm_restrictions ──────────────────────────────────────
CREATE POLICY "System can manage dm restrictions" ON dm_restrictions
    FOR ALL WITH CHECK (true);

CREATE POLICY "Users can view their restrictions" ON dm_restrictions
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ── life_break_logs ──────────────────────────────────────
CREATE POLICY "Users can manage their break logs" ON life_break_logs
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guardians can view teen break logs" ON life_break_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guardian_relationships
            WHERE guardian_id = auth.uid()
              AND teen_id = life_break_logs.user_id
              AND status = 'active'
        )
    );

-- ── support_escalations ──────────────────────────────────
CREATE POLICY "Users can view their own escalations" ON support_escalations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert escalations" ON support_escalations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all escalations" ON support_escalations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ── verification_audit_trail ─────────────────────────────
CREATE POLICY "Users can view their own audit trail" ON verification_audit_trail
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit records" ON verification_audit_trail
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all audit records" ON verification_audit_trail
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ── guardian_approvals ────────────────────────────────────
CREATE POLICY "Teens can view their own guardian approvals" ON guardian_approvals
    FOR SELECT USING (auth.uid() = teen_user_id);

CREATE POLICY "System can manage guardian approvals" ON guardian_approvals
    FOR ALL WITH CHECK (true);

-- ── user_devices ─────────────────────────────────────────
CREATE POLICY "Users can view their own devices" ON user_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage devices" ON user_devices
    FOR ALL WITH CHECK (true);

CREATE POLICY "Admins can view all devices" ON user_devices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ═══════════════════════════════════════════════════════════
-- 📊 INDEXES — Performance Optimization
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_content_strikes_user_id ON content_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_strikes_created ON content_strikes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_log_user ON moderation_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focusly_memory_user ON focusly_memory(user_id, category);
CREATE INDEX IF NOT EXISTS idx_focusly_presence_user ON focusly_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_life_break_logs_user ON life_break_logs(user_id, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_escalations_status ON support_escalations(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_devices_hash ON user_devices(device_hash);
CREATE INDEX IF NOT EXISTS idx_guardian_approvals_token ON guardian_approvals(handshake_token);

-- ═══════════════════════════════════════════════════════════
-- 🤖 FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-update presence when user interacts
CREATE OR REPLACE FUNCTION update_focusly_presence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO focusly_presence (user_id, last_interaction_at)
    VALUES (NEW.user_id, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        last_interaction_at = NOW(),
        inactivity_nudge_sent = false,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on posts to update presence
DROP TRIGGER IF EXISTS posts_update_presence ON posts;
CREATE TRIGGER posts_update_presence
    AFTER INSERT ON posts
    FOR EACH ROW EXECUTE FUNCTION update_focusly_presence();

-- Auto-update strike_count on profiles when strike inserted
CREATE OR REPLACE FUNCTION sync_strike_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET strike_count = (
        SELECT COUNT(*) FROM content_strikes WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS content_strikes_sync_count ON content_strikes;
CREATE TRIGGER content_strikes_sync_count
    AFTER INSERT ON content_strikes
    FOR EACH ROW EXECUTE FUNCTION sync_strike_count();

-- Auto-set SLA deadline for CRITICAL escalations (5-minute SLA)
CREATE OR REPLACE FUNCTION set_escalation_sla()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.priority = 'CRITICAL' THEN
        NEW.sla_deadline = NOW() + INTERVAL '5 minutes';
    ELSIF NEW.priority = 'HIGH' THEN
        NEW.sla_deadline = NOW() + INTERVAL '30 minutes';
    ELSIF NEW.priority = 'MEDIUM' THEN
        NEW.sla_deadline = NOW() + INTERVAL '4 hours';
    ELSE
        NEW.sla_deadline = NOW() + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escalations_set_sla ON support_escalations;
CREATE TRIGGER escalations_set_sla
    BEFORE INSERT ON support_escalations
    FOR EACH ROW EXECUTE FUNCTION set_escalation_sla();

-- ═══════════════════════════════════════════════════════════
-- ✅ MIGRATION COMPLETE
-- H2 Innovative — Focus Platform v3.0
-- "Built by a Graduate with Distinction who cares."
-- ═══════════════════════════════════════════════════════════
