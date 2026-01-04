-- Create webrtc_signals table for Simple-Peer signaling
CREATE TABLE IF NOT EXISTS webrtc_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id TEXT NOT NULL,
    from_user UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    signal JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_call_id ON webrtc_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_webrtc_signals_created_at ON webrtc_signals(created_at);

-- Enable RLS
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own signals
CREATE POLICY "Users can insert signals"
ON webrtc_signals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user);

-- Allow users to read signals for their calls
CREATE POLICY "Users can read call signals"
ON webrtc_signals FOR SELECT
TO authenticated
USING (true); -- Allow reading all signals (they're filtered by call_id in the app)

-- Grant permissions
GRANT ALL ON webrtc_signals TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE webrtc_signals;

-- Auto-delete old signals (older than 1 hour)
CREATE OR REPLACE FUNCTION delete_old_webrtc_signals()
RETURNS void AS $$
BEGIN
    DELETE FROM webrtc_signals
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to clean up old signals
-- (This requires pg_cron extension, uncomment if available)
-- SELECT cron.schedule('delete-old-webrtc-signals', '0 * * * *', 'SELECT delete_old_webrtc_signals()');

RAISE NOTICE '✅ webrtc_signals table created successfully!';
