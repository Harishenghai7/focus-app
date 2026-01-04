-- ==========================================
-- FIX STORAGE POLICIES - FINAL VERSION
-- ==========================================
-- The bucket exists but policies are in the wrong place
-- This fixes the storage.objects policies

-- First, drop ALL existing policies on storage.objects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects';
    END LOOP;
END $$;

-- Now create the correct policies on storage.objects

-- ========== POSTS BUCKET ==========
CREATE POLICY "posts_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "posts_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

CREATE POLICY "posts_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts');

CREATE POLICY "posts_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts');

-- ========== BOLTZ BUCKET ==========
CREATE POLICY "boltz_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'boltz');

CREATE POLICY "boltz_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'boltz');

CREATE POLICY "boltz_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'boltz');

-- ========== FLASH BUCKET ==========
CREATE POLICY "flash_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'flash');

CREATE POLICY "flash_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'flash');

CREATE POLICY "flash_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'flash');

-- ========== AVATARS BUCKET ==========
CREATE POLICY "avatars_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ========== MESSAGES BUCKET (PRIVATE) ==========
CREATE POLICY "messages_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'messages');

CREATE POLICY "messages_select_policy"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'messages');

CREATE POLICY "messages_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'messages');

-- ========== THUMBNAILS BUCKET ==========
CREATE POLICY "thumbnails_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');

-- ==========================================
-- ✅ DONE! Storage upload will now work!
-- ==========================================
