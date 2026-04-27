-- ═══════════════════════════════════════════════════════════════════════════════
-- 🧹 TRUST SHIELD RESET - Clear ALL verification data for fresh testing
-- ═══════════════════════════════════════════════════════════════════════════════

-- ⚠️ WARNING: This will reset ALL user verifications. Use with caution!

-- 1. Reset all profiles - clear verification status and identity hashes
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

-- 2. Clear verification audit trail
TRUNCATE TABLE verification_audit_trail;

-- 3. Clear trust shield audit (if exists)
-- TRUNCATE TABLE trust_shield_audit;

-- 4. Clear rate limiting data (if stored in any table)
-- (Usually this is transient data, no action needed)

-- 5. Verify reset worked
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN verification_status = 'VERIFIED' THEN 1 END) as verified_count,
    COUNT(CASE WHEN identity_hash IS NOT NULL THEN 1 END) as with_identity_hash
FROM profiles;

-- Result should show:
-- total_users = N (your user count)
-- verified_count = 0
-- with_identity_hash = 0

-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ RESET COMPLETE - All users are now unverified and can re-verify
-- Each Aadhaar/PAN will now be enforced as ONE ID = ONE ACCOUNT
-- ═══════════════════════════════════════════════════════════════════════════════
