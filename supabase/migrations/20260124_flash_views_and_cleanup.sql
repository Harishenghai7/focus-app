-- ═══════════════════════════════════════════════════════════════════════
-- FLASH STORIES: VIEW TRACKING + EXPIRY CLEANUP
-- Migration: 20260124_flash_views_and_cleanup.sql
-- Description: Track flash views and cleanup expired stories
-- ═══════════════════════════════════════════════════════════════════════

-- Track per-user flash views
CREATE TABLE IF NOT EXISTS flash_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_flash_views_flash_id ON flash_views(flash_id);
CREATE INDEX IF NOT EXISTS idx_flash_views_user_id ON flash_views(user_id);

ALTER TABLE flash_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own flash views"
  ON flash_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own flash views"
  ON flash_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Flash owners can view flash views"
  ON flash_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flash
    WHERE flash.id = flash_views.flash_id
      AND flash.user_id = auth.uid()
  ));

-- Cleanup expired flash stories
CREATE OR REPLACE FUNCTION cleanup_expired_flash()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM flash WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_flash() TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.flash') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_flash_expires_at ON flash(expires_at);
  END IF;
END;
$$;
