-- Migration: Scheduled Posts Publishing
-- This migration adds support for scheduled posts that are automatically published

-- Function to publish scheduled posts
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update posts that are scheduled and past their scheduled time
  UPDATE posts
  SET 
    is_draft = false,
    updated_at = NOW()
  WHERE 
    is_draft = true
    AND scheduled_for IS NOT NULL
    AND scheduled_for <= NOW();
    
  -- Log the number of posts published
  RAISE NOTICE 'Published scheduled posts';
END;
$$;

-- Create a function that can be called via HTTP (for cron jobs or webhooks)
CREATE OR REPLACE FUNCTION publish_scheduled_posts_http()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  published_count integer;
BEGIN
  -- Update posts that are scheduled and past their scheduled time
  WITH updated AS (
    UPDATE posts
    SET 
      is_draft = false,
      updated_at = NOW()
    WHERE 
      is_draft = true
      AND scheduled_for IS NOT NULL
      AND scheduled_for <= NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO published_count FROM updated;
  
  -- Return result as JSON
  RETURN json_build_object(
    'success', true,
    'published_count', published_count,
    'timestamp', NOW()
  );
END;
$$;

-- Grant execute permission to authenticated users (for manual testing)
GRANT EXECUTE ON FUNCTION publish_scheduled_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION publish_scheduled_posts_http() TO anon, authenticated;

-- Add index for efficient scheduled post queries
CREATE INDEX IF NOT EXISTS idx_posts_scheduled 
ON posts(scheduled_for) 
WHERE is_draft = true AND scheduled_for IS NOT NULL;

-- Add comment
COMMENT ON FUNCTION publish_scheduled_posts() IS 'Publishes all posts that are scheduled for the current time or earlier';
COMMENT ON FUNCTION publish_scheduled_posts_http() IS 'HTTP-callable function to publish scheduled posts, returns JSON with count';
