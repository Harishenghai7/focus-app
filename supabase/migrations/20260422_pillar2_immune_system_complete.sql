-- =============================================================================
-- 🛡️  PILLAR 2 — THE IMMUNE SYSTEM (Content Moderation)
-- Migration: 20260422_pillar2_immune_system_complete.sql
-- H2 Innovative — Focus Content Filter & Moderator
-- =============================================================================
-- Shadow-moderation with zero tolerance for toxicity:
--   - AI-powered content classification
--   - Stealth shield (restricted content only visible to author)
--   - Complete moderation audit trail
--   - No blurs, no censors — just total isolation of toxicity
-- =============================================================================

-- =============================================================================
-- 1. MODERATION STATUS ENUM
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_status') THEN
        CREATE TYPE moderation_status AS ENUM (
            'approved',     -- Safe, publicly visible
            'restricted',   -- Shadow-banned: visible only to author
            'flagged'       -- Pending admin review
        );
    ELSE
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'approved'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'restricted'; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TYPE moderation_status ADD VALUE IF NOT EXISTS 'flagged'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- =============================================================================
-- 2. TOXICITY TYPE ENUM (Classification categories)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toxicity_type') THEN
        CREATE TYPE toxicity_type AS ENUM (
            'safe',
            'nsfw',             -- Adult/sexual content
            'hate',             -- Hate speech, discrimination
            'violence',         -- Graphic violence, threats
            'self_harm',        -- Self-harm, suicide promotion
            'bullying',         -- Harassment, personal attacks
            'misinformation',   -- False/misleading information
            'spam',             -- Unwanted promotional content
            'negative_loop'     -- Hopelessness/nihilism spreaders
        );
    END IF;
END $$;

-- =============================================================================
-- 3. MODERATOR TYPE ENUM
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderator_type') THEN
        CREATE TYPE moderator_type AS ENUM ('auto', 'admin', 'appeal');
    END IF;
END $$;

-- =============================================================================
-- 4. ADD MODERATION COLUMNS TO CONTENT TABLES
-- =============================================================================
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes', 'comments']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Core moderation status
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_status moderation_status NOT NULL DEFAULT ''approved''', t);

            -- Classification details
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS toxicity_type toxicity_type', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_severity TEXT CHECK (moderation_severity IN (''none'', ''low'', ''medium'', ''high'', ''critical''))', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_score NUMERIC(4,3)', t);  -- 0.000-1.000 confidence
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_categories TEXT[]', t);   -- e.g., ['nudity', 'sexual_content']
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_reason TEXT', t);         -- Human-readable explanation
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_suggestion TEXT', t);     -- How to fix (if applicable)

            -- Audit fields
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderator_type moderator_type DEFAULT ''auto''', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderator_id UUID', t);              -- Admin who reviewed (if manual)
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_model TEXT', t);          -- AI model used (e.g., 'tensorflow-toxicity')
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_raw JSONB', t);           -- Raw AI response for debugging

            -- Review workflow
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMPTZ', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_appealed BOOLEAN DEFAULT FALSE', t);
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS moderation_appealed_at TIMESTAMPTZ', t);

            -- Performance indexes
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_moderation_status ON public.%I (moderation_status) WHERE moderation_status != ''approved''', t, t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_moderation ON public.%I (user_id, moderation_status)', t, t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_flagged ON public.%I (moderation_status, moderated_at) WHERE moderation_status = ''flagged''', t, t);
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_toxicity ON public.%I (toxicity_type, moderation_score) WHERE toxicity_type IS NOT NULL', t, t);

            RAISE NOTICE 'Added moderation columns to table: %', t;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 5. THE STEALTH SHIELD — CONTENT VISIBILITY FUNCTION
-- =============================================================================
-- Core logic: Content is visible IFF:
--   a) moderation_status = 'approved' OR
--   b) viewer IS the author (echo chamber)
CREATE OR REPLACE FUNCTION public.is_content_visible(
    p_status moderation_status,
    p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p_status = 'approved' OR p_owner_id = auth.uid();
$$;

-- =============================================================================
-- 6. APPLY STEALTH SHIELD RLS POLICIES
-- =============================================================================
DO $$
DECLARE
    t TEXT;
    policy_name TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            policy_name := 'stealth_shield_select_' || t;

            -- Drop old policy if exists
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);

            -- Create spec-compliant shadow-moderation policy
            EXECUTE format(
                'CREATE POLICY %I ON public.%I FOR SELECT
                 USING (public.is_content_visible(moderation_status, user_id))',
                policy_name, t
            );

            -- Ensure RLS is enabled
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

            RAISE NOTICE 'Applied stealth shield policy to table: %', t;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- 7. PUBLIC VIEWS FOR FEED CONSUMERS (Explicit intent)
-- =============================================================================
-- Posts view (only visible content)
CREATE OR REPLACE VIEW public.v_visible_posts AS
    SELECT * FROM public.posts
    WHERE public.is_content_visible(moderation_status, user_id);

-- Boltz view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boltz') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_boltz AS
                 SELECT * FROM public.boltz
                 WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
END $$;

-- Flashes view
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashes') THEN
        EXECUTE 'CREATE OR REPLACE VIEW public.v_visible_flashes AS
                 SELECT * FROM public.flashes
                 WHERE public.is_content_visible(moderation_status, user_id)';
    END IF;
END $$;

-- =============================================================================
-- 8. MODERATION AUDIT LOG (Every AI decision tracked)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.moderation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Content reference
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'boltz', 'flash', 'comment', 'message')),
    content_id UUID NOT NULL,
    content_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Classification
    old_status moderation_status,
    new_status moderation_status NOT NULL,
    toxicity_type toxicity_type,
    severity TEXT,
    score NUMERIC(4,3),
    categories TEXT[],
    reason TEXT,

    -- Source tracking
    moderator_type moderator_type NOT NULL,
    moderator_id UUID,  -- Admin who made decision (if manual)
    ai_model TEXT,      -- 'tensorflow-toxicity', 'nsfwjs', 'ollama-llama3', etc.
    ai_raw_response JSONB,

    -- Context
    client_ip INET,
    user_agent TEXT,
    processing_time_ms INTEGER,  -- How long analysis took

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_content ON public.moderation_audit (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_user ON public.moderation_audit (content_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_status ON public.moderation_audit (new_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_type ON public.moderation_audit (toxicity_type) WHERE toxicity_type IS NOT NULL;

ALTER TABLE public.moderation_audit ENABLE ROW LEVEL SECURITY;

-- Only admins, service_role, and content owners can see audit entries
DROP POLICY IF EXISTS moderation_audit_read ON public.moderation_audit;
CREATE POLICY moderation_audit_read ON public.moderation_audit
    FOR SELECT USING (
        auth.role() = 'service_role'
        OR content_user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================================================
-- 9. MODERATION QUEUE VIEW (For Admin Dashboard)
-- =============================================================================
CREATE OR REPLACE VIEW public.v_moderation_queue AS
    SELECT
        'post' as content_type,
        p.id as content_id,
        p.user_id as content_user_id,
        u.username,
        u.full_name,
        p.caption as content_preview,
        p.moderation_status,
        p.toxicity_type,
        p.moderation_score,
        p.moderation_categories,
        p.moderation_reason,
        p.moderated_at,
        p.moderation_appealed,
        p.media_url
    FROM public.posts p
    JOIN public.profiles u ON p.user_id = u.id
    WHERE p.moderation_status IN ('flagged', 'restricted')

    UNION ALL

    SELECT
        'boltz' as content_type,
        b.id as content_id,
        b.user_id as content_user_id,
        u.username,
        u.full_name,
        b.description as content_preview,
        b.moderation_status,
        b.toxicity_type,
        b.moderation_score,
        b.moderation_categories,
        b.moderation_reason,
        b.moderated_at,
        b.moderation_appealed,
        b.video_url as media_url
    FROM public.boltz b
    JOIN public.profiles u ON b.user_id = u.id
    WHERE b.moderation_status IN ('flagged', 'restricted')

    UNION ALL

    SELECT
        'flash' as content_type,
        f.id as content_id,
        f.user_id as content_user_id,
        u.username,
        u.full_name,
        NULL as content_preview,
        f.moderation_status,
        f.toxicity_type,
        f.moderation_score,
        f.moderation_categories,
        f.moderation_reason,
        f.moderated_at,
        f.moderation_appealed,
        f.media_url
    FROM public.flashes f
    JOIN public.profiles u ON f.user_id = u.id
    WHERE f.moderation_status IN ('flagged', 'restricted')

    ORDER BY moderated_at DESC;

-- =============================================================================
-- 10. AUTO-MODERATION TRIGGER (On Content Insert)
-- =============================================================================
-- This trigger can be used to auto-flag suspicious content patterns
-- Full AI moderation happens client-side or via edge function, but this
-- provides a server-side safety net
CREATE OR REPLACE FUNCTION public.auto_moderation_check()
RETURNS TRIGGER AS $$
DECLARE
    has_suspicious_pattern BOOLEAN := FALSE;
    detected_categories TEXT[] := '{}';
    suspicion_score NUMERIC(4,3) := 0;
BEGIN
    -- Skip if already moderated (edge case)
    IF NEW.moderation_status != 'approved' THEN
        RETURN NEW;
    END IF;

    -- Check for suspicious patterns in text content
    IF TG_TABLE_NAME IN ('posts', 'boltz') THEN
        DECLARE
            text_content TEXT;
        BEGIN
            IF TG_TABLE_NAME = 'posts' THEN
                text_content := NEW.caption;
            ELSE
                text_content := NEW.description;
            END IF;

            IF text_content IS NOT NULL THEN
                -- Pattern: Excessive caps (shouting/aggression)
                IF LENGTH(text_content) > 20 AND
                   (LENGTH(REGEXP_REPLACE(text_content, '[^A-Z]', '', 'g'))::FLOAT /
                    NULLIF(LENGTH(REGEXP_REPLACE(text_content, '[^a-zA-Z]', '', 'g')), 0)) > 0.7 THEN
                    has_suspicious_pattern := TRUE;
                    detected_categories := array_append(detected_categories, 'excessive_caps');
                    suspicion_score := suspicion_score + 0.2;
                END IF;

                -- Pattern: Excessive punctuation (emotional volatility)
                IF LENGTH(REGEXP_REPLACE(text_content, '[^!?.]', '', 'g'))::FLOAT / NULLIF(LENGTH(text_content), 0) > 0.3 THEN
                    has_suspicious_pattern := TRUE;
                    detected_categories := array_append(detected_categories, 'excessive_punctuation');
                    suspicion_score := suspicion_score + 0.15;
                END IF;

                -- Pattern: Known spam keywords
                IF text_content ~* '(buy now|click here|limited time|make money fast|work from home)' THEN
                    has_suspicious_pattern := TRUE;
                    detected_categories := array_append(detected_categories, 'spam_keywords');
                    suspicion_score := suspicion_score + 0.4;
                END IF;
            END IF;
        END;
    END IF;

    -- Auto-flag if suspicious patterns detected (medium confidence)
    IF has_suspicious_pattern AND suspicion_score >= 0.5 THEN
        NEW.moderation_status := 'flagged';
        NEW.toxicity_type := 'spam';
        NEW.moderation_severity := 'medium';
        NEW.moderation_score := suspicion_score;
        NEW.moderation_categories := detected_categories;
        NEW.moderation_reason := 'Auto-flagged: Suspicious patterns detected in content.';
        NEW.moderated_at := NOW();
        NEW.moderation_model := 'postgres-regex';

        -- Log to audit
        INSERT INTO public.moderation_audit (
            content_type,
            content_id,
            content_user_id,
            old_status,
            new_status,
            toxicity_type,
            severity,
            score,
            categories,
            reason,
            moderator_type,
            ai_model
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            NEW.user_id,
            'approved',
            'flagged',
            'spam',
            'medium',
            suspicion_score,
            detected_categories,
            'Auto-flagged: Suspicious patterns detected in content.',
            'auto',
            'postgres-regex'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply auto-moderation trigger (optional - can be enabled if desired)
-- Uncomment below to enable automatic server-side pattern detection
-- DROP TRIGGER IF EXISTS auto_moderation_posts ON public.posts;
-- CREATE TRIGGER auto_moderation_posts
--     BEFORE INSERT ON public.posts
--     FOR EACH ROW
--     EXECUTE FUNCTION public.auto_moderation_check();

-- =============================================================================
-- 11. ADMIN MODERATION FUNCTIONS
-- =============================================================================

-- Function for admins to approve flagged content
CREATE OR REPLACE FUNCTION public.admin_approve_content(
    p_content_type TEXT,
    p_content_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update content status
    IF p_content_type = 'post' THEN
        UPDATE public.posts SET
            moderation_status = 'approved',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_notes, 'Approved by admin')
        WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN
        UPDATE public.boltz SET
            moderation_status = 'approved',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_notes, 'Approved by admin')
        WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN
        UPDATE public.flashes SET
            moderation_status = 'approved',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_notes, 'Approved by admin')
        WHERE id = p_content_id;
    END IF;

    -- Log to audit
    INSERT INTO public.moderation_audit (
        content_type, content_id, old_status, new_status,
        moderator_type, moderator_id, reason
    ) VALUES (
        p_content_type, p_content_id, 'flagged', 'approved',
        'admin', p_admin_id, COALESCE(p_notes, 'Approved by admin')
    );

    RETURN TRUE;
END;
$$;

-- Function for admins to reject/ban content
CREATE OR REPLACE FUNCTION public.admin_restrict_content(
    p_content_type TEXT,
    p_content_id UUID,
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update content status
    IF p_content_type = 'post' THEN
        UPDATE public.posts SET
            moderation_status = 'restricted',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_reason, 'Restricted by admin')
        WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN
        UPDATE public.boltz SET
            moderation_status = 'restricted',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_reason, 'Restricted by admin')
        WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN
        UPDATE public.flashes SET
            moderation_status = 'restricted',
            moderator_type = 'admin',
            moderator_id = p_admin_id,
            moderation_reviewed_at = NOW(),
            moderation_reason = COALESCE(p_reason, 'Restricted by admin')
        WHERE id = p_content_id;
    END IF;

    -- Log to audit
    INSERT INTO public.moderation_audit (
        content_type, content_id, old_status, new_status,
        moderator_type, moderator_id, reason
    ) VALUES (
        p_content_type, p_content_id, 'approved', 'restricted',
        'admin', p_admin_id, COALESCE(p_reason, 'Restricted by admin')
    );

    RETURN TRUE;
END;
$$;

-- =============================================================================
-- 12. USER APPEAL FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.appeal_content_moderation(
    p_content_type TEXT,
    p_content_id UUID,
    p_appeal_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_status moderation_status;
BEGIN
    v_user_id := auth.uid();

    -- Get current content status and verify ownership
    IF p_content_type = 'post' THEN
        SELECT moderation_status, user_id INTO v_current_status, v_user_id
        FROM public.posts WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN
        SELECT moderation_status, user_id INTO v_current_status, v_user_id
        FROM public.boltz WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN
        SELECT moderation_status, user_id INTO v_current_status, v_user_id
        FROM public.flashes WHERE id = p_content_id;
    END IF;

    -- Verify ownership
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Can only appeal own content';
    END IF;

    -- Can only appeal restricted/flagged content
    IF v_current_status NOT IN ('restricted', 'flagged') THEN
        RAISE EXCEPTION 'Cannot appeal: Content is not restricted or flagged';
    END IF;

    -- Update appeal status
    IF p_content_type = 'post' THEN
        UPDATE public.posts SET
            moderation_appealed = TRUE,
            moderation_appealed_at = NOW(),
            moderation_status = 'flagged'  -- Move to flagged for review
        WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN
        UPDATE public.boltz SET
            moderation_appealed = TRUE,
            moderation_appealed_at = NOW(),
            moderation_status = 'flagged'
        WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN
        UPDATE public.flashes SET
            moderation_appealed = TRUE,
            moderation_appealed_at = NOW(),
            moderation_status = 'flagged'
        WHERE id = p_content_id;
    END IF;

    -- Log appeal
    INSERT INTO public.moderation_audit (
        content_type, content_id, content_user_id,
        old_status, new_status, reason, moderator_type
    ) VALUES (
        p_content_type, p_content_id, v_user_id,
        v_current_status, 'flagged', p_appeal_reason, 'appeal'
    );

    RETURN TRUE;
END;
$$;

-- =============================================================================
-- 13. STATS FUNCTIONS
-- =============================================================================

-- Get moderation statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_moderation_stats(
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_content BIGINT,
    approved_count BIGINT,
    restricted_count BIGINT,
    flagged_count BIGINT,
    pending_appeals BIGINT,
    top_toxicity_types JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    WITH stats AS (
        SELECT
            moderation_status,
            toxicity_type,
            COUNT(*) as cnt
        FROM (
            SELECT moderation_status, toxicity_type FROM public.posts
            WHERE moderated_at > NOW() - INTERVAL '1 day' * p_days
            UNION ALL
            SELECT moderation_status, toxicity_type FROM public.boltz
            WHERE moderated_at > NOW() - INTERVAL '1 day' * p_days
            UNION ALL
            SELECT moderation_status, toxicity_type FROM public.flashes
            WHERE moderated_at > NOW() - INTERVAL '1 day' * p_days
        ) combined
        GROUP BY moderation_status, toxicity_type
    )
    SELECT
        COALESCE(SUM(cnt), 0) as total_content,
        COALESCE(SUM(CASE WHEN moderation_status = 'approved' THEN cnt END), 0) as approved_count,
        COALESCE(SUM(CASE WHEN moderation_status = 'restricted' THEN cnt END), 0) as restricted_count,
        COALESCE(SUM(CASE WHEN moderation_status = 'flagged' THEN cnt END), 0) as flagged_count,
        (SELECT COUNT(*) FROM public.moderation_audit
         WHERE moderator_type = 'appeal'
         AND created_at > NOW() - INTERVAL '1 day' * p_days) as pending_appeals,
        (SELECT jsonb_object_agg(toxicity_type, cnt)
         FROM stats
         WHERE toxicity_type IS NOT NULL
         AND toxicity_type != 'safe') as top_toxicity_types
    FROM stats;
$$;

-- =============================================================================
-- 14. INITIAL DATA MIGRATION (Set existing content to approved)
-- =============================================================================
DO $$
BEGIN
    UPDATE public.posts SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.boltz SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.flashes SET moderation_status = 'approved' WHERE moderation_status IS NULL;
    UPDATE public.comments SET moderation_status = 'approved' WHERE moderation_status IS NULL;

    RAISE NOTICE 'Migrated existing content to approved status';
END $$;

-- =============================================================================
-- ✅ PILLAR 2 MIGRATION COMPLETE
-- =============================================================================
DO $$ BEGIN
    RAISE NOTICE 'Pillar 2: Immune System deployed with moderation columns, RLS policies, audit trail, and admin functions.';
END $$;
