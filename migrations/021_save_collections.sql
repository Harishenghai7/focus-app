-- Migration: Save Collections System
-- Description: Add support for organizing saved posts into collections

-- Create saved_collections table
CREATE TABLE IF NOT EXISTS saved_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_private BOOLEAN DEFAULT false,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create collection_items table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES saved_collections(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'boltz')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, content_id, content_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_collections_user_id ON saved_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_content ON collection_items(content_id, content_type);

-- Function to update collection post count
CREATE OR REPLACE FUNCTION update_collection_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE saved_collections 
    SET post_count = post_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE saved_collections 
    SET post_count = GREATEST(post_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.collection_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for collection post count
DROP TRIGGER IF EXISTS trigger_update_collection_post_count ON collection_items;
CREATE TRIGGER trigger_update_collection_post_count
  AFTER INSERT OR DELETE ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_post_count();

-- Function to auto-update cover image when first item is added
CREATE OR REPLACE FUNCTION update_collection_cover_image()
RETURNS TRIGGER AS $$
DECLARE
  current_cover TEXT;
  post_image TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get current cover image
    SELECT cover_image_url INTO current_cover
    FROM saved_collections
    WHERE id = NEW.collection_id;
    
    -- If no cover image, use the first post's image
    IF current_cover IS NULL THEN
      IF NEW.content_type = 'post' THEN
        SELECT COALESCE(image_url, media_urls[1]) INTO post_image
        FROM posts
        WHERE id = NEW.content_id;
      ELSIF NEW.content_type = 'boltz' THEN
        SELECT thumbnail_url INTO post_image
        FROM boltz
        WHERE id = NEW.content_id;
      END IF;
      
      IF post_image IS NOT NULL THEN
        UPDATE saved_collections
        SET cover_image_url = post_image
        WHERE id = NEW.collection_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto cover image
DROP TRIGGER IF EXISTS trigger_update_collection_cover_image ON collection_items;
CREATE TRIGGER trigger_update_collection_cover_image
  AFTER INSERT ON collection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_cover_image();

-- Enable RLS on saved_collections
ALTER TABLE saved_collections ENABLE ROW LEVEL SECURITY;

-- Enable RLS on collection_items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_collections
CREATE POLICY "Users can view their own collections"
  ON saved_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
  ON saved_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON saved_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON saved_collections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for collection_items
CREATE POLICY "Users can view items in their collections"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_collections
      WHERE saved_collections.id = collection_items.collection_id
      AND saved_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their collections"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_collections
      WHERE saved_collections.id = collection_items.collection_id
      AND saved_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their collections"
  ON collection_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM saved_collections
      WHERE saved_collections.id = collection_items.collection_id
      AND saved_collections.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON saved_collections TO authenticated;
GRANT ALL ON saved_collections TO service_role;
GRANT ALL ON collection_items TO authenticated;
GRANT ALL ON collection_items TO service_role;

-- Create default "All Saved" collection for existing users
INSERT INTO saved_collections (user_id, name, description, is_private)
SELECT id, 'All Saved', 'All your saved posts', true
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM saved_collections
  WHERE saved_collections.user_id = profiles.id
  AND saved_collections.name = 'All Saved'
);
