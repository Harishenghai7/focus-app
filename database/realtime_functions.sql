-- ============================================
-- Realtime Functions for Focus App
-- Atomic operations for likes, comments, saves
-- ============================================

-- ============================================
-- POST LIKES
-- ============================================

CREATE OR REPLACE FUNCTION increment_post_like(p_post_id UUID, p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Insert like (ignore if already exists)
    INSERT INTO post_likes (post_id, user_id, created_at)
    VALUES (p_post_id, p_user_id, NOW())
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    -- Update post likes count
    UPDATE posts 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = p_post_id
      AND NOT EXISTS (
          SELECT 1 FROM post_likes 
          WHERE post_id = p_post_id 
            AND user_id = p_user_id 
            AND created_at < NOW() - INTERVAL '1 second'
      );
    
    -- Return updated counts
    SELECT json_build_object(
        'likes_count', likes_count,
        'is_liked', true
    ) INTO v_result
    FROM posts
    WHERE id = p_post_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_like(p_post_id UUID, p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Delete like
    DELETE FROM post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id;
    
    -- Update post likes count
    UPDATE posts 
    SET likes_count = GREATEST(0, likes_count - 1),
        updated_at = NOW()
    WHERE id = p_post_id;
    
    -- Return updated counts
    SELECT json_build_object(
        'likes_count', likes_count,
        'is_liked', false
    ) INTO v_result
    FROM posts
    WHERE id = p_post_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POST SAVES
-- ============================================

CREATE OR REPLACE FUNCTION toggle_post_save(p_post_id UUID, p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_exists boolean;
    v_result json;
BEGIN
    -- Check if already saved
    SELECT EXISTS(
        SELECT 1 FROM saved_posts 
        WHERE post_id = p_post_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- Remove save
        DELETE FROM saved_posts
        WHERE post_id = p_post_id AND user_id = p_user_id;
        
        UPDATE posts 
        SET saves_count = GREATEST(0, saves_count - 1),
            updated_at = NOW()
        WHERE id = p_post_id;
    ELSE
        -- Add save
        INSERT INTO saved_posts (post_id, user_id, created_at)
        VALUES (p_post_id, p_user_id, NOW());
        
        UPDATE posts 
        SET saves_count = saves_count + 1,
            updated_at = NOW()
        WHERE id = p_post_id;
    END IF;
    
    -- Return updated counts
    SELECT json_build_object(
        'saves_count', saves_count,
        'is_saved', NOT v_exists
    ) INTO v_result
    FROM posts
    WHERE id = p_post_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- BOLTZ LIKES
-- ============================================

CREATE OR REPLACE FUNCTION increment_boltz_like(p_boltz_id UUID, p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Insert like
    INSERT INTO boltz_likes (boltz_id, user_id, created_at)
    VALUES (p_boltz_id, p_user_id, NOW())
    ON CONFLICT (boltz_id, user_id) DO NOTHING;
    
    -- Update boltz likes count
    UPDATE boltz 
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = p_boltz_id;
    
    -- Return updated counts
    SELECT json_build_object(
        'likes_count', likes_count,
        'is_liked', true
    ) INTO v_result
    FROM boltz
    WHERE id = p_boltz_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_boltz_like(p_boltz_id UUID, p_user_id UUID)
RETURNS json AS $$
DECLARE
    v_result json;
BEGIN
    -- Delete like
    DELETE FROM boltz_likes
    WHERE boltz_id = p_boltz_id AND user_id = p_user_id;
    
    -- Update boltz likes count
    UPDATE boltz 
    SET likes_count = GREATEST(0, likes_count - 1),
        updated_at = NOW()
    WHERE id = p_boltz_id;
    
    -- Return updated counts
    SELECT json_build_object(
        'likes_count', likes_count,
        'is_liked', false
    ) INTO v_result
    FROM boltz
    WHERE id = p_boltz_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENT INCREMENT (called by trigger)
-- ============================================

CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'post_comments' THEN
        UPDATE posts 
        SET comments_count = comments_count + 1,
            updated_at = NOW()
        WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'boltz_comments' THEN
        UPDATE boltz 
        SET comments_count = comments_count + 1,
            updated_at = NOW()
        WHERE id = NEW.boltz_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'post_comments' THEN
        UPDATE posts 
        SET comments_count = GREATEST(0, comments_count - 1),
            updated_at = NOW()
        WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'boltz_comments' THEN
        UPDATE boltz 
        SET comments_count = GREATEST(0, comments_count - 1),
            updated_at = NOW()
        WHERE id = OLD.boltz_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment counts
DROP TRIGGER IF EXISTS post_comment_insert_trigger ON post_comments;
CREATE TRIGGER post_comment_insert_trigger
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS post_comment_delete_trigger ON post_comments;
CREATE TRIGGER post_comment_delete_trigger
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_count();

DROP TRIGGER IF EXISTS boltz_comment_insert_trigger ON boltz_comments;
CREATE TRIGGER boltz_comment_insert_trigger
AFTER INSERT ON boltz_comments
FOR EACH ROW
EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS boltz_comment_delete_trigger ON boltz_comments;
CREATE TRIGGER boltz_comment_delete_trigger
AFTER DELETE ON boltz_comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_count();
