-- Reset RLS policies for webrtc_signals
ALTER TABLE webrtc_signals DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert signals" ON webrtc_signals;
DROP POLICY IF EXISTS "Users can read call signals" ON webrtc_signals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON webrtc_signals;
DROP POLICY IF EXISTS "Enable read access for all users" ON webrtc_signals;

-- Re-enable RLS
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert
CREATE POLICY "Enable insert for authenticated users only"
ON webrtc_signals FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select (read)
CREATE POLICY "Enable read access for all users"
ON webrtc_signals FOR SELECT
TO authenticated
USING (true);

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_call_id ON webrtc_signals(call_id);

-- Grant permissions again just to be sure
GRANT ALL ON webrtc_signals TO authenticated;
GRANT ALL ON webrtc_signals TO service_role;
