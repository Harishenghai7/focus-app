-- Migration: Boltz View Tracking
-- Add function to increment boltz view count

-- Function to increment boltz views
CREATE OR REPLACE FUNCTION increment_boltz_views(boltz_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE boltz
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = boltz_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_boltz_views(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION increment_boltz_views IS 'Increments the view count for a boltz video after 3 seconds of playback';

-- Create index for views_count if not exists
CREATE INDEX IF NOT EXISTS idx_boltz_views_count ON boltz(views_count DESC);
