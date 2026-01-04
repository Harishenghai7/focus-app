-- ═══════════════════════════════════════════════════════════════════════
-- CREATE TEST USERS FOR NEW MESSAGE SEARCH
-- Run this if DIAGNOSTIC_PROFILES.sql shows "Total profiles: 0"
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Create 20 diverse test users for testing search functionality
INSERT INTO profiles (id, username, full_name, avatar_url, bio, created_at)
VALUES
  -- Tech enthusiasts
  (gen_random_uuid(), 'techguru', 'Alex Thompson', 'https://i.pravatar.cc/150?img=1', 'Software engineer | Tech enthusiast', NOW()),
  (gen_random_uuid(), 'codewizard', 'Sarah Chen', 'https://i.pravatar.cc/150?img=5', 'Full-stack developer', NOW()),
  (gen_random_uuid(), 'devmaster', 'Mike Johnson', 'https://i.pravatar.cc/150?img=12', 'Building cool stuff', NOW()),
  
  -- Creative professionals
  (gen_random_uuid(), 'designpro', 'Emma Wilson', 'https://i.pravatar.cc/150?img=9', 'UI/UX Designer', NOW()),
  (gen_random_uuid(), 'artlover', 'David Kim', 'https://i.pravatar.cc/150?img=15', 'Digital artist', NOW()),
  (gen_random_uuid(), 'photographer', 'Lisa Martinez', 'https://i.pravatar.cc/150?img=20', 'Capturing moments', NOW()),
  
  -- Business professionals
  (gen_random_uuid(), 'entrepreneur', 'James Brown', 'https://i.pravatar.cc/150?img=33', 'Startup founder', NOW()),
  (gen_random_uuid(), 'marketing_pro', 'Rachel Green', 'https://i.pravatar.cc/150?img=24', 'Marketing strategist', NOW()),
  (gen_random_uuid(), 'bizdev', 'Tom Anderson', 'https://i.pravatar.cc/150?img=31', 'Business development', NOW()),
  
  -- Content creators
  (gen_random_uuid(), 'vlogger', 'Jessica Lee', 'https://i.pravatar.cc/150?img=27', 'Content creator | Vlogger', NOW()),
  (gen_random_uuid(), 'podcaster', 'Chris Evans', 'https://i.pravatar.cc/150?img=18', 'Podcast host', NOW()),
  (gen_random_uuid(), 'writer', 'Amanda Clark', 'https://i.pravatar.cc/150?img=23', 'Writer & storyteller', NOW()),
  
  -- Fitness & wellness
  (gen_random_uuid(), 'fitnessguru', 'Ryan Cooper', 'https://i.pravatar.cc/150?img=14', 'Personal trainer', NOW()),
  (gen_random_uuid(), 'yogainstructor', 'Maya Patel', 'https://i.pravatar.cc/150?img=26', 'Yoga & mindfulness', NOW()),
  
  -- Students & educators
  (gen_random_uuid(), 'student_life', 'Kevin Zhang', 'https://i.pravatar.cc/150?img=11', 'CS student | Learning everyday', NOW()),
  (gen_random_uuid(), 'professor', 'Dr. Helen White', 'https://i.pravatar.cc/150?img=22', 'University professor', NOW()),
  
  -- Travelers & adventurers
  (gen_random_uuid(), 'travelbug', 'Sophie Turner', 'https://i.pravatar.cc/150?img=28', 'Travel enthusiast', NOW()),
  (gen_random_uuid(), 'adventurer', 'Jake Miller', 'https://i.pravatar.cc/150?img=17', 'Adventure seeker', NOW()),
  
  -- Foodies
  (gen_random_uuid(), 'foodie', 'Maria Garcia', 'https://i.pravatar.cc/150?img=25', 'Food blogger', NOW()),
  (gen_random_uuid(), 'chef', 'Gordon Smith', 'https://i.pravatar.cc/150?img=32', 'Professional chef', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verify insertion
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ TEST USERS CREATED SUCCESSFULLY!';
    RAISE NOTICE '════════════════════════════════════════════════════════';
    RAISE NOTICE 'Total profiles in database: %', profile_count;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  1. Refresh your app';
    RAISE NOTICE '  2. Click "New Message"';
    RAISE NOTICE '  3. Search for users like:';
    RAISE NOTICE '     - "tech" → techguru, codewizard';
    RAISE NOTICE '     - "design" → designpro';
    RAISE NOTICE '     - "food" → foodie, chef';
    RAISE NOTICE '════════════════════════════════════════════════════════';
END $$;
