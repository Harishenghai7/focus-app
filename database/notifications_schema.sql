-- ============================================
-- Notifications System Schema
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention', 'reply', 'share')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    boltz_id UUID REFERENCES boltz(id) ON DELETE CASCADE,
    comment_id UUID,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate notifications
    CONSTRAINT unique_notification UNIQUE (user_id, actor_id, type, post_id, boltz_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read, created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- Notification Triggers
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_actor_id UUID,
    p_type TEXT,
    p_post_id UUID DEFAULT NULL,
    p_boltz_id UUID DEFAULT NULL,
    p_comment_id UUID DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Don't notify if user is acting on their own content
    IF p_user_id = p_actor_id THEN
        RETURN;
    END IF;
    
    -- Insert notification (ignore duplicates)
    INSERT INTO notifications (user_id, actor_id, type, post_id, boltz_id, comment_id, message)
    VALUES (p_user_id, p_actor_id, p_type, p_post_id, p_boltz_id, p_comment_id, p_message)
    ON CONFLICT (user_id, actor_id, type, post_id, boltz_id) 
    DO UPDATE SET 
        created_at = NOW(),
        read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Notify on post like
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        (SELECT user_id FROM posts WHERE id = NEW.post_id),
        NEW.user_id,
        'like',
        NEW.post_id,
        NULL,
        NULL,
        'liked your post'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_post_like_trigger ON post_likes;
CREATE TRIGGER notify_post_like_trigger
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_post_like();

-- Trigger: Notify on post comment
CREATE OR REPLACE FUNCTION notify_on_post_comment()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        (SELECT user_id FROM posts WHERE id = NEW.post_id),
        NEW.user_id,
        'comment',
        NEW.post_id,
        NULL,
        NEW.id,
        'commented on your post'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_post_comment_trigger ON post_comments;
CREATE TRIGGER notify_post_comment_trigger
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_post_comment();

-- Trigger: Notify on boltz like
CREATE OR REPLACE FUNCTION notify_on_boltz_like()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        (SELECT user_id FROM boltz WHERE id = NEW.boltz_id),
        NEW.user_id,
        'like',
        NULL,
        NEW.boltz_id,
        NULL,
        'liked your boltz'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_boltz_like_trigger ON boltz_likes;
CREATE TRIGGER notify_boltz_like_trigger
AFTER INSERT ON boltz_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_boltz_like();

-- Trigger: Notify on boltz comment
CREATE OR REPLACE FUNCTION notify_on_boltz_comment()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        (SELECT user_id FROM boltz WHERE id = NEW.boltz_id),
        NEW.user_id,
        'comment',
        NULL,
        NEW.boltz_id,
        NEW.id,
        'commented on your boltz'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_boltz_comment_trigger ON boltz_comments;
CREATE TRIGGER notify_boltz_comment_trigger
AFTER INSERT ON boltz_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_boltz_comment();

-- Trigger: Notify on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_notification(
        NEW.following_id,
        NEW.follower_id,
        'follow',
        NULL,
        NULL,
        NULL,
        'started following you'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_follow_trigger ON follows;
CREATE TRIGGER notify_follow_trigger
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow();
