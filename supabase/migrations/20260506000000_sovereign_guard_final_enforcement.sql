-- =============================================================================
-- 🛡️  SOVEREIGN GUARD — FINAL BACKEND ENFORCEMENT
-- Migration: 20260506000000_sovereign_guard_final_enforcement.sql
-- Enforces moderation via DB trigger -> Edge Function sovereign-judge.
-- Tables: posts, boltz, flash
-- =============================================================================

-- Network + secrets support
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vault;

-- Profiles restriction flag (3 strikes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_restricted'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_restricted boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Pull the service-role key for sovereign-judge from Vault.
-- You must store it once in Supabase SQL Editor:
--   select vault.create_secret('SOVEREIGN_JUDGE_SERVICE_ROLE_KEY', '<your service role key>');
CREATE OR REPLACE FUNCTION public.get_sovereign_judge_service_role_key()
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

-- Pull the project URL (e.g. https://xxxx.supabase.co) from Vault.
-- Store it once:
--   select vault.create_secret('SOVEREIGN_JUDGE_SUPABASE_URL', 'https://<project-ref>.supabase.co');
CREATE OR REPLACE FUNCTION public.get_sovereign_judge_supabase_url()
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

-- Main interception function.
-- Calls Edge Function synchronously and blocks INSERT on restricted verdict.
CREATE OR REPLACE FUNCTION public.handle_content_moderation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_key text;
  v_url text;
  v_payload jsonb;
  v_req_id bigint;
  v_resp jsonb;
  v_status int;
  v_body text;
  v_verdict jsonb;
  v_mod_status text;
  v_reason text;
BEGIN
  v_service_key := public.get_sovereign_judge_service_role_key();

  v_url := public.get_sovereign_judge_supabase_url();

  IF v_service_key IS NULL OR length(v_service_key) < 20 THEN
    RAISE EXCEPTION 'Sovereign Guard misconfigured: missing SOVEREIGN_JUDGE_SERVICE_ROLE_KEY in Vault';
  END IF;

  IF v_url IS NULL OR v_url = '' THEN
    RAISE EXCEPTION 'Sovereign Guard misconfigured: missing SOVEREIGN_JUDGE_SUPABASE_URL in Vault';
  END IF;

  v_url := v_url || '/functions/v1/sovereign-judge';

  -- Ensure NEW.id exists so logs can reference it even if we block.
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'contentId', NEW.id,
    'userId', NEW.user_id
  );

  IF TG_TABLE_NAME = 'posts' THEN
    v_payload := v_payload || jsonb_build_object(
      'text', NEW.caption,
      'mediaUrl', NEW.media_url
    );
  ELSIF TG_TABLE_NAME = 'boltz' THEN
    v_payload := v_payload || jsonb_build_object(
      'text', NEW.description,
      'mediaUrl', NEW.video_url
    );
  ELSIF TG_TABLE_NAME = 'flash' THEN
    v_payload := v_payload || jsonb_build_object(
      'text', NULL,
      'mediaUrl', NEW.media_url,
      'mediaType', NEW.media_type
    );
  END IF;

  v_req_id := net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := v_payload
  );

  SELECT
    (r->>'status')::int,
    r->>'body'
  INTO v_status, v_body
  FROM net.http_collect_response(v_req_id, 6000) r;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Sovereign Judge timeout';
  END IF;

  BEGIN
    v_verdict := v_body::jsonb;
  EXCEPTION WHEN OTHERS THEN
    v_verdict := '{}'::jsonb;
  END;

  v_mod_status := COALESCE(v_verdict->>'moderationStatus', 'flagged');
  v_reason := COALESCE(v_verdict->>'reason', 'Blocked by Sovereign Guard');

  IF v_mod_status = 'restricted' THEN
    -- Block insert entirely.
    RAISE EXCEPTION 'Sovereign Guard blocked this content: %', v_reason;
  END IF;

  -- If allowed, stamp the row with the final verdict.
  -- (Only if the columns exist — many migrations are inconsistent across environments.)
  BEGIN
    NEW.moderation_status := v_mod_status;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    NEW.moderation_reason := NULLIF(v_reason, '');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    NEW.moderation_score := (v_verdict->>'confidence')::numeric;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    NEW.moderation_categories := ARRAY(SELECT jsonb_array_elements_text(COALESCE(v_verdict->'categories', '[]'::jsonb)));
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    NEW.moderated_at := NOW();
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    NEW.moderator_type := 'sovereign_judge';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

-- Attach triggers (idempotent)
DO $$
BEGIN
  IF to_regclass('public.posts') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_sovereign_guard_posts ON public.posts;
    CREATE TRIGGER trg_sovereign_guard_posts
    BEFORE INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_content_moderation();
  END IF;

  IF to_regclass('public.boltz') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_sovereign_guard_boltz ON public.boltz;
    CREATE TRIGGER trg_sovereign_guard_boltz
    BEFORE INSERT ON public.boltz
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_content_moderation();
  END IF;

  IF to_regclass('public.flash') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_sovereign_guard_flash ON public.flash;
    CREATE TRIGGER trg_sovereign_guard_flash
    BEFORE INSERT ON public.flash
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_content_moderation();
  END IF;
END $$;
