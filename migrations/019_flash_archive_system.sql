-- Migration: Flash Story Archive System
-- This migration implements archiving of expired flashes instead of deletion

-- 1. Ensure is_archived column exists on flash table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash' AND column_name = 'is_archived'
  ) THEN
    ALTER TABLE flash ADD COLUMN is_archived BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Add archived_at column to track when flash was archived
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flash' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE flash ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Create index for archived flashes
CREATE INDEX IF NOT EXISTS idx_flash_archived ON flash(is_archived, archived_at DESC)
  WHERE is_archived = true;

CREATE INDEX IF NOT EXISTS idx_flash_user_archived ON flash(user_id, is_archived, archived_at DESC)
  WHERE is_archived = true;

-- 4. Update the delete_expired_flashes function to archive instead of delete
CREATE OR REPLACE FUNCTION archive_expired_flashes()
RETURNS TABLE(archived_count INTEGER, flash_ids UUID[]) AS $$
DECLARE
  expired_ids UUID[];
  archived_rows INTEGER;
BEGIN
  -- Get IDs of expired flashes that aren't already archived
  SELECT ARRAY_AGG(id) INTO expired_ids
  FROM flash
  WHERE expires_at < NOW() 
    AND is_archived = false;

  -- Archive expired flashes instead of deleting
  UPDATE flash
  SET is_archived = true,
      archived_at = NOW()
  WHERE id = ANY(expired_ids);

  GET DIAGNOSTICS archived_rows = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT archived_rows, expired_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to get user's archived flashes
CREATE OR REPLACE FUNCTION get_archived_flashes(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  media_url TEXT,
  media_type TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  view_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.media_url,
    f.media_type,
    f.caption,
    f.created_at,
    f.expires_at,
    f.archived_at,
    f.views_count as view_count
  FROM flash f
  WHERE f.user_id = auth.uid()
    AND f.is_archived = true
  ORDER BY f.archived_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to restore flash from archive to highlight
CREATE OR REPLACE FUNCTION restore_flash_to_highlight(
  flash_uuid UUID,
  highlight_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  flash_owner UUID;
  highlight_owner UUID;
  max_position INTEGER;
  result JSON;
BEGIN
  -- Get flash owner
  SELECT user_id INTO flash_owner
  FROM flash
  WHERE id = flash_uuid AND is_archived = true;

  IF flash_owner IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Archived flash not found'
    );
  END IF;

  IF flash_owner != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Access denied'
    );
  END IF;

  -- Get highlight owner
  SELECT user_id INTO highlight_owner
  FROM highlights
  WHERE id = highlight_uuid;

  IF highlight_owner IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Highlight not found'
    );
  END IF;

  IF highlight_owner != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Access denied to highlight'
    );
  END IF;

  -- Get current max position in highlight
  SELECT COALESCE(MAX(position), -1) INTO max_position
  FROM highlight_stories
  WHERE highlight_id = highlight_uuid;

  -- Add flash to highlight
  INSERT INTO highlight_stories (highlight_id, flash_id, position)
  VALUES (highlight_uuid, flash_uuid, max_position + 1)
  ON CONFLICT (highlight_id, flash_id) DO NOTHING;

  result := json_build_object(
    'success', true,
    'message', 'Flash restored to highlight',
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to permanently delete archived flash
CREATE OR REPLACE FUNCTION delete_archived_flash(flash_uuid UUID)
RETURNS JSON AS $$
DECLARE
  flash_owner UUID;
  media_url_to_delete TEXT;
  result JSON;
BEGIN
  -- Get flash info
  SELECT user_id, media_url INTO flash_owner, media_url_to_delete
  FROM flash
  WHERE id = flash_uuid AND is_archived = true;

  IF flash_owner IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Archived flash not found'
    );
  END IF;

  IF flash_owner != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Access denied'
    );
  END IF;

  -- Delete the flash
  DELETE FROM flash WHERE id = flash_uuid;

  result := json_build_object(
    'success', true,
    'message', 'Flash permanently deleted',
    'media_url', media_url_to_delete,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get archive statistics
CREATE OR REPLACE FUNCTION get_archive_stats()
RETURNS JSON AS $$
DECLARE
  total_archived BIGINT;
  total_views BIGINT;
  oldest_archive TIMESTAMPTZ;
  newest_archive TIMESTAMPTZ;
  result JSON;
BEGIN
  SELECT 
    COUNT(*),
    COALESCE(SUM(views_count), 0),
    MIN(archived_at),
    MAX(archived_at)
  INTO total_archived, total_views, oldest_archive, newest_archive
  FROM flash
  WHERE user_id = auth.uid() AND is_archived = true;

  result := json_build_object(
    'total_archived', total_archived,
    'total_views', total_views,
    'oldest_archive', oldest_archive,
    'newest_archive', newest_archive
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to bulk delete old archived flashes
CREATE OR REPLACE FUNCTION cleanup_old_archives(days_old INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER;
  result JSON;
BEGIN
  -- Delete archived flashes older than specified days
  DELETE FROM flash
  WHERE user_id = auth.uid()
    AND is_archived = true
    AND archived_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  result := json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'days_old', days_old,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update RLS policy to exclude archived flashes from normal views
DROP POLICY IF EXISTS "Flash visibility" ON flash;
CREATE POLICY "Flash visibility" ON flash 
  FOR SELECT 
  USING (
    -- Archived flashes only visible to owner
    (is_archived = true AND user_id = auth.uid()) OR
    -- Active flashes with normal visibility rules
    (
      is_archived = false AND
      expires_at > NOW() AND (
        visibility = 'public' OR 
        user_id = auth.uid() OR 
        (
          visibility = 'followers' AND 
          is_close_friends = false AND
          EXISTS (
            SELECT 1 FROM follows 
            WHERE follower_id = auth.uid() 
              AND following_id = flash.user_id
              AND status = 'active'
          )
        ) OR
        (
          is_close_friends = true AND
          EXISTS (
            SELECT 1 FROM close_friends 
            WHERE user_id = flash.user_id 
              AND friend_id = auth.uid()
          )
        )
      )
    )
  );

-- 11. Create view for user's archive
CREATE OR REPLACE VIEW my_flash_archive AS
SELECT 
  f.id,
  f.media_url,
  f.media_type,
  f.caption,
  f.created_at,
  f.expires_at,
  f.archived_at,
  f.views_count,
  f.is_close_friends,
  EXTRACT(EPOCH FROM (NOW() - f.archived_at)) / 86400 as days_archived
FROM flash f
WHERE f.user_id = auth.uid()
  AND f.is_archived = true
ORDER BY f.archived_at DESC;

-- 12. Grant permissions
GRANT EXECUTE ON FUNCTION archive_expired_flashes() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_expired_flashes() TO service_role;
GRANT EXECUTE ON FUNCTION get_archived_flashes(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_flash_to_highlight(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_archived_flash(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_archive_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_archives(INTEGER) TO authenticated;
GRANT SELECT ON my_flash_archive TO authenticated;

-- 13. Add comments
COMMENT ON FUNCTION archive_expired_flashes() IS 
  'Archives expired flashes instead of deleting them. Should be called by cron job.';

COMMENT ON FUNCTION get_archived_flashes(INTEGER, INTEGER) IS 
  'Returns paginated list of user''s archived flashes';

COMMENT ON FUNCTION restore_flash_to_highlight(UUID, UUID) IS 
  'Restores an archived flash to a highlight album';

COMMENT ON FUNCTION delete_archived_flash(UUID) IS 
  'Permanently deletes an archived flash and its media';

COMMENT ON FUNCTION get_archive_stats() IS 
  'Returns statistics about user''s archived flashes';

COMMENT ON FUNCTION cleanup_old_archives(INTEGER) IS 
  'Permanently deletes archived flashes older than specified days';

COMMENT ON VIEW my_flash_archive IS 
  'View of current user''s archived flashes with calculated fields';

-- 14. Update edge function reference (documentation)
COMMENT ON COLUMN flash.is_archived IS 
  'When true, flash is archived and only visible to owner. Archived flashes can be restored to highlights.';

COMMENT ON COLUMN flash.archived_at IS 
  'Timestamp when the flash was archived (moved from active to archive)';
