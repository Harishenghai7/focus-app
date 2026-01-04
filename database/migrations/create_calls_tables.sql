-- Create table for WebRTC signaling
CREATE TABLE IF NOT EXISTS call_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
    signal_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for call history
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status TEXT NOT NULL CHECK (status IN ('missed', 'answered', 'rejected', 'ended')),
    duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for call_signals
CREATE POLICY "Users can insert signals"
ON call_signals FOR INSERT
TO authenticated
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can view signals addressed to them"
ON call_signals FOR SELECT
TO authenticated
USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

-- RLS Policies for calls
CREATE POLICY "Users can insert calls"
ON calls FOR INSERT
TO authenticated
WITH CHECK (caller_id = auth.uid());

CREATE POLICY "Users can view their calls"
ON calls FOR SELECT
TO authenticated
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can update their calls"
ON calls FOR UPDATE
TO authenticated
USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Enable Realtime for call_signals
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;

-- Create indexes for performance
CREATE INDEX idx_call_signals_to_user ON call_signals(to_user_id);
CREATE INDEX idx_call_signals_conversation ON call_signals(conversation_id);
CREATE INDEX idx_calls_conversation ON calls(conversation_id);
CREATE INDEX idx_calls_caller ON calls(caller_id);
CREATE INDEX idx_calls_receiver ON calls(receiver_id);

-- Auto-delete old signals (older than 1 hour)
CREATE OR REPLACE FUNCTION delete_old_call_signals()
RETURNS void AS $$
BEGIN
    DELETE FROM call_signals
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    RAISE NOTICE '✅ Call tables created successfully!';
    RAISE NOTICE '✅ RLS policies enabled!';
    RAISE NOTICE '✅ Realtime enabled for call_signals!';
END $$;
