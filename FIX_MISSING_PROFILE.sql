-- FIX MISSING PROFILE
-- Run this in Supabase SQL Editor to create your missing profile

-- Replace with your actual user ID from the console log
-- The log shows: 7bf2ce9c-5c9f-408b-bf97-462de4583ac6

INSERT INTO profiles (
    id,
    username,
    full_name,
    bio,
    avatar_url,
    onboarding_completed,
    created_at,
    updated_at
)
VALUES (
    '7bf2ce9c-5c9f-408b-bf97-462de4583ac6',  -- Your user ID
    'history_creator_2007',                    -- Username from email
    'Hariharun Muthukumaran',                 -- Your full name
    '',                                        -- Empty bio
    'https://lh3.googleusercontent.com/a/ACg8ocJqQxYyour-google-avatar-url',  -- Replace with your Google avatar URL if you have it
    false,                                     -- Not completed onboarding
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();

-- Verify it was created
SELECT * FROM profiles WHERE id = '7bf2ce9c-5c9f-408b-bf97-462de4583ac6';
