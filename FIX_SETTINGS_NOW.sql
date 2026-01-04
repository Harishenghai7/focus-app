-- URGENT: Run this in Supabase SQL Editor to fix Settings page

-- First, check if user_settings table exists and has data
SELECT * FROM user_settings WHERE user_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6';

-- If the above returns no rows, run this to create default settings:
INSERT INTO user_settings (
    user_id,
    theme,
    font_size,
    glassmorphism_enabled,
    high_contrast_mode,
    account_visibility,
    two_factor_enabled,
    show_activity_status,
    who_can_view_profile,
    who_can_view_posts,
    who_can_view_stories,
    who_can_view_boltz,
    push_notifications,
    email_notifications,
    in_app_notifications,
    notify_likes,
    notify_comments,
    notify_followers,
    notify_mentions,
    notify_messages,
    notify_boltz,
    notify_flash,
    notification_sound,
    quiet_hours_enabled
) VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',
    'dark',
    'medium',
    true,
    false,
    'public',
    false,
    true,
    'everyone',
    'everyone',
    'everyone',
    'everyone',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'default',
    false
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify it was created:
SELECT * FROM user_settings WHERE user_id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6';
