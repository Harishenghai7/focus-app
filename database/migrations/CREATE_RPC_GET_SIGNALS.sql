-- Create a secure function to fetch signals, bypassing RLS
CREATE OR REPLACE FUNCTION get_call_signals(p_call_id TEXT)
RETURNS TABLE (
  signal JSONB,
  from_user UUID,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER -- Run as owner, bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.signal, s.from_user, s.created_at
  FROM webrtc_signals s
  WHERE s.call_id = p_call_id
  ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_call_signals(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_call_signals(TEXT) TO service_role;
