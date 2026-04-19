-- ═══════════════════════════════════════════════════════════════════════
-- USER PREFERENCES (HIDE + INTEREST SIGNALS)
-- Migration: 20260124_user_preferences.sql
-- Description: Store per-user content preferences for feed tuning
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_posts UUID[] DEFAULT ARRAY[]::UUID[],
  hidden_boltz UUID[] DEFAULT ARRAY[]::UUID[],
  interested_boltz UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_hidden_posts
  ON user_preferences USING GIN (hidden_posts);

CREATE INDEX IF NOT EXISTS idx_user_preferences_hidden_boltz
  ON user_preferences USING GIN (hidden_boltz);

CREATE INDEX IF NOT EXISTS idx_user_preferences_interested_boltz
  ON user_preferences USING GIN (interested_boltz);
