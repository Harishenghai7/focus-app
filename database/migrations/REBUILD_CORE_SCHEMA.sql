-- 🚨 DANGER: This script rebuilds the core schema. Data will be lost! 🚨

-- 1. Drop existing tables (Cascade to remove dependent objects)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.boltz_comments CASCADE;
DROP TABLE IF EXISTS public.boltz_likes CASCADE;
DROP TABLE IF EXISTS public.boltz_saves CASCADE;
DROP TABLE IF EXISTS public.boltz CASCADE;
DROP TABLE IF EXISTS public.saved_posts CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
-- Note: We generally preserve 'profiles' and 'follows' as they are foundational, 
-- but we will ensure they have the right columns.

-- 2. Create Tables

-- 📸 Posts (Home Feed)
CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('image', 'video')) NOT NULL,
    caption TEXT,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ⚡ Boltz (Short Videos)
CREATE TABLE public.boltz (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    music_url TEXT,
    duration FLOAT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ⚡ Flash (Stories)
CREATE TABLE public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT CHECK (media_type IN ('image', 'video')) NOT NULL,
    duration INTEGER DEFAULT 5, -- seconds
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours') NOT NULL
);

CREATE TABLE public.story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(story_id, user_id)
);

-- ❤️ Interactions: Likes
CREATE TABLE public.post_likes (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.boltz_likes (
    boltz_id UUID REFERENCES public.boltz(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (boltz_id, user_id)
);

-- 💬 Interactions: Comments
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.boltz_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    boltz_id UUID REFERENCES public.boltz(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 💾 Interactions: Saves
CREATE TABLE public.saved_posts (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE public.boltz_saves (
    boltz_id UUID REFERENCES public.boltz(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (boltz_id, user_id)
);

-- 🔔 Notifications
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Sender
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'mention', 'message', 'system')),
    content TEXT,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    boltz_id UUID REFERENCES public.boltz(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ⚙️ User Settings
CREATE TABLE public.user_settings (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    font_size TEXT DEFAULT 'medium',
    glassmorphism_enabled BOOLEAN DEFAULT true,
    high_contrast_mode BOOLEAN DEFAULT false,
    account_visibility TEXT DEFAULT 'public',
    two_factor_enabled BOOLEAN DEFAULT false,
    show_activity_status BOOLEAN DEFAULT true,
    who_can_view_profile TEXT DEFAULT 'everyone',
    who_can_view_posts TEXT DEFAULT 'everyone',
    who_can_view_stories TEXT DEFAULT 'everyone',
    who_can_view_boltz TEXT DEFAULT 'everyone',
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    notify_likes BOOLEAN DEFAULT true,
    notify_comments BOOLEAN DEFAULT true,
    notify_followers BOOLEAN DEFAULT true,
    notify_mentions BOOLEAN DEFAULT true,
    notify_messages BOOLEAN DEFAULT true,
    notify_boltz BOOLEAN DEFAULT true,
    notify_flash BOOLEAN DEFAULT true,
    notification_sound TEXT DEFAULT 'default',
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boltz_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- Public Read Policies
CREATE POLICY "Public posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public boltz are viewable by everyone" ON public.boltz FOR SELECT USING (true);
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Boltz comments are viewable by everyone" ON public.boltz_comments FOR SELECT USING (true);
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Boltz likes are viewable by everyone" ON public.boltz_likes FOR SELECT USING (true);

-- Authenticated Create/Update/Delete Policies (Users can manage their own content)
CREATE POLICY "Users can insert their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own boltz" ON public.boltz FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boltz" ON public.boltz FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boltz" ON public.boltz FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view who viewed their stories" ON public.story_views FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_id)
);
CREATE POLICY "Users can mark stories as viewed" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can like posts" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can like boltz" ON public.boltz_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike boltz" ON public.boltz_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can comment on posts" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can comment on boltz" ON public.boltz_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boltz comments" ON public.boltz_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their saved posts" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save boltz" ON public.boltz_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave boltz" ON public.boltz_saves FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their saved boltz" ON public.boltz_saves FOR SELECT USING (auth.uid() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true); -- Allow triggers/functions/authenticated users to create notifications
CREATE POLICY "Users can update their own notifications (mark read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Settings: Users can only see/edit their own settings
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Indexes for Performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_boltz_user_id ON public.boltz(user_id);
CREATE INDEX idx_boltz_created_at ON public.boltz(created_at DESC);
CREATE INDEX idx_stories_user_id ON public.stories(user_id);
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_boltz_comments_boltz_id ON public.boltz_comments(boltz_id);

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_boltz_updated_at BEFORE UPDATE ON public.boltz FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
