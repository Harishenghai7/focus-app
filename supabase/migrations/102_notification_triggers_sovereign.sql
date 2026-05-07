-- ============================================================================
-- SOVEREIGN HEARTBEAT: Notification Triggers System
-- Auto-generates notifications for user interactions
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. NOTIFICATION CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_actor_id UUID,
    p_type TEXT,
    p_content TEXT,
    p_content_id UUID DEFAULT NULL,
    p_content_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Don't create notification if user is acting on their own content
    IF p_user_id = p_actor_id THEN
        RETURN NULL;
    END IF;

    -- Check if user has blocked the actor
    IF EXISTS (
        SELECT 1 FROM blocked_users 
        WHERE blocker_id = p_user_id AND blocked_id = p_actor_id
    ) THEN
        RETURN NULL;
    END IF;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        from_user_id,
        actor_id,
        type,
        content,
        text,
        post_id,
        boltz_id,
        comment_id,
        content_id,
        content_type,
        is_read,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_actor_id,
        p_actor_id,
        p_type,
        p_content,
        p_content,
        CASE WHEN p_content_type = 'post' THEN p_content_id ELSE NULL END,
        CASE WHEN p_content_type = 'boltz' THEN p_content_id ELSE NULL END,
        CASE WHEN p_content_type = 'comment' THEN p_content_id ELSE NULL END,
        p_content_id,
        p_content_type,
        FALSE,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. LIKE NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_content_type TEXT;
    v_content_id UUID;
BEGIN
    -- Determine content type and owner
    IF NEW.post_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
        v_content_type := 'post';
        v_content_id := NEW.post_id;
    ELSIF NEW.boltz_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM boltz WHERE id = NEW.boltz_id;
        v_content_type := 'boltz';
        v_content_id := NEW.boltz_id;
    ELSIF NEW.flash_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM flashes WHERE id = NEW.flash_id;
        v_content_type := 'flash';
        v_content_id := NEW.flash_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM comments WHERE id = NEW.comment_id;
        v_content_type := 'comment';
        v_content_id := NEW.comment_id;
    ELSE
        RETURN NEW;
    END IF;

    -- Create notification for content owner
    IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            v_post_owner_id,
            NEW.user_id,
            CASE WHEN v_content_type = 'boltz' THEN 'boltz_like' ELSE 'like' END,
            'liked your ' || v_content_type,
            v_content_id,
            v_content_type,
            jsonb_build_object('like_id', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS like_notification_trigger ON likes;

-- Create trigger for likes
CREATE TRIGGER like_notification_trigger
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_like_notification();

-- ============================================================================
-- 3. COMMENT NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_post_owner_id UUID;
    v_content_type TEXT;
    v_content_id UUID;
    v_parent_comment_owner UUID;
    v_mentioned_user_id UUID;
    v_mention_pattern TEXT;
BEGIN
    -- Determine content type and owner
    IF NEW.post_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM posts WHERE id = NEW.post_id;
        v_content_type := 'post';
        v_content_id := NEW.post_id;
    ELSIF NEW.boltz_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM boltz WHERE id = NEW.boltz_id;
        v_content_type := 'boltz';
        v_content_id := NEW.boltz_id;
    ELSIF NEW.flash_id IS NOT NULL THEN
        SELECT user_id INTO v_post_owner_id FROM flashes WHERE id = NEW.flash_id;
        v_content_type := 'flash';
        v_content_id := NEW.flash_id;
    ELSE
        RETURN NEW;
    END IF;

    -- Notify post owner (if not the commenter)
    IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            v_post_owner_id,
            NEW.user_id,
            CASE WHEN v_content_type = 'boltz' THEN 'boltz_comment' ELSE 'comment' END,
            NEW.content,
            NEW.id,
            'comment',
            jsonb_build_object(
                'post_id', v_content_id,
                'post_type', v_content_type,
                'comment_id', NEW.id
            )
        );
    END IF;

    -- Handle reply to comment - notify parent comment owner
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO v_parent_comment_owner 
        FROM comments WHERE id = NEW.parent_id;
        
        IF v_parent_comment_owner IS NOT NULL 
           AND v_parent_comment_owner != NEW.user_id 
           AND v_parent_comment_owner != v_post_owner_id THEN
            PERFORM create_notification(
                v_parent_comment_owner,
                NEW.user_id,
                'reply',
                NEW.content,
                NEW.id,
                'comment',
                jsonb_build_object(
                    'parent_comment_id', NEW.parent_id,
                    'post_id', v_content_id,
                    'post_type', v_content_type
                )
            );
        END IF;
    END IF;

    -- Handle mentions (@username)
    FOR v_mentioned_user_id IN
        SELECT p.id 
        FROM profiles p
        WHERE NEW.content ILIKE '%@' || p.username || '%'
        AND p.id != NEW.user_id
    LOOP
        PERFORM create_notification(
            v_mentioned_user_id,
            NEW.user_id,
            'mention',
            NEW.content,
            NEW.id,
            'comment',
            jsonb_build_object(
                'post_id', v_content_id,
                'post_type', v_content_type
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS comment_notification_trigger ON comments;

-- Create trigger for comments
CREATE TRIGGER comment_notification_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_comment_notification();

-- ============================================================================
-- 4. FOLLOW NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_follower_profile RECORD;
BEGIN
    -- Get follower profile info
    SELECT username, full_name INTO v_follower_profile
    FROM profiles WHERE id = NEW.follower_id;

    -- Create follow notification for the person being followed
    PERFORM create_notification(
        NEW.following_id,
        NEW.follower_id,
        'follow',
        COALESCE(v_follower_profile.full_name, v_follower_profile.username) || ' started following you',
        NULL,
        NULL,
        jsonb_build_object('follow_id', NEW.id)
    );

    -- Update follower counts
    UPDATE profiles 
    SET follower_count = follower_count + 1,
        updated_at = NOW()
    WHERE id = NEW.following_id;

    UPDATE profiles 
    SET following_count = following_count + 1,
        updated_at = NOW()
    WHERE id = NEW.follower_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;

-- Create trigger for follows
CREATE TRIGGER follow_notification_trigger
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION handle_follow_notification();

-- ============================================================================
-- 5. MESSAGE NOTIFICATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_profile RECORD;
    v_conversation_members UUID[];
    v_member_id UUID;
BEGIN
    -- Get sender profile
    SELECT username, full_name INTO v_sender_profile
    FROM profiles WHERE id = NEW.sender_id;

    -- Get all conversation members except sender
    SELECT array_agg(user_id) INTO v_conversation_members
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

    -- Create message notification for each member
    IF v_conversation_members IS NOT NULL THEN
        FOREACH v_member_id IN ARRAY v_conversation_members
        LOOP
            PERFORM create_notification(
                v_member_id,
                NEW.sender_id,
                'message',
                COALESCE(NEW.content, 'Sent you a message'),
                NEW.id,
                'message',
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'message_id', NEW.id,
                    'media_url', NEW.media_url,
                    'media_type', NEW.media_type
                )
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;

-- Create trigger for messages
CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.is_deleted = FALSE)
    EXECUTE FUNCTION handle_message_notification();

-- ============================================================================
-- 6. SECURITY NOTIFICATION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_security_notification(
    p_user_id UUID,
    p_type TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        content,
        text,
        is_read,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_message,
        p_message,
        FALSE,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. VERIFICATION NOTIFICATION FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_verification_notification(
    p_user_id UUID,
    p_type TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        content,
        text,
        is_read,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        p_type,
        p_message,
        p_message,
        FALSE,
        p_metadata,
        NOW()
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. BATCHING UTILITY FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_notification_batch_summary(
    p_user_id UUID,
    p_type TEXT,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    count BIGINT,
    latest_actor_id UUID,
    latest_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as count,
        MAX(actor_id) as latest_actor_id,
        MAX(created_at) as latest_created_at
    FROM notifications
    WHERE user_id = p_user_id
    AND type = p_type
    AND created_at > NOW() - INTERVAL '1 hour' * p_hours_back
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. INDEXES FOR NOTIFICATION PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type_unread ON notifications(user_id, type, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_content ON notifications(content_id, content_type) WHERE content_id IS NOT NULL;

-- ============================================================================
-- 10. CLEANUP FUNCTION (Memory Management)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications(
    p_days_to_keep INTEGER DEFAULT 30,
    p_max_per_user INTEGER DEFAULT 500
)
RETURNS TABLE (deleted_count BIGINT) AS $$
BEGIN
    -- Delete old read notifications
    RETURN QUERY
    WITH deleted AS (
        DELETE FROM notifications
        WHERE is_read = TRUE
        AND created_at < NOW() - INTERVAL '1 day' * p_days_to_keep
        AND id NOT IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
                FROM notifications
            ) ranked WHERE rn <= p_max_per_user
        )
        RETURNING id
    )
    SELECT COUNT(*) as deleted_count FROM deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Sovereign Heartbeat Notification System Initialized!';
    RAISE NOTICE '   - Like notifications: ENABLED';
    RAISE NOTICE '   - Comment notifications: ENABLED';
    RAISE NOTICE '   - Follow notifications: ENABLED';
    RAISE NOTICE '   - Message notifications: ENABLED';
    RAISE NOTICE '   - Batching system: ENABLED';
    RAISE NOTICE '   - Auto-cleanup: ENABLED';
END $$;
