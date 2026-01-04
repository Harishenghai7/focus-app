-- Create RPC function to update post caption (bypasses RLS)
-- Run this in Supabase SQL Editor

-- Drop function if it exists
DROP FUNCTION IF EXISTS update_post_caption(uuid, text);

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION update_post_caption(
    post_id uuid,
    new_caption text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- This runs with the privileges of the function owner, bypassing RLS
AS $$
DECLARE
    result json;
BEGIN
    -- Check if the user owns this post
    IF NOT EXISTS (
        SELECT 1 FROM posts 
        WHERE id = post_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to edit this post';
    END IF;

    -- Update the caption
    UPDATE posts
    SET caption = new_caption,
        updated_at = NOW()
    WHERE id = post_id
    AND user_id = auth.uid();

    -- Return success
    SELECT json_build_object(
        'success', true,
        'post_id', post_id,
        'caption', new_caption
    ) INTO result;

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_post_caption(uuid, text) TO authenticated;

-- Test the function (replace with your actual post ID)
-- SELECT update_post_caption('your-post-id-here', 'Test caption');
