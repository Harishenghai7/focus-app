-- Free WebRTC signaling table
CREATE TABLE call_signals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  call_id UUID REFERENCES call_sessions(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice-candidate')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policy - only call participants can access signals
CREATE POLICY "Call participants can access signals" ON call_signals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM call_sessions 
    WHERE call_sessions.id = call_signals.call_id 
    AND (call_sessions.caller_id = auth.uid() OR call_sessions.callee_id = auth.uid())
  )
);

CREATE POLICY "Call participants can create signals" ON call_signals FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM call_sessions 
    WHERE call_sessions.id = call_signals.call_id 
    AND (call_sessions.caller_id = auth.uid() OR call_sessions.callee_id = auth.uid())
  )
);

-- Index for performance
CREATE INDEX idx_call_signals_call_id ON call_signals(call_id);
CREATE INDEX idx_call_signals_created_at ON call_signals(created_at DESC);