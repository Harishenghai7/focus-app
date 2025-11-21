-- Migration: Follow Requests System
-- Description: Add status column to follows table and create follow request approval flow

-- Add status column to follows table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'follows' AND column_name = 'status'
  ) THEN
    ALTER TABLE follows ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active'));
  END IF;
END $$;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
CREATE INDEX IF NOT EXISTS idx_follows_following_status ON follows(following_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_follower_status ON follows(follower_id, status);

-- Update existing follows to have 'active' status
UPDATE follows SET status = 'active' WHERE status IS NULL;

-- Create function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only update counts for active follows
    IF NEW.status = 'active' THEN
      -- Update follower count for the user being followed
      UPDATE profiles 
      SET followers_count = COALESCE(followers_count, 0) + 1
      WHERE id = NEW.following_id;
      
      -- Update following count for the follower
      UPDATE profiles 
      SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from pending to active
    IF OLD.status = 'pending' AND NEW.status = 'active' THEN
      -- Update follower count for the user being followed
      UPDATE profiles 
      SET followers_count = COALESCE(followers_count, 0) + 1
      WHERE id = NEW.following_id;
      
      -- Update following count for the follower
      UPDATE profiles 
      SET following_count = COALESCE(following_count, 0) + 1
      WHERE id = NEW.follower_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement counts if the follow was active
    IF OLD.status = 'active' THEN
      -- Update follower count for the user being unfollowed
      UPDATE profiles 
      SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
      WHERE id = OLD.following_id;
      
      -- Update following count for the unfollower
      UPDATE profiles 
      SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
      WHERE id = OLD.follower_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;

-- Create trigger for follow counts
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Create function to handle follow request notifications
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Create notification for follow request or new follow
    INSERT INTO notifications (
      user_id,
      type,
      from_user_id,
      content,
      reference_id,
      reference_type
    ) VALUES (
      NEW.following_id,
      CASE WHEN NEW.status = 'pending' THEN 'follow_request' ELSE 'follow' END,
      NEW.follower_id,
      CASE WHEN NEW.status = 'pending' THEN 'requested to follow you' ELSE 'started following you' END,
      NEW.id,
      'follow'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from pending to active, create follow notification
    IF OLD.status = 'pending' AND NEW.status = 'active' THEN
      -- Delete the pending request notification
      DELETE FROM notifications 
      WHERE reference_id = NEW.id 
        AND reference_type = 'follow' 
        AND type = 'follow_request';
      
      -- Create follow notification
      INSERT INTO notifications (
        user_id,
        type,
        from_user_id,
        content,
        reference_id,
        reference_type
      ) VALUES (
        NEW.follower_id,
        'follow_request_accepted',
        NEW.following_id,
        'accepted your follow request',
        NEW.id,
        'follow'
      );
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_follow_notification_trigger ON follows;

-- Create trigger for follow notifications
CREATE TRIGGER create_follow_notification_trigger
AFTER INSERT OR UPDATE ON follows
FOR EACH ROW
EXECUTE FUNCTION create_follow_notification();

-- Add columns to notifications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'reference_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_type TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'from_user_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on notifications for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user ON notifications(from_user_id);

-- Update RLS policies for follows table
DROP POLICY IF EXISTS "Users can view follows" ON follows;
CREATE POLICY "Users can view follows"
  ON follows FOR SELECT
  USING (
    follower_id = auth.uid() OR 
    following_id = auth.uid() OR
    status = 'active'
  );

DROP POLICY IF EXISTS "Users can create follows" ON follows;
CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  WITH CHECK (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own follows" ON follows;
CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  USING (follower_id = auth.uid());

DROP POLICY IF EXISTS "Users can update follow requests" ON follows;
CREATE POLICY "Users can update follow requests"
  ON follows FOR UPDATE
  USING (
    following_id = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    following_id = auth.uid() AND status IN ('active', 'pending')
  );

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
