-- ============================================
-- FOCUS APP - COMPLETE DATABASE SETUP
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    phone TEXT,
    gender TEXT,
    date_of_birth DATE,
    is_private BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    caption TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- 'image' or 'video'
    thumbnail_url TEXT,
    location TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    comments_disabled BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. BOLTZ TABLE (Short Videos)
-- ============================================
CREATE TABLE IF NOT EXISTS boltz (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    duration INTEGER, -- in seconds
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. FLASHES TABLE (Stories)
-- ============================================
CREATE TABLE IF NOT EXISTS flashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    duration INTEGER DEFAULT 5,
    is_close_friends BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL, -- post_id, boltz_id, etc.
    content_type TEXT NOT NULL, -- 'post', 'boltz', etc.
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL, -- 'post', 'boltz', 'comment'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id, content_type)
);

-- ============================================
-- 7. FOLLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'accepted', -- 'pending', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- ============================================
-- 8. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'video', 'voice'
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'mention'
    content_id UUID,
    content_type TEXT,
    text TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. SAVES TABLE (Bookmarks)
-- ============================================
CREATE TABLE IF NOT EXISTS saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL, -- 'post', 'boltz'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id, content_type)
);

-- ============================================
-- 11. CLOSE FRIENDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS close_friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- ============================================
-- 12. HIGHLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 13. HIGHLIGHT STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS highlight_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE NOT NULL,
    flash_id UUID REFERENCES flashes(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. BLOCKED USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================
-- 15. REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    reported_id UUID, -- user_id or content_id
    reported_type TEXT NOT NULL, -- 'user', 'post', 'comment'
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_likes_content ON likes(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_flashes_user ON flashes(user_id);
CREATE INDEX IF NOT EXISTS idx_flashes_expires ON flashes(expires_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Public posts viewable by all, users can manage their own
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Boltz: Public boltz viewable by all, users can manage their own
CREATE POLICY "Boltz are viewable by everyone" ON boltz FOR SELECT USING (true);
CREATE POLICY "Users can insert own boltz" ON boltz FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boltz" ON boltz FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own boltz" ON boltz FOR DELETE USING (auth.uid() = user_id);

-- Flashes: Viewable by all (if not expired), users can manage their own
CREATE POLICY "Flashes are viewable by everyone" ON flashes FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can insert own flashes" ON flashes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashes" ON flashes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashes" ON flashes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Viewable by all, users can manage their own
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes: Users can manage their own likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Follows: Users can manage their own follows
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can insert own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Messages: Users can only see their own messages
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Saves: Users can manage their own saves
CREATE POLICY "Users can view own saves" ON saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saves" ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saves" ON saves FOR DELETE USING (auth.uid() = user_id);

-- Close Friends: Users can manage their own close friends list
CREATE POLICY "Users can view own close friends" ON close_friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add close friends" ON close_friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove close friends" ON close_friends FOR DELETE USING (auth.uid() = user_id);

-- Highlights: Users can view all highlights, manage their own
CREATE POLICY "Highlights are viewable by everyone" ON highlights FOR SELECT USING (true);
CREATE POLICY "Users can create own highlights" ON highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own highlights" ON highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own highlights" ON highlights FOR DELETE USING (auth.uid() = user_id);

-- Highlight Stories: Viewable by all, users can manage their own
CREATE POLICY "Highlight stories are viewable by everyone" ON highlight_stories FOR SELECT USING (true);
CREATE POLICY "Users can add stories to own highlights" ON highlight_stories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM highlights WHERE highlights.id = highlight_stories.highlight_id AND highlights.user_id = auth.uid())
);
CREATE POLICY "Users can remove stories from own highlights" ON highlight_stories FOR DELETE USING (
    EXISTS (SELECT 1 FROM highlights WHERE highlights.id = highlight_stories.highlight_id AND highlights.user_id = auth.uid())
);

-- Blocked Users: Users can manage their own blocks
CREATE POLICY "Users can view own blocks" ON blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- Reports: Users can view and create their own reports
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Run these in Supabase Dashboard → Storage
-- Or use the Supabase Dashboard UI to create buckets

-- Create storage buckets (run in SQL Editor):
-- Using ON CONFLICT to avoid errors if buckets already exist
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('posts', 'posts', true),
('boltz', 'boltz', true),
('flash', 'flash', true),
('messages', 'messages', false),
('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    public = EXCLUDED.public;

-- Storage policies for avatars (drop if exists first)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for posts
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users can upload post images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for boltz
CREATE POLICY "Boltz videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'boltz');
CREATE POLICY "Users can upload boltz videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own boltz videos" ON storage.objects FOR UPDATE USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own boltz videos" ON storage.objects FOR DELETE USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for flash
CREATE POLICY "Flash media are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'flash');
CREATE POLICY "Users can upload flash media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own flash media" ON storage.objects FOR UPDATE USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own flash media" ON storage.objects FOR DELETE USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- DONE! 🎉
-- ============================================
-- Your database is now ready for the Focus app!
-- Next steps:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Verify buckets are created
-- 3. Test the app!
-- ============================================
