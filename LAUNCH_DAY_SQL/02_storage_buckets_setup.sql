-- ═══════════════════════════════════════════════════════════════════════
-- FOCUS APP LAUNCH - STEP 2: CREATE STORAGE BUCKETS
-- Run this to ensure all storage buckets exist with correct policies
-- ═══════════════════════════════════════════════════════════════════════

-- Create all required storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
    ('avatars', 'avatars', true, 5242880),       -- 5MB limit for avatars
    ('posts', 'posts', true, 10485760),           -- 10MB limit for posts
    ('boltz', 'boltz', true, 52428800),           -- 50MB limit for boltz videos
    ('flash', 'flash', true, 10485760),           -- 10MB limit for flash
    ('messages', 'messages', true, 10485760),     -- 10MB limit for messages
    ('message-media', 'message-media', true, 10485760)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Drop existing policies to avoid conflicts (safe to run multiple times)
DO $$
DECLARE
    bucket_names TEXT[] := ARRAY['avatars', 'posts', 'boltz', 'flash', 'messages', 'message-media'];
    bucket_name TEXT;
BEGIN
    FOREACH bucket_name IN ARRAY bucket_names LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_upload" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_read" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON storage.objects', bucket_name);
        EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON storage.objects', bucket_name);
    END LOOP;
END $$;

-- Create storage policies for each bucket
-- AVATARS BUCKET
CREATE POLICY "avatars_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- POSTS BUCKET
CREATE POLICY "posts_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts');

CREATE POLICY "posts_read" ON storage.objects
FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "posts_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- BOLTZ BUCKET
CREATE POLICY "boltz_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'boltz');

CREATE POLICY "boltz_read" ON storage.objects
FOR SELECT USING (bucket_id = 'boltz');

CREATE POLICY "boltz_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'boltz' AND auth.uid()::text = (storage.foldername(name))[1]);

-- FLASH BUCKET
CREATE POLICY "flash_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'flash');

CREATE POLICY "flash_read" ON storage.objects
FOR SELECT USING (bucket_id = 'flash');

CREATE POLICY "flash_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'flash' AND auth.uid()::text = (storage.foldername(name))[1]);

-- MESSAGES BUCKET
CREATE POLICY "messages_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'messages');

CREATE POLICY "messages_read" ON storage.objects
FOR SELECT USING (bucket_id = 'messages');

CREATE POLICY "messages_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'messages' AND auth.uid()::text = (storage.foldername(name))[1]);

-- MESSAGE-MEDIA BUCKET
CREATE POLICY "message-media_upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message-media');

CREATE POLICY "message-media_read" ON storage.objects
FOR SELECT USING (bucket_id = 'message-media');

CREATE POLICY "message-media_delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'message-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify buckets created
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;
