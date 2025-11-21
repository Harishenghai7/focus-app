-- ============================================
-- FIX RLS POLICIES - Add Missing Policies
-- ============================================
-- Run this if you're getting RLS policy errors
-- This adds all missing policies for boltz, flashes, and other tables
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Boltz are viewable by everyone" ON boltz;
DROP POLICY IF EXISTS "Users can insert own boltz" ON boltz;
DROP POLICY IF EXISTS "Users can update own boltz" ON boltz;
DROP POLICY IF EXISTS "Users can delete own boltz" ON boltz;

DROP POLICY IF EXISTS "Flashes are viewable by everyone" ON flashes;
DROP POLICY IF EXISTS "Users can insert own flashes" ON flashes;
DROP POLICY IF EXISTS "Users can update own flashes" ON flashes;
DROP POLICY IF EXISTS "Users can delete own flashes" ON flashes;

DROP POLICY IF EXISTS "Users can view own close friends" ON close_friends;
DROP POLICY IF EXISTS "Users can add close friends" ON close_friends;
DROP POLICY IF EXISTS "Users can remove close friends" ON close_friends;

DROP POLICY IF EXISTS "Highlights are viewable by everyone" ON highlights;
DROP POLICY IF EXISTS "Users can create own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;

DROP POLICY IF EXISTS "Highlight stories are viewable by everyone" ON highlight_stories;
DROP POLICY IF EXISTS "Users can add stories to own highlights" ON highlight_stories;
DROP POLICY IF EXISTS "Users can remove stories from own highlights" ON highlight_stories;

DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;

DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

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
-- STORAGE POLICIES
-- ============================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Boltz videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload boltz videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own boltz videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own boltz videos" ON storage.objects;

DROP POLICY IF EXISTS "Flash media are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload flash media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own flash media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own flash media" ON storage.objects;

DROP POLICY IF EXISTS "Thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;

DROP POLICY IF EXISTS "Users can update own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own post images" ON storage.objects;

-- Create storage policies
CREATE POLICY "Users can update own post images" ON storage.objects FOR UPDATE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own post images" ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Boltz videos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'boltz');
CREATE POLICY "Users can upload boltz videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own boltz videos" ON storage.objects FOR UPDATE USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own boltz videos" ON storage.objects FOR DELETE USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Flash media are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'flash');
CREATE POLICY "Users can upload flash media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own flash media" ON storage.objects FOR UPDATE USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own flash media" ON storage.objects FOR DELETE USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check if policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('boltz', 'flashes', 'close_friends', 'highlights', 'highlight_stories', 'blocked_users', 'reports')
ORDER BY tablename, policyname;

-- ============================================
-- DONE! ✅
-- ============================================
-- All RLS policies have been added!
-- You should now be able to create boltz, flashes, and use all features.
-- ============================================
