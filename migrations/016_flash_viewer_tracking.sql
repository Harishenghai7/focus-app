-- Migration: Flash Viewer Tracking System
-- This migration enhances the flash_views table and adds helper functions

-- 1. Ensure flash_views table exists with proper structure
CREATE TABLE IF NOT EXISTS flash_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flash_id, viewer_id)
);

-- 2. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_flash_views_flash_id ON flash_views(flash_id);
CREATE INDEX IF NOT EXISTS idx_flash_views_viewer_id ON flash_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_flash_views_viewed_at ON flash_views(viewed_at DESC);

-- 3. Enable RLS
ALTER TABLE flash_views ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for flash_views
DROP POLICY IF EXISTS "Users can view flash views" ON flash_views;
CREATE POLICY "Users can view flash views" ON flash_views 
  FOR SELECT 
  USING (
    viewer_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM flash 
      WHERE flash.id = flash_views.flash_id 
        AND flash.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert flash views" ON flash_views;
CREATE POLICY "Users can insert flash views" ON flash_views 
  FOR INSERT 
  WITH CHECK (auth.uid() = viewer_id);

-- 5. Create function to get flash viewers with profile info
CREATE OR REPLACE FUNCTION get_flash_viewers(flash_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN,
  viewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.is_verified,
    fv.viewed_at
  FROM flash_views fv
  JOIN profiles p ON fv.viewer_id = p.id
  WHERE fv.flash_id = flash_uuid
  ORDER BY fv.viewed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get view count for a flash
CREATE OR REPLACE FUNCTION get_flash_view_count(flash_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  view_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM flash_views
  WHERE flash_id = flash_uuid;
  
  RETURN COALESCE(view_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to track a view (with duplicate prevention)
CREATE OR REPLACE FUNCTION track_flash_view(
  flash_uuid UUID,
  viewer_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  is_new_view BOOLEAN;
  flash_owner UUID;
BEGIN
  -- Get flash owner
  SELECT user_id INTO flash_owner
  FROM flash
  WHERE id = flash_uuid;

  -- Don't track views on own flashes
  IF flash_owner = viewer_uuid THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Cannot track view on own flash',
      'is_new_view', false
    );
  END IF;

  -- Insert view (will fail silently if duplicate due to UNIQUE constraint)
  INSERT INTO flash_views (flash_id, viewer_id)
  VALUES (flash_uuid, viewer_uuid)
  ON CONFLICT (flash_id, viewer_id) DO NOTHING
  RETURNING true INTO is_new_view;

  -- Build result
  result := json_build_object(
    'success', true,
    'is_new_view', COALESCE(is_new_view, false),
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to update flash.views_count
CREATE OR REPLACE FUNCTION update_flash_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE flash
    SET views_count = views_count + 1
    WHERE id = NEW.flash_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE flash
    SET views_count = GREATEST(views_count - 1, 0)
    WHERE id = OLD.flash_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_flash_views_count ON flash_views;
CREATE TRIGGER trigger_update_flash_views_count
  AFTER INSERT OR DELETE ON flash_views
  FOR EACH ROW
  EXECUTE FUNCTION update_flash_views_count();

-- 9. Create function to get user's flash viewing history
CREATE OR REPLACE FUNCTION get_user_flash_history(user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  flash_id UUID,
  flash_user_id UUID,
  flash_username TEXT,
  flash_avatar_url TEXT,
  media_url TEXT,
  media_type TEXT,
  viewed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as flash_id,
    f.user_id as flash_user_id,
    p.username as flash_username,
    p.avatar_url as flash_avatar_url,
    f.media_url,
    f.media_type,
    fv.viewed_at
  FROM flash_views fv
  JOIN flash f ON fv.flash_id = f.id
  JOIN profiles p ON f.user_id = p.id
  WHERE fv.viewer_id = user_uuid
  ORDER BY fv.viewed_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create view for flash analytics
CREATE OR REPLACE VIEW flash_analytics AS
SELECT 
  f.id,
  f.user_id,
  f.created_at,
  f.expires_at,
  COUNT(DISTINCT fv.viewer_id) as unique_views,
  COUNT(fv.id) as total_views,
  ARRAY_AGG(DISTINCT fv.viewer_id) FILTER (WHERE fv.viewer_id IS NOT NULL) as viewer_ids,
  MAX(fv.viewed_at) as last_viewed_at,
  EXTRACT(EPOCH FROM (NOW() - f.created_at)) / 3600 as hours_since_creation,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - f.created_at)) > 0 
    THEN COUNT(DISTINCT fv.viewer_id)::FLOAT / (EXTRACT(EPOCH FROM (NOW() - f.created_at)) / 3600)
    ELSE 0
  END as views_per_hour
FROM flash f
LEFT JOIN flash_views fv ON f.id = fv.flash_id
WHERE f.expires_at > NOW() AND f.is_archived = false
GROUP BY f.id, f.user_id, f.created_at, f.expires_at;

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION get_flash_viewers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flash_view_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_flash_view(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_flash_history(UUID, INTEGER) TO authenticated;
GRANT SELECT ON flash_analytics TO authenticated;

-- 12. Add comments for documentation
COMMENT ON FUNCTION get_flash_viewers(UUID) IS 
  'Returns list of users who viewed a specific flash with their profile info';

COMMENT ON FUNCTION get_flash_view_count(UUID) IS 
  'Returns the total number of views for a specific flash';

COMMENT ON FUNCTION track_flash_view(UUID, UUID) IS 
  'Records a view for a flash. Prevents duplicate views and self-views.';

COMMENT ON FUNCTION get_user_flash_history(UUID, INTEGER) IS 
  'Returns the viewing history for a user (flashes they have viewed)';

COMMENT ON VIEW flash_analytics IS 
  'Provides analytics data for active flashes including view counts and rates';

-- 13. Create function to get flash stats for owner
CREATE OR REPLACE FUNCTION get_my_flash_stats()
RETURNS TABLE (
  total_flashes BIGINT,
  total_views BIGINT,
  avg_views_per_flash NUMERIC,
  most_viewed_flash_id UUID,
  most_viewed_flash_views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT f.id) as total_flashes,
    COUNT(fv.id) as total_views,
    ROUND(COUNT(fv.id)::NUMERIC / NULLIF(COUNT(DISTINCT f.id), 0), 2) as avg_views_per_flash,
    (
      SELECT f2.id 
      FROM flash f2
      LEFT JOIN flash_views fv2 ON f2.id = fv2.flash_id
      WHERE f2.user_id = auth.uid()
      GROUP BY f2.id
      ORDER BY COUNT(fv2.id) DESC
      LIMIT 1
    ) as most_viewed_flash_id,
    (
      SELECT COUNT(fv2.id)
      FROM flash f2
      LEFT JOIN flash_views fv2 ON f2.id = fv2.flash_id
      WHERE f2.user_id = auth.uid()
      GROUP BY f2.id
      ORDER BY COUNT(fv2.id) DESC
      LIMIT 1
    ) as most_viewed_flash_views
  FROM flash f
  LEFT JOIN flash_views fv ON f.id = fv.flash_id
  WHERE f.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_my_flash_stats() TO authenticated;
