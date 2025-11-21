-- Migration: Audio/Video Calls System
-- Description: Creates tables and functions for WebRTC-based audio/video calling

-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'active', 'completed', 'missed', 'declined', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_call CHECK (caller_id != receiver_id)
);

-- Create call_signaling table for WebRTC signaling
CREATE TABLE IF NOT EXISTS call_signaling (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_signaling_call_id ON call_signaling(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_created_at ON call_signaling(created_at DESC);

-- Create composite index for call history queries
CREATE INDEX IF NOT EXISTS idx_calls_user_created ON calls(caller_id, receiver_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls table
-- Users can view calls they're part of
CREATE POLICY "Users can view own calls"
  ON calls FOR SELECT
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

-- Users can insert calls they initiate
CREATE POLICY "Users can insert own calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Users can update calls they're part of
CREATE POLICY "Users can update own calls"
  ON calls FOR UPDATE
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

-- RLS Policies for call_signaling table
-- Users can view signaling for their calls
CREATE POLICY "Users can view own call signaling"
  ON call_signaling FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_signaling.call_id
        AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
    )
  );

-- Users can insert signaling for their calls
CREATE POLICY "Users can insert own call signaling"
  ON call_signaling FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = call_signaling.call_id
        AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())
    )
  );

-- Function to update call duration
CREATE OR REPLACE FUNCTION update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.answered_at IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.answered_at))::INTEGER;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update call duration
DROP TRIGGER IF EXISTS trigger_update_call_duration ON calls;
CREATE TRIGGER trigger_update_call_duration
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_call_duration();

-- Function to get call history for a user
CREATE OR REPLACE FUNCTION get_call_history(
  user_uuid UUID,
  page_size INTEGER DEFAULT 50,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  caller_id UUID,
  receiver_id UUID,
  call_type TEXT,
  status TEXT,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  is_incoming BOOLEAN,
  other_user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.caller_id,
    c.receiver_id,
    c.call_type,
    c.status,
    c.duration,
    c.created_at,
    (c.receiver_id = user_uuid) AS is_incoming,
    CASE 
      WHEN c.caller_id = user_uuid THEN c.receiver_id
      ELSE c.caller_id
    END AS other_user_id,
    p.username,
    p.full_name,
    p.avatar_url
  FROM calls c
  JOIN profiles p ON (
    CASE 
      WHEN c.caller_id = user_uuid THEN p.id = c.receiver_id
      ELSE p.id = c.caller_id
    END
  )
  WHERE c.caller_id = user_uuid OR c.receiver_id = user_uuid
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a call notification
CREATE OR REPLACE FUNCTION create_call_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for incoming call
  IF NEW.status = 'ringing' THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content_id,
      content_type,
      message,
      is_read
    ) VALUES (
      NEW.receiver_id,
      'call',
      NEW.caller_id,
      NEW.id,
      NEW.call_type,
      CASE 
        WHEN NEW.call_type = 'video' THEN 'Incoming video call'
        ELSE 'Incoming audio call'
      END,
      false
    );
  END IF;

  -- Create notification for missed call
  IF NEW.status = 'missed' AND OLD.status != 'missed' THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content_id,
      content_type,
      message,
      is_read
    ) VALUES (
      NEW.receiver_id,
      'call',
      NEW.caller_id,
      NEW.id,
      NEW.call_type,
      CASE 
        WHEN NEW.call_type = 'video' THEN 'Missed video call'
        ELSE 'Missed audio call'
      END,
      false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create call notifications
DROP TRIGGER IF EXISTS trigger_create_call_notification ON calls;
CREATE TRIGGER trigger_create_call_notification
  AFTER INSERT OR UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION create_call_notification();

-- Function to cleanup old signaling data (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_signaling()
RETURNS void AS $$
BEGIN
  DELETE FROM call_signaling
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON calls TO authenticated;
GRANT SELECT, INSERT ON call_signaling TO authenticated;
GRANT EXECUTE ON FUNCTION get_call_history TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_signaling TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE calls IS 'Stores audio and video call records';
COMMENT ON TABLE call_signaling IS 'Stores WebRTC signaling data (offers, answers, ICE candidates)';
COMMENT ON FUNCTION get_call_history IS 'Retrieves call history for a user with pagination';
COMMENT ON FUNCTION update_call_duration IS 'Automatically calculates call duration when call ends';
COMMENT ON FUNCTION create_call_notification IS 'Creates notifications for incoming and missed calls';
COMMENT ON FUNCTION cleanup_old_signaling IS 'Removes old signaling data to keep table size manageable';
