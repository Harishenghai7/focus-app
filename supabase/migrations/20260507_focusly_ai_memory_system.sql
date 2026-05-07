-- ============================================================================
-- FOCUSLY AI: SOVEREIGN EMPATHY & MEMORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.focusly_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('milestone', 'mood_swing', 'preference', 'interaction', 'warning')),
    content TEXT NOT NULL,
    emotional_weight INTEGER DEFAULT 1 CHECK (emotional_weight >= 1 AND emotional_weight <= 5),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for instant companion recall
CREATE INDEX IF NOT EXISTS idx_focusly_memory_user ON public.focusly_memory(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focusly_memory_type ON public.focusly_memory(memory_type, created_at DESC);

-- View to give Focusly a "Quick Brief" on his Macha
CREATE OR REPLACE VIEW public.macha_brief AS
SELECT 
    p.id,
    p.username, 
    p.trust_tier,
    p.is_restricted,
    p.is_verified,
    (SELECT content FROM focusly_memory WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as last_memory,
    (SELECT COUNT(*) FROM focusly_memory WHERE user_id = p.id AND memory_type = 'milestone') as milestone_count,
    (SELECT COUNT(*) FROM focusly_memory WHERE user_id = p.id AND memory_type = 'warning') as warning_count
FROM public.profiles p;

-- Function to record a memory
CREATE OR REPLACE FUNCTION public.record_focusly_memory(
    p_user_id UUID,
    p_memory_type TEXT,
    p_content TEXT,
    p_emotional_weight INTEGER DEFAULT 1,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_memory_id UUID;
BEGIN
    INSERT INTO public.focusly_memory (
        user_id,
        memory_type,
        content,
        emotional_weight,
        metadata
    ) VALUES (
        p_user_id,
        p_memory_type,
        p_content,
        p_emotional_weight,
        p_metadata
    ) RETURNING id INTO v_memory_id;
    
    RETURN v_memory_id;
END;
$$;

-- Function to get recent memories for context
CREATE OR REPLACE FUNCTION public.get_focusly_memories(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    memory_type TEXT,
    content TEXT,
    emotional_weight INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fm.id,
        fm.memory_type,
        fm.content,
        fm.emotional_weight,
        fm.metadata,
        fm.created_at
    FROM public.focusly_memory fm
    WHERE fm.user_id = p_user_id
    ORDER BY fm.created_at DESC
    LIMIT p_limit;
END;
$$;

-- Enable RLS
ALTER TABLE public.focusly_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own memories
CREATE POLICY "Users can view own memories"
ON public.focusly_memory FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own memories
CREATE POLICY "Users can insert own memories"
ON public.focusly_memory FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own memories
CREATE POLICY "Users can update own memories"
ON public.focusly_memory FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own memories
CREATE POLICY "Users can delete own memories"
ON public.focusly_memory FOR DELETE
USING (auth.uid() = user_id);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.record_focusly_memory TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_focusly_memories TO authenticated;
GRANT SELECT ON TABLE public.focusly_memory TO authenticated;
GRANT INSERT ON TABLE public.focusly_memory TO authenticated;
GRANT UPDATE ON TABLE public.focusly_memory TO authenticated;
GRANT DELETE ON TABLE public.focusly_memory TO authenticated;
