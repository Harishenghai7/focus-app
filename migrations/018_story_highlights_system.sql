-- Migration: Story Highlights System
-- This migration ensures the highlights system is fully functional

-- 1. Ensure highlights table exists
CREATE TABLE IF NOT EXISTS highlights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure highlight_stories junction table exists
CREATE TABLE IF NOT EXISTS highlight_stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  highlight_id UUID REFERENCES highlights(id) ON DELETE CASCADE NOT NULL,
  flash_id UUID REFERENCES flash(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, flash_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_highlight_id ON highlight_stories(highlight_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_flash_id ON highlight_stories(flash_id);
CREATE INDEX IF NOT EXISTS idx_highlight_stories_position ON highlight_stories(highlight_id, position);

-- 4. Enable RLS
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_stories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for highlights
DROP POLICY IF EXISTS "Users can view highlights" ON highlights;
CREATE POLICY "Users can view highlights" ON highlights
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = highlights.user_id
        AND (
          profiles.is_private = false OR
          EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid()
              AND following_id = highlights.user_id
              AND status = 'active'
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create highlights" ON highlights;
CREATE POLICY "Users can create highlights" ON highlights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own highlights" ON highlights;
CREATE POLICY "Users can update own highlights" ON highlights
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own highlights" ON highlights;
CREATE POLICY "Users can delete own highlights" ON highlights
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. RLS Policies for highlight_stories
DROP POLICY IF EXISTS "Users can view highlight stories" ON highlight_stories;
CREATE POLICY "Users can view highlight stories" ON highlight_stories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM highlights
      WHERE highlights.id = highlight_stories.highlight_id
        AND (
          highlights.user_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = highlights.user_id
              AND (
                profiles.is_private = false OR
                EXISTS (
                  SELECT 1 FROM follows
                  WHERE follower_id = auth.uid()
                    AND following_id = highlights.user_id
                    AND status = 'active'
                )
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can add stories to own highlights" ON highlight_stories;
CREATE POLICY "Users can add stories to own highlights" ON highlight_stories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM highlights
      WHERE highlights.id = highlight_stories.highlight_id
        AND highlights.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove stories from own highlights" ON highlight_stories;
CREATE POLICY "Users can remove stories from own highlights" ON highlight_stories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM highlights
      WHERE highlights.id = highlight_stories.highlight_id
        AND highlights.user_id = auth.uid()
    )
  );

-- 7. Create function to create highlight with stories
CREATE OR REPLACE FUNCTION create_highlight_with_stories(
  highlight_title TEXT,
  highlight_cover_url TEXT,
  flash_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
  new_highlight_id UUID;
  flash_id UUID;
  position_counter INTEGER := 0;
  result JSON;
BEGIN
  -- Create the highlight
  INSERT INTO highlights (user_id, title, cover_url)
  VALUES (auth.uid(), highlight_title, highlight_cover_url)
  RETURNING id INTO new_highlight_id;

  -- Add stories to highlight
  FOREACH flash_id IN ARRAY flash_ids
  LOOP
    INSERT INTO highlight_stories (highlight_id, flash_id, position)
    VALUES (new_highlight_id, flash_id, position_counter)
    ON CONFLICT (highlight_id, flash_id) DO NOTHING;
    
    position_counter := position_counter + 1;
  END LOOP;

  -- Build result
  result := json_build_object(
    'success', true,
    'highlight_id', new_highlight_id,
    'stories_added', position_counter,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to add stories to existing highlight
CREATE OR REPLACE FUNCTION add_stories_to_highlight(
  highlight_uuid UUID,
  flash_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
  flash_id UUID;
  max_position INTEGER;
  position_counter INTEGER;
  stories_added INTEGER := 0;
  result JSON;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM highlights
    WHERE id = highlight_uuid AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Highlight not found or access denied'
    );
  END IF;

  -- Get current max position
  SELECT COALESCE(MAX(position), -1) INTO max_position
  FROM highlight_stories
  WHERE highlight_id = highlight_uuid;

  position_counter := max_position + 1;

  -- Add stories
  FOREACH flash_id IN ARRAY flash_ids
  LOOP
    INSERT INTO highlight_stories (highlight_id, flash_id, position)
    VALUES (highlight_uuid, flash_id, position_counter)
    ON CONFLICT (highlight_id, flash_id) DO NOTHING;
    
    GET DIAGNOSTICS stories_added = ROW_COUNT;
    IF stories_added > 0 THEN
      position_counter := position_counter + 1;
    END IF;
  END LOOP;

  result := json_build_object(
    'success', true,
    'stories_added', position_counter - max_position - 1,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to remove story from highlight
CREATE OR REPLACE FUNCTION remove_story_from_highlight(
  highlight_uuid UUID,
  flash_uuid UUID
)
RETURNS JSON AS $$
DECLARE
  deleted_count INTEGER;
  result JSON;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM highlights
    WHERE id = highlight_uuid AND user_id = auth.uid()
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Highlight not found or access denied'
    );
  END IF;

  -- Delete the story
  DELETE FROM highlight_stories
  WHERE highlight_id = highlight_uuid AND flash_id = flash_uuid;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Reorder remaining stories
  UPDATE highlight_stories
  SET position = subquery.new_position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 as new_position
    FROM highlight_stories
    WHERE highlight_id = highlight_uuid
  ) AS subquery
  WHERE highlight_stories.id = subquery.id;

  result := json_build_object(
    'success', true,
    'deleted', deleted_count > 0,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get highlight with stories
CREATE OR REPLACE FUNCTION get_highlight_with_stories(highlight_uuid UUID)
RETURNS JSON AS $$
DECLARE
  highlight_data JSON;
  stories_data JSON;
  result JSON;
BEGIN
  -- Get highlight info
  SELECT json_build_object(
    'id', h.id,
    'user_id', h.user_id,
    'title', h.title,
    'cover_url', h.cover_url,
    'created_at', h.created_at,
    'username', p.username,
    'avatar_url', p.avatar_url
  ) INTO highlight_data
  FROM highlights h
  JOIN profiles p ON h.user_id = p.id
  WHERE h.id = highlight_uuid;

  -- Get stories
  SELECT json_agg(
    json_build_object(
      'id', f.id,
      'media_url', f.media_url,
      'media_type', f.media_type,
      'caption', f.caption,
      'created_at', f.created_at,
      'position', hs.position
    ) ORDER BY hs.position
  ) INTO stories_data
  FROM highlight_stories hs
  JOIN flash f ON hs.flash_id = f.id
  WHERE hs.highlight_id = highlight_uuid;

  -- Build result
  result := json_build_object(
    'highlight', highlight_data,
    'stories', COALESCE(stories_data, '[]'::json)
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get user's highlights
CREATE OR REPLACE FUNCTION get_user_highlights(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  cover_url TEXT,
  story_count BIGINT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id,
    h.title,
    h.cover_url,
    COUNT(hs.id) as story_count,
    h.created_at
  FROM highlights h
  LEFT JOIN highlight_stories hs ON h.id = hs.highlight_id
  WHERE h.user_id = user_uuid
  GROUP BY h.id, h.title, h.cover_url, h.created_at
  ORDER BY h.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to update highlight updated_at
CREATE OR REPLACE FUNCTION update_highlight_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE highlights
  SET updated_at = NOW()
  WHERE id = NEW.highlight_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_highlight_timestamp ON highlight_stories;
CREATE TRIGGER trigger_update_highlight_timestamp
  AFTER INSERT OR DELETE ON highlight_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_highlight_timestamp();

-- 13. Create view for highlights with story count
CREATE OR REPLACE VIEW highlights_with_counts AS
SELECT 
  h.id,
  h.user_id,
  h.title,
  h.cover_url,
  h.created_at,
  h.updated_at,
  COUNT(hs.id) as story_count,
  p.username,
  p.avatar_url,
  p.is_verified
FROM highlights h
LEFT JOIN highlight_stories hs ON h.id = hs.highlight_id
JOIN profiles p ON h.user_id = p.id
GROUP BY h.id, h.user_id, h.title, h.cover_url, h.created_at, h.updated_at,
         p.username, p.avatar_url, p.is_verified;

-- 14. Grant permissions
GRANT EXECUTE ON FUNCTION create_highlight_with_stories(TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION add_stories_to_highlight(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_story_from_highlight(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_highlight_with_stories(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_highlights(UUID) TO authenticated;
GRANT SELECT ON highlights_with_counts TO authenticated;

-- 15. Add comments
COMMENT ON TABLE highlights IS 
  'Stores permanent collections of flash stories (highlights)';

COMMENT ON TABLE highlight_stories IS 
  'Junction table linking highlights to flash stories with ordering';

COMMENT ON FUNCTION create_highlight_with_stories(TEXT, TEXT, UUID[]) IS 
  'Creates a new highlight and adds the specified flash stories to it';

COMMENT ON FUNCTION add_stories_to_highlight(UUID, UUID[]) IS 
  'Adds flash stories to an existing highlight';

COMMENT ON FUNCTION remove_story_from_highlight(UUID, UUID) IS 
  'Removes a flash story from a highlight and reorders remaining stories';

COMMENT ON FUNCTION get_highlight_with_stories(UUID) IS 
  'Returns a highlight with all its stories in order';

COMMENT ON FUNCTION get_user_highlights(UUID) IS 
  'Returns all highlights for a user with story counts';
