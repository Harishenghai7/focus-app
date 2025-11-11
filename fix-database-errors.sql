-- Fix database schema issues

-- Add missing columns to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Fix likes table structure
ALTER TABLE likes DROP CONSTRAINT IF EXISTS likes_post_id_user_id_key;
ALTER TABLE likes ADD CONSTRAINT likes_unique_post_user UNIQUE (post_id, user_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE likes ADD CONSTRAINT likes_unique_boltz_user UNIQUE (boltz_id, user_id) DEFERRABLE INITIALLY DEFERRED;