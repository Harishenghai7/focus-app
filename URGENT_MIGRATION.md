# URGENT: Database Migration Required

## Problem
The `user_settings` table is missing required fields, causing Settings page to be non-functional.

## Solution
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS in_app_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_boltz BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_flash BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_followers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME,
ADD COLUMN IF NOT EXISTS show_activity_status BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS account_visibility VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS who_can_view_profile VARCHAR(20) DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS who_can_view_posts VARCHAR(20) DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS who_can_view_stories VARCHAR(20) DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS who_can_view_boltz VARCHAR(20) DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS font_size VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS high_contrast_mode BOOLEAN DEFAULT false;
```

## After Running Migration
Settings page will work immediately - no code changes needed!
