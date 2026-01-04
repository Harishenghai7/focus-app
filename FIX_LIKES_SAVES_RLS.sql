-- BULLETPROOF RLS FIX - Safe to run multiple times
-- This script will work even if policies already exist

-- ============================================================================
-- POST_LIKES TABLE
-- ============================================================================

DO $$ 
BEGIN
    -- Drop all existing policies (ignore errors if they don't exist)
    DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
    DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;
    DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON post_likes;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON post_likes;
    DROP POLICY IF EXISTS "Enable read access for all users" ON post_likes;
    DROP POLICY IF EXISTS "Anyone can view likes" ON post_likes;
    DROP POLICY IF EXISTS "Authenticated users can like posts" ON post_likes;
    DROP POLICY IF EXISTS "Users can unlike their own likes" ON post_likes;
    
    -- Create new policies
    EXECUTE 'CREATE POLICY "Anyone can view likes" ON post_likes FOR SELECT USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can unlike their own likes" ON post_likes FOR DELETE USING (auth.uid() = user_id)';
    
    RAISE NOTICE 'post_likes policies updated successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating post_likes policies: %', SQLERRM;
END $$;

-- ============================================================================
-- SAVED_POSTS TABLE
-- ============================================================================

DO $$ 
BEGIN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "Users can save posts" ON saved_posts;
    DROP POLICY IF EXISTS "Users can unsave posts" ON saved_posts;
    DROP POLICY IF EXISTS "Users can view their saved posts" ON saved_posts;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON saved_posts;
    DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON saved_posts;
    DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON saved_posts;
    DROP POLICY IF EXISTS "Users can view their own saved posts" ON saved_posts;
    DROP POLICY IF EXISTS "Authenticated users can save posts" ON saved_posts;
    DROP POLICY IF EXISTS "Users can unsave their own posts" ON saved_posts;
    
    -- Create new policies
    EXECUTE 'CREATE POLICY "Users can view their own saved posts" ON saved_posts FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Authenticated users can save posts" ON saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can unsave their own posts" ON saved_posts FOR DELETE USING (auth.uid() = user_id)';
    
    RAISE NOTICE 'saved_posts policies updated successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating saved_posts policies: %', SQLERRM;
END $$;

-- ============================================================================
-- BOLTZ_LIKES TABLE (if exists)
-- ============================================================================

DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'boltz_likes') THEN
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Users can like boltz" ON boltz_likes;
        DROP POLICY IF EXISTS "Users can unlike boltz" ON boltz_likes;
        DROP POLICY IF EXISTS "Users can view all boltz likes" ON boltz_likes;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON boltz_likes;
        DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON boltz_likes;
        DROP POLICY IF EXISTS "Enable read access for all users" ON boltz_likes;
        DROP POLICY IF EXISTS "Anyone can view boltz likes" ON boltz_likes;
        DROP POLICY IF EXISTS "Authenticated users can like boltz" ON boltz_likes;
        DROP POLICY IF EXISTS "Users can unlike their own boltz likes" ON boltz_likes;
        
        -- Create new policies
        EXECUTE 'CREATE POLICY "Anyone can view boltz likes" ON boltz_likes FOR SELECT USING (true)';
        EXECUTE 'CREATE POLICY "Authenticated users can like boltz" ON boltz_likes FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can unlike their own boltz likes" ON boltz_likes FOR DELETE USING (auth.uid() = user_id)';
        
        RAISE NOTICE 'boltz_likes policies updated successfully';
    ELSE
        RAISE NOTICE 'boltz_likes table does not exist, skipping';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating boltz_likes policies: %', SQLERRM;
END $$;

-- ============================================================================
-- SAVED_BOLTZ TABLE (if exists)
-- ============================================================================

DO $$ 
BEGIN
    -- Check if table exists first
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_boltz') THEN
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Users can save boltz" ON saved_boltz;
        DROP POLICY IF EXISTS "Users can unsave boltz" ON saved_boltz;
        DROP POLICY IF EXISTS "Users can view their saved boltz" ON saved_boltz;
        DROP POLICY IF EXISTS "Enable insert for authenticated users" ON saved_boltz;
        DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON saved_boltz;
        DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON saved_boltz;
        DROP POLICY IF EXISTS "Users can view their own saved boltz" ON saved_boltz;
        DROP POLICY IF EXISTS "Authenticated users can save boltz" ON saved_boltz;
        DROP POLICY IF EXISTS "Users can unsave their own boltz" ON saved_boltz;
        
        -- Create new policies
        EXECUTE 'CREATE POLICY "Users can view their own saved boltz" ON saved_boltz FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Authenticated users can save boltz" ON saved_boltz FOR INSERT WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Users can unsave their own boltz" ON saved_boltz FOR DELETE USING (auth.uid() = user_id)';
        
        RAISE NOTICE 'saved_boltz policies updated successfully';
    ELSE
        RAISE NOTICE 'saved_boltz table does not exist, skipping';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating saved_boltz policies: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE ''
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE ''
    END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('post_likes', 'saved_posts', 'boltz_likes', 'saved_boltz')
ORDER BY tablename, cmd, policyname;
