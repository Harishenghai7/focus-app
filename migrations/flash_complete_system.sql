-- ═══════════════════════════════════════════════════════════════════════════
-- FLASH COMPLETE SYSTEM — Sovereign Ephemerality (V8 - The "No More Errors" Edition)
-- ═══════════════════════════════════════════════════════════════════════════

-- 0. SCHEMA HEALERS (Fixes Visibility ENUM and Column Types)
-- ═══════════════════════════════════════════════════════════════════════════
DO $$ 
BEGIN
    -- Fix Visibility ENUM issue if table exists from a failed run
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flash' AND column_name = 'visibility' AND data_type = 'USER-DEFINED'
    ) THEN
        ALTER TABLE flash ALTER COLUMN visibility DROP DEFAULT;
        ALTER TABLE flash ALTER COLUMN visibility TYPE TEXT USING visibility::TEXT;
        ALTER TABLE flash ALTER COLUMN visibility SET DEFAULT 'public';
    END IF;
END $$;

-- 1. STORAGE BUCKET CONFIGURATION
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'flash',
    'flash',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Flash: Users can upload own flashes" ON storage.objects;
    DROP POLICY IF EXISTS "Flash: Users can read all flashes" ON storage.objects;
    DROP POLICY IF EXISTS "Flash: Users can delete own flashes" ON storage.objects;
END $$;

-- Storage policies for flash bucket
CREATE POLICY "Flash: Users can upload own flashes" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'flash' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Flash: Users can read all flashes" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'flash');

CREATE POLICY "Flash: Users can delete own flashes" 
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'flash' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FLASH TABLE (Main Stories Table)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS flash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    thumbnail_url TEXT,
    duration INTEGER DEFAULT 10,
    caption TEXT,
    text_overlay JSONB DEFAULT '{}'::jsonb,
    stickers JSONB DEFAULT '[]'::jsonb,
    filters JSONB DEFAULT '{}'::jsonb,
    music_id UUID REFERENCES music_library(id) ON DELETE SET NULL,
    music_start_time INTEGER DEFAULT 0,
    -- Using TEXT + CHECK to avoid ENUM transaction errors forever
    visibility TEXT NOT NULL DEFAULT 'public' 
        CHECK (visibility IN ('public', 'close_friends', 'selected')),
    selected_viewers UUID[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    views_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flash_expires_at ON flash(expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_flash_user_id ON flash(user_id);
CREATE INDEX IF NOT EXISTS idx_flash_visibility_partial ON flash(visibility) WHERE visibility != 'public';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FLASH VIEWS TABLE (Track who viewed which story)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS flash_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_id UUID NOT NULL REFERENCES flash(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate views
    UNIQUE(flash_id, viewer_id)
);

-- Index for view counting
CREATE INDEX IF NOT EXISTS idx_flash_views_flash_id ON flash_views(flash_id);

-- Index for "viewed by me" queries
CREATE INDEX IF NOT EXISTS idx_flash_views_viewer_id ON flash_views(viewer_id, viewed_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FLASH REPLIES TABLE (Sovereign Whisper Integration)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS flash_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flash_id UUID NOT NULL REFERENCES flash(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Message content (encrypted if needed)
    message TEXT NOT NULL,
    
    -- Media reply (optional)
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching replies
CREATE INDEX IF NOT EXISTS idx_flash_replies_flash_id ON flash_replies(flash_id, created_at DESC);

-- Index for fetching user's received replies
CREATE INDEX IF NOT EXISTS idx_flash_replies_receiver ON flash_replies(receiver_id, is_read, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (The Sovereign Guard)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE flash ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_replies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Flash: Insert self" ON flash;
    DROP POLICY IF EXISTS "Flash: Selective Select" ON flash;
    DROP POLICY IF EXISTS "Flash: Delete self" ON flash;
    DROP POLICY IF EXISTS "Flash Views: Insert self" ON flash_views;
    DROP POLICY IF EXISTS "Flash Views: Selective Select" ON flash_views;
    DROP POLICY IF EXISTS "Flash Replies: Insert self" ON flash_replies;
    DROP POLICY IF EXISTS "Flash Replies: Selective Select" ON flash_replies;
    DROP POLICY IF EXISTS "Flash Replies: Update read status" ON flash_replies;
END $$;

CREATE POLICY "Flash: Insert self" ON flash FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Flash: Selective Select" ON flash FOR SELECT TO authenticated USING (
    expires_at > NOW() AND (
        user_id = auth.uid() OR
        visibility = 'public' OR
        (visibility = 'selected' AND auth.uid() = ANY(selected_viewers)) OR
        (visibility = 'close_friends' AND EXISTS (
            -- Checks close_friends table using user_id as the owner
            SELECT 1 FROM close_friends 
            WHERE user_id = flash.user_id AND friend_id = auth.uid()
        ))
    )
);

CREATE POLICY "Flash: Delete self" ON flash FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Flash Views: Insert self" ON flash_views FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());
CREATE POLICY "Flash Views: Selective Select" ON flash_views FOR SELECT TO authenticated USING (
    viewer_id = auth.uid() OR EXISTS (SELECT 1 FROM flash WHERE id = flash_id AND user_id = auth.uid())
);

CREATE POLICY "Flash Replies: Insert self" ON flash_replies FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Flash Replies: Selective Select" ON flash_replies FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Flash Replies: Update read status" ON flash_replies FOR UPDATE TO authenticated USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. AUTOMATION (Triggers for Counts and Timestamps)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_increment_flash_views() RETURNS TRIGGER AS $$
BEGIN
    UPDATE flash SET views_count = views_count + 1 WHERE id = NEW.flash_id;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_increment_flash_replies() RETURNS TRIGGER AS $$
BEGIN
    UPDATE flash SET replies_count = replies_count + 1 WHERE id = NEW.flash_id;
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DO $$ BEGIN
    DROP TRIGGER IF EXISTS tr_flash_updated_at ON flash;
    CREATE TRIGGER tr_flash_updated_at BEFORE UPDATE ON flash FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

    DROP TRIGGER IF EXISTS tr_inc_flash_views ON flash_views;
    CREATE TRIGGER tr_inc_flash_views AFTER INSERT ON flash_views FOR EACH ROW EXECUTE FUNCTION fn_increment_flash_views();

    DROP TRIGGER IF EXISTS tr_inc_flash_replies ON flash_replies;
    CREATE TRIGGER tr_inc_flash_replies AFTER INSERT ON flash_replies FOR EACH ROW EXECUTE FUNCTION fn_increment_flash_replies();
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. VIEWS & FUNCTIONS (Schema Resilient Selection)
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS active_flashes;
CREATE OR REPLACE VIEW active_flashes AS
SELECT 
    f.*,
    p.username,
    p.avatar_url,
    -- Using a subquery for 'is_viewed_by_me' to keep the view simple and fast
    EXISTS (
        SELECT 1 FROM flash_views fv 
        WHERE fv.flash_id = f.id AND fv.viewer_id = auth.uid()
    ) as is_viewed_by_me
FROM flash f
JOIN profiles p ON f.user_id = p.id
WHERE f.expires_at > NOW();

-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION create_flash_story(
    p_media_url TEXT,
    p_media_type TEXT,
    p_caption TEXT DEFAULT NULL,
    p_text_overlay JSONB DEFAULT '{}'::jsonb,
    p_stickers JSONB DEFAULT '[]'::jsonb,
    p_visibility TEXT DEFAULT 'public',
    p_selected_viewers UUID[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO flash (
        user_id, media_url, media_type, caption, 
        text_overlay, stickers, visibility, selected_viewers
    )
    VALUES (
        auth.uid(), p_media_url, p_media_type, p_caption, 
        p_text_overlay, p_stickers, p_visibility, p_selected_viewers
    )
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT ALL ON TABLE flash TO authenticated;
GRANT ALL ON TABLE flash_views TO authenticated;
GRANT ALL ON TABLE flash_replies TO authenticated;
GRANT SELECT ON active_flashes TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLETE — Flash System Ready for Launch
-- ═══════════════════════════════════════════════════════════════════════════
