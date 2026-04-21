-- =============================================================================
-- 🚑  PILLAR 5 — REPORT & SUPPORT (The Life-Line)
-- Migration: 20260421030000_pillar5_report_support.sql
-- H2 Innovative — Audit-Based Safety + Focusly First-Responder
-- =============================================================================
-- Builds on top of /app/database/reports-support-schema.sql. Adds the AI
-- layer required by the spec:
--   1. Automated Safety Audit output persisted on every report
--   2. ticket_messages.author_type so Focusly can speak as a first-responder
--   3. Helper RPC `run_safety_audit(report_id)` - stub; actual Gemini call
--      happens in the Edge Function `safety-audit` and updates the row.
-- =============================================================================

-- ── 1. Reports: AI audit output columns (idempotent) ────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reports') THEN
        ALTER TABLE public.reports
            ADD COLUMN IF NOT EXISTS ai_audit_status TEXT
                CHECK (ai_audit_status IN ('pending', 'running', 'complete', 'failed') OR ai_audit_status IS NULL)
                DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS ai_severity TEXT
                CHECK (ai_severity IN ('critical', 'high', 'medium', 'low', 'inconclusive') OR ai_severity IS NULL),
            ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(4,3),
            ADD COLUMN IF NOT EXISTS ai_recommended_action TEXT
                CHECK (ai_recommended_action IN ('ban_immediate', 'shadow_ban', 'warn_user', 'temporary_suspension', 'monitor', 'dismiss') OR ai_recommended_action IS NULL),
            ADD COLUMN IF NOT EXISTS ai_summary TEXT,
            ADD COLUMN IF NOT EXISTS ai_evidence JSONB,
            ADD COLUMN IF NOT EXISTS ai_audited_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS ai_gemini_raw JSONB;

        CREATE INDEX IF NOT EXISTS idx_reports_ai_severity ON public.reports (ai_severity, status) WHERE ai_severity IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_reports_ai_audit_status ON public.reports (ai_audit_status);
    END IF;
END $$;

-- ── 2. support_ticket_messages: author_type so Focusly can post ──────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_ticket_messages') THEN
        ALTER TABLE public.support_ticket_messages
            ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'user'
                CHECK (author_type IN ('user', 'staff', 'focusly', 'system'));
        CREATE INDEX IF NOT EXISTS idx_ticket_messages_author_type ON public.support_ticket_messages (ticket_id, author_type, created_at DESC);
    END IF;
END $$;

-- ── 3. RPC: fetch target user's last 10 public interactions ────────────────
-- Called by the safety-audit Edge Function. SECURITY DEFINER so it can read
-- across RLS boundaries (the AI gets a god-view on the REPORTED user only).
CREATE OR REPLACE FUNCTION public.get_user_activity_snapshot(
    p_user_id UUID,
    p_limit   INTEGER DEFAULT 10
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _profile  JSONB;
    _posts    JSONB;
    _comments JSONB;
    _reports_against INTEGER := 0;
BEGIN
    -- Basic profile metadata (no private fields)
    SELECT to_jsonb(p) - 'guardian_email' - 'guardian_consent_token' - 'identity_hash' - 'phone'
      INTO _profile
      FROM (
          SELECT id, username, full_name, created_at, is_teen_mode,
                 trust_score, followers_count, following_count
            FROM public.profiles
           WHERE id = p_user_id
      ) p;

    -- Last N posts (full content)
    SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb) INTO _posts
      FROM (
          SELECT id, caption, media_url, type,
                 moderation_status, moderation_reason, moderation_categories,
                 created_at
            FROM public.posts
           WHERE user_id = p_user_id
           ORDER BY created_at DESC
           LIMIT p_limit
      ) x;

    -- Last N comments (if comments table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='comments') THEN
        EXECUTE format(
            'SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), ''[]''::jsonb)
               FROM (SELECT id, content, moderation_status, moderation_reason, created_at
                       FROM public.comments
                      WHERE user_id = $1
                   ORDER BY created_at DESC
                      LIMIT %s) x', p_limit)
            INTO _comments
            USING p_user_id;
    ELSE
        _comments := '[]'::jsonb;
    END IF;

    -- How many times this user has been reported recently
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reports') THEN
        SELECT COUNT(*) INTO _reports_against
          FROM public.reports
         WHERE reported_user_id = p_user_id
           AND created_at > NOW() - INTERVAL '30 days';
    END IF;

    RETURN jsonb_build_object(
        'profile', _profile,
        'recent_posts', _posts,
        'recent_comments', _comments,
        'reports_against_last_30d', _reports_against,
        'snapshot_taken_at', NOW()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_activity_snapshot(UUID, INTEGER) TO service_role;

-- ── 4. Convenience view for the admin moderation queue ──────────────────────
CREATE OR REPLACE VIEW public.v_reports_triaged AS
    SELECT r.*,
           CASE
             WHEN r.ai_severity = 'critical' THEN 1
             WHEN r.ai_severity = 'high'     THEN 2
             WHEN r.ai_severity = 'medium'   THEN 3
             WHEN r.ai_severity = 'low'      THEN 4
             ELSE 5
           END AS ai_priority_rank
      FROM public.reports r
     WHERE r.status = 'pending'
     ORDER BY ai_priority_rank ASC, r.created_at ASC;

-- =============================================================================
-- ✅ PILLAR 5 MIGRATION COMPLETE — Safety Audit + Focusly First-Responder ready
-- =============================================================================
DO $$ BEGIN RAISE NOTICE 'Pillar 5: ai_audit_* columns + activity snapshot RPC + ticket author_type deployed.'; END $$;
