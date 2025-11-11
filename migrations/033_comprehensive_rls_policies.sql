-- =====================================================
-- Comprehensive RLS Policies for Production Security
-- Migration: 033_comprehensive_rls_policies.sql
-- =====================================================

-- Drop existing policies to recreate with enhanced security
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing policies on main tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public profiles viewable by everyone, private profiles only by followers
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT USING (
    -- User can view their own profile
    id = auth.uid() OR
    -- Public profiles are viewable by everyone
    is_private = false OR
    -- Private profiles viewable by approved followers
    (
        is_private = true AND
        EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid()
            AND following_id = profiles.id
            AND status = 'active'
        )
    )
);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Users can update only their own profile
CREATE POLICY "profiles_update_policy" ON profiles
FOR UPDATE USING (id = auth.uid());

-- Prevent profile deletion (use soft delete instead)
CREATE POLICY "profiles_delete_policy" ON profiles
FOR DELETE USING (false);

-- =====================================================
-- POSTS TABLE POLICIES
-- =====================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Posts viewable based on profile privacy and blocking
CREATE POLICY "posts_select_policy" ON posts
FOR SELECT USING (
    -- User can view their own posts
    user_id = auth.uid() OR
    (
        -- Check if post owner's profile is accessible
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = posts.user_id
            AND (
                -- Public profile
                profiles.is_private = false OR
                -- Private profile but user is approved follower
                (
                    profiles.is_private = true AND
                    EXISTS (
                        SELECT 1 FROM follows
                        WHERE follower_id = auth.uid()
                        AND following_id = profiles.id
                        AND status = 'active'
                    )
                )
            )
        )
        -- Not blocked by post owner
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE blocker_id = posts.user_id
            AND blocked_id = auth.uid()
        )
        -- Not blocking post owner
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE blocker_id = auth.uid()
            AND blocked_id = posts.user_id
        )
    )
);

-- Users can insert their own posts
CREATE POLICY "posts_insert_policy" ON posts
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update only their own posts
CREATE POLICY "posts_update_policy" ON posts
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete only their own posts
CREATE POLICY "posts_delete_policy" ON posts
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- BOLTZ TABLE POLICIES
-- =====================================================

ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;

-- Boltz viewable based on profile privacy and blocking
CREATE POLICY "boltz_select_policy" ON boltz
FOR SELECT USING (
    user_id = auth.uid() OR
    (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = boltz.user_id
            AND (
                profiles.is_private = false OR
                (
                    profiles.is_private = true AND
                    EXISTS (
                        SELECT 1 FROM follows
                        WHERE follower_id = auth.uid()
                        AND following_id = profiles.id
                        AND status = 'active'
                    )
                )
            )
        )
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users
            WHERE (blocker_id = boltz.user_id AND blocked_id = auth.uid())
            OR (blocker_id = auth.uid() AND blocked_id = boltz.user_id)
        )
    )
);

CREATE POLICY "boltz_insert_policy" ON boltz
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "boltz_update_policy" ON boltz
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "boltz_delete_policy" ON boltz
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- FLASHES TABLE POLICIES
-- =====================================================

ALTER TABLE flashes ENABLE ROW LEVEL SECURITY;

-- Flashes viewable if not expired, respecting privacy and close friends
CREATE POLICY "flashes_select_policy" ON flashes
FOR SELECT USING (
    expires_at > NOW() AND
    (
        user_id = auth.uid() OR
        (
            -- Check close friends restriction
            (
                is_close_friends = false OR
                (
                    is_close_friends = true AND
                    EXISTS (
                        SELECT 1 FROM close_friends
                        WHERE user_id = flashes.user_id
                        AND friend_id = auth.uid()
                    )
                )
            )
            -- Check profile privacy
            AND EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = flashes.user_id
                AND (
                    profiles.is_private = false OR
                    (
                        profiles.is_private = true AND
                        EXISTS (
                            SELECT 1 FROM follows
                            WHERE follower_id = auth.uid()
                            AND following_id = profiles.id
                            AND status = 'active'
                        )
                    )
                )
            )
            -- Check blocking
            AND NOT EXISTS (
                SELECT 1 FROM blocked_users
                WHERE (blocker_id = flashes.user_id AND blocked_id = auth.uid())
                OR (blocker_id = auth.uid() AND blocked_id = flashes.user_id)
            )
        )
    )
);

CREATE POLICY "flashes_insert_policy" ON flashes
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "flashes_update_policy" ON flashes
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "flashes_delete_policy" ON flashes
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- COMMENTS TABLE POLICIES
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments viewable if parent content is viewable
CREATE POLICY "comments_select_policy" ON comments
FOR SELECT USING (
    user_id = auth.uid() OR
    (
        -- Can view if can view the parent post
        (
            post_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM posts
                WHERE posts.id = comments.post_id
                AND (
                    posts.user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM profiles
                        WHERE profiles.id = posts.user_id
                        AND (
                            profiles.is_private = false OR
                            EXISTS (
                                SELECT 1 FROM follows
                                WHERE follower_id = auth.uid()
                                AND following_id = profiles.id
                                AND status = 'active'
                            )
                        )
                    )
                )
            )
        )
        OR
        -- Can view if can view the parent boltz
        (
            boltz_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM boltz
                WHERE boltz.id = comments.boltz_id
                AND (
                    boltz.user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM profiles
                        WHERE profiles.id = boltz.user_id
                        AND (
                            profiles.is_private = false OR
                            EXISTS (
                                SELECT 1 FROM follows
                                WHERE follower_id = auth.uid()
                                AND following_id = profiles.id
                                AND status = 'active'
                            )
                        )
                    )
                )
            )
        )
    )
    -- Not blocked
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = comments.user_id AND blocked_id = auth.uid())
        OR (blocker_id = auth.uid() AND blocked_id = comments.user_id)
    )
);

-- Users can insert comments if they can view the content
CREATE POLICY "comments_insert_policy" ON comments
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (
        -- Can comment on posts they can view
        (
            post_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM posts
                WHERE posts.id = comments.post_id
            )
        )
        OR
        -- Can comment on boltz they can view
        (
            boltz_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM boltz
                WHERE boltz.id = comments.boltz_id
            )
        )
    )
    -- Not blocked by content owner
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users bu
        INNER JOIN posts p ON p.id = comments.post_id
        WHERE bu.blocker_id = p.user_id AND bu.blocked_id = auth.uid()
    )
    AND NOT EXISTS (
        SELECT 1 FROM blocked_users bu
        INNER JOIN boltz b ON b.id = comments.boltz_id
        WHERE bu.blocker_id = b.user_id AND bu.blocked_id = auth.uid()
    )
);

CREATE POLICY "comments_update_policy" ON comments
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "comments_delete_policy" ON comments
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- LIKES TABLE POLICIES
-- =====================================================

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Likes viewable if content is viewable
CREATE POLICY "likes_select_policy" ON likes
FOR SELECT USING (
    user_id = auth.uid() OR
    (
        -- Can view likes on posts they can view
        (
            post_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM posts
                WHERE posts.id = likes.post_id
            )
        )
        OR
        -- Can view likes on boltz they can view
        (
            boltz_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM boltz
                WHERE boltz.id = likes.boltz_id
            )
        )
        OR
        -- Can view likes on comments they can view
        (
            comment_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM comments
                WHERE comments.id = likes.comment_id
            )
        )
    )
);

-- Users can insert likes if they can view the content
CREATE POLICY "likes_insert_policy" ON likes
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
        SELECT 1 FROM blocked_users bu
        INNER JOIN posts p ON p.id = likes.post_id
        WHERE bu.blocker_id = p.user_id AND bu.blocked_id = auth.uid()
    )
);

CREATE POLICY "likes_delete_policy" ON likes
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- FOLLOWS TABLE POLICIES
-- =====================================================

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows involving them or public follows
CREATE POLICY "follows_select_policy" ON follows
FOR SELECT USING (
    follower_id = auth.uid() OR
    following_id = auth.uid() OR
    (
        -- Can view active follows of public profiles
        status = 'active' AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = follows.following_id
            AND profiles.is_private = false
        )
    )
);

-- Users can follow others (creates pending or active based on privacy)
CREATE POLICY "follows_insert_policy" ON follows
FOR INSERT WITH CHECK (
    follower_id = auth.uid() AND
    follower_id != following_id AND
    -- Not blocked
    NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = following_id AND blocked_id = auth.uid())
        OR (blocker_id = auth.uid() AND blocked_id = following_id)
    )
);

-- Users can update follow status if they're the target (for approving requests)
CREATE POLICY "follows_update_policy" ON follows
FOR UPDATE USING (
    following_id = auth.uid() OR
    follower_id = auth.uid()
);

-- Users can unfollow
CREATE POLICY "follows_delete_policy" ON follows
FOR DELETE USING (
    follower_id = auth.uid() OR
    following_id = auth.uid()
);

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only view messages they sent or received
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    -- For group messages
    EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
);

-- Users can send messages if not blocked
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    NOT EXISTS (
        SELECT 1 FROM blocked_users
        WHERE (blocker_id = receiver_id AND blocked_id = auth.uid())
        OR (blocker_id = auth.uid() AND blocked_id = receiver_id)
    )
);

-- Users can update their own messages
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "messages_delete_policy" ON messages
FOR DELETE USING (sender_id = auth.uid());

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "notifications_select_policy" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- System can insert notifications (handled by triggers)
CREATE POLICY "notifications_insert_policy" ON notifications
FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_policy" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON notifications
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- SAVES TABLE POLICIES
-- =====================================================

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saves
CREATE POLICY "saves_select_policy" ON saves
FOR SELECT USING (user_id = auth.uid());

-- Users can save posts they can view
CREATE POLICY "saves_insert_policy" ON saves
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM posts
        WHERE posts.id = saves.post_id
    )
);

-- Users can delete their own saves
CREATE POLICY "saves_delete_policy" ON saves
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- BLOCKED_USERS TABLE POLICIES
-- =====================================================

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own blocks
CREATE POLICY "blocked_users_select_policy" ON blocked_users
FOR SELECT USING (blocker_id = auth.uid());

-- Users can block others
CREATE POLICY "blocked_users_insert_policy" ON blocked_users
FOR INSERT WITH CHECK (
    blocker_id = auth.uid() AND
    blocker_id != blocked_id
);

-- Users can unblock others
CREATE POLICY "blocked_users_delete_policy" ON blocked_users
FOR DELETE USING (blocker_id = auth.uid());

-- =====================================================
-- CLOSE_FRIENDS TABLE POLICIES
-- =====================================================

ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;

-- Users can only view their own close friends list
CREATE POLICY "close_friends_select_policy" ON close_friends
FOR SELECT USING (user_id = auth.uid());

-- Users can add to their close friends list
CREATE POLICY "close_friends_insert_policy" ON close_friends
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can remove from their close friends list
CREATE POLICY "close_friends_delete_policy" ON close_friends
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- HIGHLIGHTS TABLE POLICIES
-- =====================================================

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Highlights viewable based on profile privacy
CREATE POLICY "highlights_select_policy" ON highlights
FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = highlights.user_id
        AND (
            profiles.is_private = false OR
            EXISTS (
                SELECT 1 FROM follows
                WHERE follower_id = auth.uid()
                AND following_id = profiles.id
                AND status = 'active'
            )
        )
    )
);

CREATE POLICY "highlights_insert_policy" ON highlights
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "highlights_update_policy" ON highlights
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "highlights_delete_policy" ON highlights
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- USER_SETTINGS TABLE POLICIES
-- =====================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own settings
CREATE POLICY "user_settings_select_policy" ON user_settings
FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own settings
CREATE POLICY "user_settings_insert_policy" ON user_settings
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "user_settings_update_policy" ON user_settings
FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- REPORTS TABLE POLICIES (if exists)
-- =====================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
        
        -- Users can view their own reports
        EXECUTE 'CREATE POLICY "reports_select_policy" ON reports
        FOR SELECT USING (reporter_id = auth.uid())';
        
        -- Users can create reports
        EXECUTE 'CREATE POLICY "reports_insert_policy" ON reports
        FOR INSERT WITH CHECK (reporter_id = auth.uid())';
    END IF;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Total RLS policies created: %', policy_count;
END $$;

-- List all tables with RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;
