-- =============================================================================
-- 🏛️ SOVEREIGN JUSTICE — REPORT & SUPPORT SYSTEM (FREE, BULLETPROOF)
-- Migration: 20260507000000_sovereign_justice_reports_support.sql
--
-- Features:
-- - reports table (witness flow)
-- - urgency score U = (report_count * 0.7) + (reporter_trust_tier * 0.3)
-- - auto-hide content if U > 5 OR 3 verified reporters
-- - discord webhook alerts via Edge Function notify-sovereign-admin
-- - support_tickets table (embassy flow) + discord alerts for high priority
-- - sovereign heartbeat notification back to reporter via notifications table
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;

-- -----------------------------------------------------------------------------
-- 1) REPORTS TABLE
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='reports') THEN
    CREATE TABLE public.reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      reported_content_id uuid,
      content_type text NOT NULL CHECK (content_type IN ('post','boltz','flash','user')),
      reason text,
      category text,
      description text,
      evidence_urls text[] DEFAULT '{}',
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','resolved','dismissed')),
      admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      admin_action text,
      admin_notes text,
      urgency_score numeric(6,3),
      report_count int,
      reporter_trust_tier int,
      auto_hidden boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz,
      resolved_at timestamptz
    );

    CREATE INDEX idx_reports_content ON public.reports (reported_content_id, content_type, created_at DESC);
    CREATE INDEX idx_reports_reporter ON public.reports (reporter_id, created_at DESC);
    CREATE INDEX idx_reports_status ON public.reports (status, created_at DESC);

    -- Prevent spam: one reporter can only report same target once
    CREATE UNIQUE INDEX idx_reports_unique_reporter_target
      ON public.reports (reporter_id, reported_content_id, content_type)
      WHERE reported_content_id IS NOT NULL;

    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS reports_select_own ON public.reports;
    CREATE POLICY reports_select_own ON public.reports
      FOR SELECT USING (reporter_id = auth.uid() OR auth.role() = 'service_role');

    DROP POLICY IF EXISTS reports_insert_own ON public.reports;
    CREATE POLICY reports_insert_own ON public.reports
      FOR INSERT WITH CHECK (reporter_id = auth.uid());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) SUPPORT TICKETS TABLES
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_tickets') THEN
    CREATE TABLE public.support_tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_number text,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      category text,
      subject text NOT NULL,
      description text NOT NULL,
      attachments text[] DEFAULT '{}',
      priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
      status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
      assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz,
      resolved_at timestamptz
    );

    CREATE INDEX idx_support_tickets_user ON public.support_tickets (user_id, created_at DESC);
    CREATE INDEX idx_support_tickets_status ON public.support_tickets (status, priority, created_at DESC);

    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS support_tickets_select_own ON public.support_tickets;
    CREATE POLICY support_tickets_select_own ON public.support_tickets
      FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

    DROP POLICY IF EXISTS support_tickets_insert_own ON public.support_tickets;
    CREATE POLICY support_tickets_insert_own ON public.support_tickets
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='support_ticket_messages') THEN
    CREATE TABLE public.support_ticket_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message text NOT NULL,
      attachments text[] DEFAULT '{}',
      is_admin boolean NOT NULL DEFAULT false,
      is_internal_note boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_support_ticket_messages_ticket ON public.support_ticket_messages (ticket_id, created_at ASC);

    ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS support_ticket_messages_select ON public.support_ticket_messages;
    CREATE POLICY support_ticket_messages_select ON public.support_ticket_messages
      FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR auth.role() = 'service_role'))
      );

    DROP POLICY IF EXISTS support_ticket_messages_insert ON public.support_ticket_messages;
    CREATE POLICY support_ticket_messages_insert ON public.support_ticket_messages
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR auth.role() = 'service_role'))
      );
  END IF;
END $$;

-- ticket_number auto generation (simple, stable)
CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'TKT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_assign_ticket_number ON public.support_tickets;
    CREATE TRIGGER trg_assign_ticket_number
      BEFORE INSERT ON public.support_tickets
      FOR EACH ROW EXECUTE FUNCTION public.assign_ticket_number();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) HELPERS: trust tier + content hiding
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_reporter_trust_tier(p_user_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE((SELECT trust_tier FROM public.profiles WHERE id = p_user_id), 0);
$$;

CREATE OR REPLACE FUNCTION public.set_reported_content_hidden(
  p_content_type text,
  p_content_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_content_id IS NULL THEN
    RETURN;
  END IF;

  -- Prefer the existing Pillar-2 stealth shield approach (moderation_status).
  IF p_content_type = 'post' AND to_regclass('public.posts') IS NOT NULL THEN
    UPDATE public.posts
      SET moderation_status = 'restricted',
          moderation_reason = COALESCE(p_reason, 'Auto-hidden due to community reports'),
          moderated_at = now(),
          moderator_type = 'community'
      WHERE id = p_content_id;
  ELSIF p_content_type = 'boltz' AND to_regclass('public.boltz') IS NOT NULL THEN
    UPDATE public.boltz
      SET moderation_status = 'restricted',
          moderation_reason = COALESCE(p_reason, 'Auto-hidden due to community reports'),
          moderated_at = now(),
          moderator_type = 'community'
      WHERE id = p_content_id;
  ELSIF p_content_type = 'flash' AND to_regclass('public.flash') IS NOT NULL THEN
    UPDATE public.flash
      SET moderation_status = 'restricted',
          moderation_reason = COALESCE(p_reason, 'Auto-hidden due to community reports'),
          moderated_at = now(),
          moderator_type = 'community'
      WHERE id = p_content_id;
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4) DISCORD + HEARTBEAT: call Edge Function + notify reporter
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_sovereign_admin_service_role_key()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'SOVEREIGN_JUDGE_SERVICE_ROLE_KEY'
  LIMIT 1;

  RETURN v_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sovereign_admin_supabase_url()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'SOVEREIGN_JUDGE_SUPABASE_URL'
  LIMIT 1;

  RETURN v_url;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_reporter_heartbeat(p_reporter_id uuid, p_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.notifications') IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, text, created_at)
    VALUES (p_reporter_id, 'system', p_text, now());
  EXCEPTION WHEN OTHERS THEN
    -- Some deployments use `body` / `read` / different schema. Do not break report flow.
    NULL;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_sovereign_discord(
  p_kind text,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_url text;
  v_req_id bigint;
BEGIN
  v_key := public.get_sovereign_admin_service_role_key();
  v_url := public.get_sovereign_admin_supabase_url();

  IF v_key IS NULL OR length(v_key) < 20 THEN
    RETURN;
  END IF;

  IF v_url IS NULL OR v_url = '' THEN
    RETURN;
  END IF;

  v_req_id := net.http_post(
    url := v_url || '/functions/v1/notify-sovereign-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := p_payload
  );

  -- Fire-and-forget; we intentionally do not collect response.
  PERFORM v_req_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5) REPORT INSERT TRIGGER: compute urgency, auto-hide, discord, heartbeat
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_report_insert_compute_urgency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_count int;
  v_trust_tier int;
  v_urgency numeric(6,3);
  v_verified_reporters int;
  v_reason text;
BEGIN
  -- total reports on same target (including this one)
  SELECT COUNT(*) INTO v_existing_count
  FROM public.reports
  WHERE reported_content_id = NEW.reported_content_id
    AND content_type = NEW.content_type
    AND status IN ('pending','under_review');

  v_trust_tier := public.get_reporter_trust_tier(NEW.reporter_id);

  v_urgency := (v_existing_count * 0.7) + (v_trust_tier * 0.3);

  -- count distinct verified reporters
  SELECT COUNT(DISTINCT r.reporter_id) INTO v_verified_reporters
  FROM public.reports r
  JOIN public.profiles p ON p.id = r.reporter_id
  WHERE r.reported_content_id = NEW.reported_content_id
    AND r.content_type = NEW.content_type
    AND r.status IN ('pending','under_review')
    AND COALESCE(p.is_verified, false) = true;

  UPDATE public.reports
    SET urgency_score = v_urgency,
        report_count = v_existing_count,
        reporter_trust_tier = v_trust_tier,
        updated_at = now()
    WHERE id = NEW.id;

  -- sovereign heartbeat back to reporter
  PERFORM public.notify_reporter_heartbeat(
    NEW.reporter_id,
    'Macha, thank you for protecting our Nation. Your report has been logged.'
  );

  v_reason := COALESCE(NEW.reason, NEW.category, 'Reported content');

  -- Auto-hide condition 1: urgency formula
  IF v_urgency > 5 THEN
    PERFORM public.set_reported_content_hidden(NEW.content_type, NEW.reported_content_id, 'Auto-hidden (U>5): ' || v_reason);

    UPDATE public.reports
      SET auto_hidden = true,
          status = 'under_review',
          updated_at = now()
      WHERE id = NEW.id;

    PERFORM public.notify_sovereign_discord('report', jsonb_build_object(
      'kind', 'report',
      'urgencyScore', v_urgency,
      'contentType', NEW.content_type,
      'targetId', NEW.reported_content_id,
      'reportId', NEW.id,
      'reason', v_reason,
      'reporterId', NEW.reporter_id
    ));
  END IF;

  -- Auto-hide condition 2: 3 verified reporters
  IF v_verified_reporters >= 3 THEN
    PERFORM public.set_reported_content_hidden(NEW.content_type, NEW.reported_content_id, 'Auto-hidden (3 verified reporters): ' || v_reason);

    UPDATE public.reports
      SET auto_hidden = true,
          status = 'under_review',
          updated_at = now()
      WHERE id = NEW.id;

    PERFORM public.notify_sovereign_discord('report', jsonb_build_object(
      'kind', 'report',
      'urgencyScore', v_urgency,
      'contentType', NEW.content_type,
      'targetId', NEW.reported_content_id,
      'reportId', NEW.id,
      'reason', '3 verified reporters threshold',
      'reporterId', NEW.reporter_id
    ));
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.reports') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_reports_compute_urgency ON public.reports;
    CREATE TRIGGER trg_reports_compute_urgency
      AFTER INSERT ON public.reports
      FOR EACH ROW
      EXECUTE FUNCTION public.on_report_insert_compute_urgency();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6) REPORT RESOLUTION TRIGGER: valid report -> strike offender
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_report_update_resolution_strike()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_strike int;
BEGIN
  -- Only when admin marks it resolved+valid
  IF NEW.status = 'resolved' AND COALESCE(NEW.admin_action, '') = 'valid' AND NEW.reported_user_id IS NOT NULL THEN
    SELECT COALESCE(MAX(strike_number), 0) + 1 INTO v_next_strike
    FROM public.content_strikes
    WHERE user_id = NEW.reported_user_id;

    v_next_strike := LEAST(v_next_strike, 3);

    INSERT INTO public.content_strikes (
      user_id,
      strike_number,
      violation_type,
      reason,
      content_id,
      content_type,
      content_snapshot,
      action_taken,
      gemini_explanation
    ) VALUES (
      NEW.reported_user_id,
      v_next_strike,
      COALESCE(NEW.category, 'report_valid'),
      COALESCE(NEW.reason, 'Valid community report'),
      NEW.reported_content_id,
      NEW.content_type,
      COALESCE(NEW.description, ''),
      CASE WHEN v_next_strike = 1 THEN 'warning' WHEN v_next_strike = 2 THEN 'shadow_ban' ELSE 'quarantine' END,
      COALESCE(NEW.admin_notes, 'Valid report confirmed by admin')
    );

    UPDATE public.profiles
      SET strike_count = v_next_strike,
          account_status = CASE WHEN v_next_strike >= 3 THEN 'QUARANTINED' ELSE COALESCE(account_status, 'ACTIVE') END,
          is_restricted = CASE WHEN v_next_strike >= 3 THEN true ELSE COALESCE(is_restricted, false) END,
          updated_at = now()
      WHERE id = NEW.reported_user_id;
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.reports') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_reports_resolution_strike ON public.reports;
    CREATE TRIGGER trg_reports_resolution_strike
      AFTER UPDATE ON public.reports
      FOR EACH ROW
      EXECUTE FUNCTION public.on_report_update_resolution_strike();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7) SUPPORT TICKET DISCORD ALERTS (urgent/high)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_support_ticket_insert_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority IN ('urgent', 'high') THEN
    PERFORM public.notify_sovereign_discord('support_ticket', jsonb_build_object(
      'kind', 'support_ticket',
      'priority', NEW.priority,
      'ticketId', NEW.id,
      'subject', NEW.subject,
      'message', NEW.description,
      'userId', NEW.user_id
    ));
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_support_ticket_discord ON public.support_tickets;
    CREATE TRIGGER trg_support_ticket_discord
      AFTER INSERT ON public.support_tickets
      FOR EACH ROW
      EXECUTE FUNCTION public.on_support_ticket_insert_notify();
  END IF;
END $$;
