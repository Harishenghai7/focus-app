-- ═══════════════════════════════════════════════════════════════════════════════
-- ☢️ NUCLEAR OPTION: Delete ALL user data including auth accounts
-- ⚠️ EXTREME WARNING: This will DELETE everything - irreversible!
-- ═══════════════════════════════════════════════════════════════════════════════

-- === OPTION 1: SOFT RESET (Recommended for testing) ===
-- Just clears verification data, keeps user accounts

-- Reset all profiles
UPDATE profiles 
SET 
    verification_status = 'PENDING',
    trust_shield_status = 'PENDING',
    focus_trust_status = 'PENDING',
    identity_hash = NULL,
    device_id = NULL,
    device_fingerprint = NULL,
    verification_step = 0,
    onboarding_completed = FALSE,
    can_post = FALSE,
    verified_at = NULL,
    verification_metadata = NULL,
    updated_at = NOW();

-- Clear audit tables
TRUNCATE TABLE verification_audit_trail;

-- === OPTION 2: HARD RESET (Delete auth users too) ===
-- Uncomment below to delete actual user accounts
-- WARNING: This breaks foreign keys! Use only on fresh installs.

-- DELETE FROM auth.users WHERE email NOT LIKE '%admin%';  -- Keep admins
-- DELETE FROM profiles;

-- === VERIFICATION QUERY ===
SELECT 
    'Users' as check_type,
    COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
    'Verified Users', 
    COUNT(*) 
FROM profiles 
WHERE verification_status = 'VERIFIED'
UNION ALL
SELECT 
    'With Identity Hash', 
    COUNT(*) 
FROM profiles 
WHERE identity_hash IS NOT NULL
UNION ALL
SELECT 
    'Audit Records', 
    COUNT(*) 
FROM verification_audit_trail;

-- Expected after reset:
-- Users = N (total)
-- Verified Users = 0
-- With Identity Hash = 0
-- Audit Records = 0

-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor, then test verification fresh
-- ═══════════════════════════════════════════════════════════════════════════════
