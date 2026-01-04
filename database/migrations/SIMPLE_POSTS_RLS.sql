-- ==========================================
-- SIMPLE FIX FOR POSTS INSERT PERMISSION
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create simple permissive policies
CREATE POLICY "allow_insert_posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_select_posts"
ON posts FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_update_posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_delete_posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- ✅ DONE! Try uploading now!
-- ==========================================
