-- Migration: Accessibility Features
-- Date: 2025-11-07
-- Description: Add alt text and accessibility fields

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS alt_text TEXT;

ALTER TABLE flashes
ADD COLUMN IF NOT EXISTS alt_text TEXT;

ALTER TABLE boltz
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Add accessibility preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accessibility_preferences JSONB DEFAULT '{
  "high_contrast": false,
  "reduce_motion": false,
  "screen_reader": false,
  "font_size": "medium"
}'::jsonb;

COMMENT ON COLUMN posts.alt_text IS 'Alternative text description for images';
COMMENT ON COLUMN flashes.alt_text IS 'Alternative text description for story media';
COMMENT ON COLUMN boltz.alt_text IS 'Alternative text description for video content';
COMMENT ON COLUMN profiles.accessibility_preferences IS 'User accessibility settings';
