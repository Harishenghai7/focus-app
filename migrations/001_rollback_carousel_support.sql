-- Rollback Migration: Remove Multi-Image Carousel Support
-- Date: 2025-11-07
-- Description: Rolls back carousel functionality changes to posts table

-- Drop trigger first
DROP TRIGGER IF EXISTS validate_carousel_trigger ON posts;

-- Drop validation function
DROP FUNCTION IF EXISTS validate_carousel_arrays();

-- Drop index
DROP INDEX IF EXISTS idx_posts_is_carousel;

-- Remove columns (this will not affect existing data in other columns)
ALTER TABLE posts 
DROP COLUMN IF EXISTS media_urls,
DROP COLUMN IF EXISTS media_types,
DROP COLUMN IF EXISTS is_carousel;

-- Note: This rollback is safe and will not affect existing posts
-- Legacy fields (image_url, media_url, media_type) remain intact
