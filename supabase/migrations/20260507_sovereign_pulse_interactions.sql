-- ============================================================================
-- SOVEREIGN PULSE: UNIVERSAL INTERACTION ENGINE
-- ============================================================================

-- 1. UNIVERSAL INTERACTIONS TABLE (Likes/Pulses)
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'boltz', 'flash')),
    type TEXT DEFAULT 'pulse',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_id)
);

-- 2. UNIVERSAL COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT auth.uid(),
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'boltz', 'flash')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COUNTER SYNC FUNCTION (IDEMPOTENT)
CREATE OR REPLACE FUNCTION public.sync_interaction_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        EXECUTE format('UPDATE public.%I SET likes_count = likes_count + 1 WHERE id = $1', NEW.target_type || 's') 
        USING NEW.target_id;
    ELSIF (TG_OP = 'DELETE') THEN
        EXECUTE format('UPDATE public.%I SET likes_count = likes_count - 1 WHERE id = $1', OLD.target_type || 's') 
        USING OLD.target_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ATTACH TRIGGER
DROP TRIGGER IF EXISTS trg_sync_interaction_counts ON public.interactions;
CREATE TRIGGER trg_sync_interaction_counts
    AFTER INSERT OR DELETE ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_interaction_counts();

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Interactions RLS
CREATE POLICY "Users can view interactions" ON public.interactions
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own interactions" ON public.interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own interactions" ON public.interactions
    FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS
CREATE POLICY "Users can view comments" ON public.comments
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_interactions_user_target ON public.interactions(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_interactions_target ON public.interactions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);
