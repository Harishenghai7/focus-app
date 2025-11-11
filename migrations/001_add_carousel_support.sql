-- Migration: Add Multi-Image Carousel Support to Posts
-- Date: 2025-11-07
-- Description: Adds support for multiple media items per post (carousel functionality)

-- Add new columns to posts table for carousel support
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_types TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_carousel BOOLEAN DEFAULT false;

-- Create index for carousel posts for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_is_carousel ON posts(is_carousel) WHERE is_carousel = true;

-- Add comment for documentation
COMMENT ON COLUMN posts.media_urls IS 'Array of media URLs for carousel posts (up to 10 items)';
COMMENT ON COLUMN posts.media_types IS 'Array of media types corresponding to media_urls (image or video)';
COMMENT ON COLUMN posts.is_carousel IS 'Flag indicating if post is a carousel (multiple media items)';

-- Backward compatibility: Existing posts remain unchanged
-- Legacy fields (image_url, media_url, media_type) continue to work
-- New carousel posts will use media_urls and media_types arrays

-- Validation function to ensure arrays are same length
CREATE OR REPLACE FUNCTION validate_carousel_arrays()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_carousel = true THEN
    -- Ensure media_urls and media_types exist and have same length
    IF NEW.media_urls IS NULL OR NEW.media_types IS NULL THEN
      RAISE EXCEPTION 'Carousel posts must have both media_urls and media_types';
    END IF;
    
    IF array_length(NEW.media_urls, 1) != array_length(NEW.media_types, 1) THEN
      RAISE EXCEPTION 'media_urls and media_types must have the same length';
    END IF;
    
    -- Ensure at least 2 items for carousel (otherwise it's a single post)
    IF array_length(NEW.media_urls, 1) < 2 THEN
      RAISE EXCEPTION 'Carousel posts must have at least 2 media items';
    END IF;
    
    -- Ensure no more than 10 items
    IF array_length(NEW.media_urls, 1) > 10 THEN
      RAISE EXCEPTION 'Carousel posts cannot have more than 10 media items';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_carousel_trigger ON posts;
CREATE TRIGGER validate_carousel_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_carousel_arrays();

-- Grant necessary permissions (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO authenticated;

-- Test queries to verify migration
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'posts' 
-- AND column_name IN ('media_urls', 'media_types', 'is_carousel');
