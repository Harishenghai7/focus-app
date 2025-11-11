-- ============================================
-- FIX ONBOARDING FLAG FOR EXISTING USERS
-- ============================================
-- Run this in Supabase SQL Editor if onboarding keeps appearing
-- ============================================

-- Update all existing profiles to mark onboarding as completed
UPDATE profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Verify the update
SELECT id, username, email, onboarding_completed 
FROM profiles;

-- ============================================
-- DONE! ✅
-- ============================================
-- All profiles now have onboarding_completed = true
-- Refresh your app and onboarding won't appear anymore
-- ============================================
