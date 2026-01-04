-- ==========================================
-- COMPLETE STORAGE SETUP FOR FOCUS APP
-- ==========================================
-- This will drop ALL existing storage policies and buckets, then recreate them

-- ==========================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ==========================================

-- Drop all policies on storage.objects table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- ==========================================
-- STEP 2: DROP ALL EXISTING BUCKETS AND FILES
-- ==========================================

-- Delete all objects first
DELETE FROM storage.objects WHERE bucket_id IN ('flash', 'thumbnails', 'messages', 'boltz', 'posts', 'avatars', 'dm-videos', 'dm-photos');

-- Delete all buckets
DELETE FROM storage.buckets WHERE id IN ('flash', 'thumbnails', 'messages', 'boltz', 'posts', 'avatars', 'dm-videos', 'dm-photos');

-- ==========================================
-- STEP 3: CREATE BUCKETS
-- ==========================================

-- Posts bucket (for regular posts - images and videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posts',
    'posts',
    true,
    104857600, -- 100MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Boltz bucket (for short videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'boltz',
    'boltz',
    true,
    104857600, -- 100MB limit
    ARRAY['video/mp4', 'video/quicktime', 'video/webm']
);

-- Flash/Stories bucket (for 24-hour stories)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'flash',
    'flash',
    true,
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
);

-- Avatars bucket (for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Messages bucket (for DM attachments - general)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'messages',
    'messages',
    false, -- Private bucket
    26214400, -- 25MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf', 'audio/mpeg', 'audio/wav']
);

-- Thumbnails bucket (for generated thumbnails)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'thumbnails',
    'thumbnails',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- ==========================================
-- STEP 4: CREATE STORAGE POLICIES
-- ==========================================

-- ========== POSTS BUCKET POLICIES ==========

CREATE POLICY "Users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view posts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own posts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'posts' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== BOLTZ BUCKET POLICIES ==========

CREATE POLICY "Users can upload boltz"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'boltz' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view boltz"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'boltz');

CREATE POLICY "Users can update their own boltz"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'boltz' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own boltz"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'boltz' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== FLASH BUCKET POLICIES ==========

CREATE POLICY "Users can upload flash stories"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'flash' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view flash stories"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'flash');

CREATE POLICY "Users can delete their own flash stories"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'flash' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== AVATARS BUCKET POLICIES ==========

CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== MESSAGES BUCKET POLICIES (PRIVATE) ==========

CREATE POLICY "Users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'messages' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'messages' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'messages' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- ========== THUMBNAILS BUCKET POLICIES ==========

CREATE POLICY "System can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "System can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- ==========================================
-- ✅ DONE! Storage buckets are now set up
-- ==========================================
-- You now have 6 buckets with proper policies:
-- 1. posts (100MB, public)
-- 2. boltz (100MB, public)
-- 3. flash (50MB, public)
-- 4. avatars (5MB, public)
-- 5. messages (25MB, private)
-- 6. thumbnails (2MB, public)
-- ==========================================
