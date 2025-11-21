-- Migration: Flash 24-Hour Expiration System
-- This migration ensures proper 24-hour expiration for Flash stories

-- 1. Ensure flash table has proper expires_at default
ALTER TABLE flash 
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- 2. Create function to automatically set expires_at on insert
CREATE OR REPLACE FUNCTION set_flash_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 24 hours from now if not explicitly set
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to call the function
DROP TRIGGER IF EXISTS trigger_set_flash_expiration ON flash;
CREATE TRIGGER trigger_set_flash_expiration
  BEFORE INSERT ON flash
  FOR EACH ROW
  EXECUTE FUNCTION set_flash_expiration();

-- 4. Update existing flashes without expires_at
UPDATE flash 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL;

-- 5. Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_flash_expires_at ON flash(expires_at) 
  WHERE is_archived = false;

-- 6. Create function to delete expired flashes (can be called by cron or edge function)
CREATE OR REPLACE FUNCTION delete_expired_flashes()
RETURNS TABLE(deleted_count INTEGER, flash_ids UUID[]) AS $$
DECLARE
  expired_ids UUID[];
  deleted_rows INTEGER;
BEGIN
  -- Get IDs of expired flashes
  SELECT ARRAY_AGG(id) INTO expired_ids
  FROM flash
  WHERE expires_at < NOW() 
    AND is_archived = false;

  -- Delete expired flashes
  DELETE FROM flash
  WHERE id = ANY(expired_ids);

  GET DIAGNOSTICS deleted_rows = ROW_COUNT;

  -- Return results
  RETURN QUERY SELECT deleted_rows, expired_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION delete_expired_flashes() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_expired_flashes() TO service_role;

-- 8. Create a view for active (non-expired) flashes
CREATE OR REPLACE VIEW active_flashes AS
SELECT 
  f.*,
  p.username,
  p.full_name,
  p.avatar_url,
  p.is_verified,
  EXTRACT(EPOCH FROM (f.expires_at - NOW())) AS seconds_until_expiry
FROM flash f
JOIN profiles p ON f.user_id = p.id
WHERE f.expires_at > NOW() 
  AND f.is_archived = false;

-- 9. Grant access to the view
GRANT SELECT ON active_flashes TO authenticated;

-- 10. Add comment for documentation
COMMENT ON FUNCTION delete_expired_flashes() IS 
  'Deletes all flash stories that have passed their 24-hour expiration time. 
   Should be called by a cron job or edge function every hour.';

COMMENT ON COLUMN flash.expires_at IS 
  'Timestamp when the flash story expires (24 hours after creation by default)';

-- 11. Create RPC function for manual cleanup (accessible from client)
CREATE OR REPLACE FUNCTION cleanup_expired_flashes()
RETURNS JSON AS $$
DECLARE
  result JSON;
  deleted_count INTEGER;
  expired_ids UUID[];
BEGIN
  -- Call the delete function
  SELECT * INTO deleted_count, expired_ids
  FROM delete_expired_flashes();

  -- Build result JSON
  result := json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'deleted_ids', expired_ids,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cleanup_expired_flashes() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_flashes() TO service_role;
