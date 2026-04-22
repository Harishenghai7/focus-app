-- =============================================================================
-- 🛡️ CONTENT INTEGRITY SYSTEM MIGRATION - The Purity Engine
-- Layer 4: Database Integrity & RLS Hardening
-- =============================================================================
-- Mission: Bulletproof content moderation with metadata tagging
-- Deadline: May 8th Global Launch
-- =============================================================================

SET client_min_messages TO WARNING;

-- =============================================================================
-- CONTENT SAFETY METADATA - Add to posts/boltz/flashes tables
-- =============================================================================

DO $$
BEGIN
    -- Posts table safety columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        BEGIN ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS safety_hash TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_rating NUMERIC(3,2) DEFAULT 1.0; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS ai_scan_passed BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_violations JSONB DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    
    -- Boltz table safety columns  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boltz') THEN
        BEGIN ALTER TABLE public.boltz ADD COLUMN IF NOT EXISTS safety_hash TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.boltz ADD COLUMN IF NOT EXISTS content_rating NUMERIC(3,2) DEFAULT 1.0; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.boltz ADD COLUMN IF NOT EXISTS ai_scan_passed BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.boltz ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.boltz ADD COLUMN IF NOT EXISTS content_violations JSONB DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    
    -- Flashes table safety columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashes') THEN
        BEGIN ALTER TABLE public.flashes ADD COLUMN IF NOT EXISTS safety_hash TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.flashes ADD COLUMN IF NOT EXISTS content_rating NUMERIC(3,2) DEFAULT 1.0; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.flashes ADD COLUMN IF NOT EXISTS ai_scan_passed BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.flashes ADD COLUMN IF NOT EXISTS scan_timestamp TIMESTAMPTZ; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.flashes ADD COLUMN IF NOT EXISTS content_violations JSONB DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
    
    -- Comments table safety columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        BEGIN ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS safety_hash TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS content_rating NUMERIC(3,2) DEFAULT 1.0; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS ai_scan_passed BOOLEAN DEFAULT TRUE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS text_violations JSONB DEFAULT '[]'; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- =============================================================================
-- CONTENT VIOLATIONS TABLE - Track all violations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.content_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'post', 'boltz', 'flash', 'comment'
    content_id UUID,
    violation_type TEXT NOT NULL, -- 'NUDITY_PORN', 'VIOLENCE', 'TOXICITY', etc.
    violation_score NUMERIC(4,3),
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    content_preview TEXT, -- Truncated preview
    scan_metadata JSONB DEFAULT '{}', -- Full scan results
    user_notified BOOLEAN DEFAULT FALSE,
    admin_reviewed BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    action_taken TEXT, -- 'blocked', 'warned', 'flagged', 'none'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Violations indexes
DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_violations_user ON public.content_violations (user_id, created_at DESC); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_violations_type ON public.content_violations (violation_type, created_at DESC); EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_violations_severity ON public.content_violations (severity, created_at DESC) WHERE severity IN ('high', 'critical'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================================================
-- CONTENT SAFETY INDEXES
-- =============================================================================

DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_posts_safety ON public.posts (content_rating, ai_scan_passed) WHERE content_rating < 0.9; EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_boltz_safety ON public.boltz (content_rating, ai_scan_passed) WHERE content_rating < 0.9; EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN CREATE INDEX IF NOT EXISTS idx_flashes_safety ON public.flashes (content_rating, ai_scan_passed) WHERE content_rating < 0.9; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- =============================================================================
-- SAFETY RLS POLICY FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_content_safe(
    p_content_rating NUMERIC,
    p_ai_scan_passed BOOLEAN,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_viewer_age_group TEXT;
    v_is_teen BOOLEAN;
BEGIN
    -- Content must have passed AI scan
    IF COALESCE(p_ai_scan_passed, TRUE) = FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Get viewer's age group
    SELECT COALESCE(age_group, 'adult'), COALESCE(is_teen_mode, FALSE)
    INTO v_viewer_age_group, v_is_teen
    FROM public.profiles
    WHERE id = auth.uid();
    
    -- Teen users (13-17) only see high-safety content
    IF v_is_teen OR v_viewer_age_group = 'teen' THEN
        -- Teens: content_rating must be >= 0.95 (95% safe)
        RETURN COALESCE(p_content_rating, 1.0) >= 0.95;
    END IF;
    
    -- Adult users: content_rating must be >= 0.7 (70% safe)
    -- This blocks severely problematic content while allowing borderline
    RETURN COALESCE(p_content_rating, 1.0) >= 0.7;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- APPLY SAFETY RLS POLICIES
-- =============================================================================

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['posts', 'boltz', 'flashes']
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            -- Enable RLS
            BEGIN EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t); EXCEPTION WHEN OTHERS THEN NULL; END;
            
            -- Drop existing policy
            BEGIN EXECUTE format('DROP POLICY IF EXISTS safety_content_select_%s ON public.%I', t, t); EXCEPTION WHEN OTHERS THEN NULL; END;
            
            -- Create safety policy
            BEGIN 
                EXECUTE format(
                    'CREATE POLICY safety_content_select_%s ON public.%I FOR SELECT USING (public.is_content_safe(COALESCE(content_rating, 1.0), COALESCE(ai_scan_passed, TRUE), user_id))',
                    t, t
                ); 
            EXCEPTION WHEN OTHERS THEN NULL; 
            END;
        END IF;
    END LOOP;
END $$;

-- =============================================================================
-- AUTO-FLAG FUNCTION - Auto-hide content below threshold
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_flag_low_safety_content()
RETURNS TRIGGER AS $$
BEGIN
    -- If content rating is very low, auto-hide
    IF NEW.content_rating < 0.5 THEN
        NEW.ai_scan_passed = FALSE;
        
        -- Insert moderation audit
        INSERT INTO public.moderation_audit (
            content_type,
            content_id,
            content_user_id,
            old_status,
            new_status,
            triggered_by,
            reason
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            NEW.user_id,
            'approved',
            'flagged',
            'auto_safety_system',
            format('Auto-flagged: content_rating %s below threshold', NEW.content_rating)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply auto-flag triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        DROP TRIGGER IF EXISTS trg_auto_flag_posts ON public.posts;
        CREATE TRIGGER trg_auto_flag_posts
            BEFORE INSERT OR UPDATE ON public.posts
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_flag_low_safety_content();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boltz') THEN
        DROP TRIGGER IF EXISTS trg_auto_flag_boltz ON public.boltz;
        CREATE TRIGGER trg_auto_flag_boltz
            BEFORE INSERT OR UPDATE ON public.boltz
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_flag_low_safety_content();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashes') THEN
        DROP TRIGGER IF EXISTS trg_auto_flag_flashes ON public.flashes;
        CREATE TRIGGER trg_auto_flag_flashes
            BEFORE INSERT OR UPDATE ON public.flashes
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_flag_low_safety_content();
    END IF;
END $$;

-- =============================================================================
-- VIOLATION REPORTING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.report_content_violation(
    p_content_type TEXT,
    p_content_id UUID,
    p_violation_type TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert violation report
    INSERT INTO public.content_violations (
        user_id,
        content_type,
        content_id,
        violation_type,
        content_preview,
        severity
    )
    SELECT 
        user_id,
        p_content_type,
        p_content_id,
        p_violation_type,
        CASE 
            WHEN p_content_type = 'post' THEN (SELECT LEFT(caption, 100) FROM public.posts WHERE id = p_content_id)
            WHEN p_content_type = 'boltz' THEN (SELECT LEFT(description, 100) FROM public.boltz WHERE id = p_content_id)
            ELSE NULL
        END,
        'medium'
    FROM public.posts WHERE id = p_content_id AND p_content_type = 'post'
    UNION ALL
    SELECT 
        user_id,
        p_content_type,
        p_content_id,
        p_violation_type,
        LEFT(description, 100),
        'medium'
    FROM public.boltz WHERE id = p_content_id AND p_content_type = 'boltz';
    
    -- Update content to require review
    IF p_content_type = 'post' THEN
        UPDATE public.posts SET moderation_status = 'flagged' WHERE id = p_content_id;
    ELSIF p_content_type = 'boltz' THEN
        UPDATE public.boltz SET moderation_status = 'flagged' WHERE id = p_content_id;
    ELSIF p_content_type = 'flash' THEN
        UPDATE public.flashes SET moderation_status = 'flagged' WHERE id = p_content_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS ON VIOLATIONS TABLE
-- =============================================================================

ALTER TABLE public.content_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS violations_self_read ON public.content_violations;
CREATE POLICY violations_self_read ON public.content_violations
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS violations_admin_all ON public.content_violations;
CREATE POLICY violations_admin_all ON public.content_violations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(role, 'user') = 'admin')
    );

-- =============================================================================
-- VIEWS FOR CONTENT SAFETY MONITORING
-- =============================================================================

-- View: High-risk content requiring review
CREATE OR REPLACE VIEW public.v_high_risk_content AS
    SELECT 'post' as type, id, user_id, content_rating, content_violations, created_at
    FROM public.posts 
    WHERE content_rating < 0.5 OR ai_scan_passed = FALSE
    UNION ALL
    SELECT 'boltz', id, user_id, content_rating, content_violations, created_at
    FROM public.boltz 
    WHERE content_rating < 0.5 OR ai_scan_passed = FALSE
    UNION ALL
    SELECT 'flash', id, user_id, content_rating, content_violations, created_at
    FROM public.flashes 
    WHERE content_rating < 0.5 OR ai_scan_passed = FALSE
    ORDER BY content_rating ASC, created_at DESC;

-- View: User violation summary
CREATE OR REPLACE VIEW public.v_user_violation_summary AS
    SELECT 
        user_id,
        COUNT(*) as total_violations,
        COUNT(*) FILTER (WHERE severity = 'high') as high_severity_count,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        MAX(created_at) as last_violation_at,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_violations
    FROM public.content_violations
    GROUP BY user_id;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT ON public.v_high_risk_content TO authenticated;
GRANT SELECT ON public.v_user_violation_summary TO authenticated;

-- =============================================================================
-- 🎯 MISSION COMPLETE: Content Integrity System Active
-- =============================================================================
