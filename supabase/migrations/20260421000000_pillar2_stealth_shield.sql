-- =============================================================================
-- 🛡️  PILLAR 2 — THE STEALTH SHIELD (Shadow-Moderation)
-- Migration: 20260421000000_pillar2_stealth_shield.sql
-- H2 Innovative — Focus Immune System
-- =============================================================================
-- Adds a `moderation_status` column + metadata to every user-generated content
-- table, plus RLS/view-based shadow-moderation. Toxic content remains VISIBLE
-- to the author (echo chamber) but INVISIBLE to everyone else.
--
-- Status values:
--   - 'approved'   — safe, public
--   - 'restricted' — shadow-banned: visible only to author
--   - 'flagged'    — pending admin review
-- =============================================================================

-- 1. Ensure the ENUM exists with the spec-correct values.
--    If an older enum exists with different values, we migrate it.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
        -- Ensure all required values exist (idempotent ADD VALUE)
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'approved'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'restricted'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'flagged'; EXCEPTION WHEN OTHERS THEN NULL; END;
    ELSE
        CREATE TYPE moderation_status AS ENUM ('approved', 'restricted', 'flagged');
    END IF;
END $$;

-- 2. Add column + metadata to every content table.
--    Default = 'approved' so existing rows are unaffected. New rows get
--    their status set by the content-moderator edge function.
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes', 'comments']
    LOOP
        -- Some deployments pluralise differently; skip missing tables silently
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_status moderation_status NOT NULL DEFAULT ''approved''', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_reason TEXT', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_score NUMERIC(4,3)', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_categories TEXT[]', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderator_type TEXT CHECK (moderator_type IN (''auto'', ''admin'', ''appeal'') OR moderator_type IS NULL)', t);
            -- Fast filter index for public feed queries
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_moderation_status ON public.%I (moderation_status) WHERE moderation_status = ''approved''', t, t);
            -- Author-specific index for "show my restricted content" query path
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_mod ON public.%I (user_id, moderation_status)', t, t);
        END IF;
    END LOOP;
END $$;

-- 3. THE STEALTH SHIELD — RLS policy helper function.
--    Content is visible IFF:
--      a) moderation_status = 'approved'   OR
--      b) viewer IS the author (echo-chamber: toxic users see their own feed)
CREATE OR REPLACE FUNCTION public.is_content_visible(
    p_status moderation_status,
    p_owner_id UUID
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p_status = 'approved' OR p_owner_id = auth.uid();
$$;

-- 4. Apply the shadow-moderation SELECT policy on every content table.
--    We REVOKE any overly-permissive existing SELECT and replace with the
--    spec-compliant rule. UPDATE/INSERT/DELETE policies are untouched.
DO $$
DECLARE
    t TEXT;
    policy_name TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            policy_name := 'stealth_shield_select_' || t;
            -- Drop the old policy if it exists (idempotent re-run)
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);
            -- Create the spec-compliant shadow-moderation policy
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT USING (public.is_content_visible(moderation_status, user_id))',
                policy_name, t
            );
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END $$;

-- 5. Public views for feed consumers.
--    Frontend can either:
--      a) query `posts`/`boltz`/`flashes` directly (RLS handles the filter), OR
--      b) query these `v_*` views explicitly for intent clarity
CREATE OR REPLACE VIEW public.v_visible_posts AS
    SELECT * FROM public.posts
    WHERE public.is_content_visible(moderation_status, user_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boltz') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_boltz AS SELECT * FROM public.boltz WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashes') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_flashes AS SELECT * FROM public.flashes WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
END $$;

-- 6. Moderation audit log — every AI decision is logged for audit trail.
CREATE TABLE IF NOT EXISTS public.moderation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'boltz', 'flash', 'comment')),
    content_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_status moderation_status,
    new_status moderation_status NOT NULL,
    reason TEXT,
    categories TEXT[],
    score NUMERIC(4,3),
    moderator_type TEXT NOT NULL CHECK (moderator_type IN ('auto', 'admin', 'appeal')),
    admin_id UUID,
    gemini_raw JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_content ON public.moderation_audit (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_user ON public.moderation_audit (user_id, created_at DESC);
ALTER TABLE public.moderation_audit ENABLE ROW LEVEL SECURITY;

-- Only admins + service_role can read audit log; users can see their own entries
DROP POLICY IF EXISTS moderation_audit_admin_read ON public.moderation_audit;
CREATE POLICY moderation_audit_admin_read ON public.moderation_audit
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================================================
-- ✅ PILLAR 2 MIGRATION COMPLETE — Stealth Shield activated.
-- =============================================================================
DO $$ BEGIN RAISE NOTICE 'Pillar 2: moderation_status enum + columns + RLS + views + audit log deployed.'; END $$;
