# 🔱 Trust Shield God-Level Deployment Guide

## Overview
This document outlines the deployment steps for the **God-Level Trust Shield Hardening** implementation.

## Architecture Changes

### LAYER 1: Persistent State Machine ✅
- **Problem Fixed**: "Reset to Step 1" bug on navigation
- **Solution**: `verification_step` column in DB + localStorage sync
- **Implementation**: 
  - `getVerificationStep()` - Syncs DB state with localStorage
  - `setVerificationStep()` - Persists to both DB and localStorage
  - `lockVerificationStep()` - Locks user to specific step (e.g., Step 3 Biometrics)
  - `getLockedStep()` - Retrieves locked step from DB

### LAYER 2: 6-Layer Enforcement Engine ✅
1. **Device Fingerprint** (`generateDeviceFingerprint`)
2. **OCR Validation** (`validateOCRAgainstInput`)
3. **ID Quality Check** (`validateIDQuality`) - Blocks files < 50KB
4. **Rate Limiting** (`checkRateLimit`) - 5 attempts/hour per device
5. **Database Uniqueness Check** (`checkIdentityUniqueness`) - One Person = One Account
6. **IP Tracking** (`logVerificationAttempt`) - Logs IP hash on every attempt

### LAYER 3: Atomic Account Creation ✅
- **Implementation**: `finalize_verification()` RPC function
- **Security**: Only RPC can mark account as verified
- **Features**: Duplicate check, device binding, atomic transaction

### LAYER 4: Security Hardening ✅
- **Enhanced ProtectedTrustRoute** with:
  - Real-time verification monitoring
  - Rate limiting enforcement
  - Device fingerprint tracking
  - Hard lock to /onboarding if unverified

### UI: H2 Universal Theme ✅
- 20px glass blur (`backdropFilter: blur(20px)`)
- Satin borders (`rgba(255,255,255,0.1)`)
- 60fps smooth transitions

## Files Modified/Created

### New Files
1. **`src/utils/trustShieldGodEngine.js`** - God-Level engine (6 layers)
2. **`supabase/migrations/050_trust_shield_god_level_schema.sql`** - DB schema

### Modified Files
1. **`src/components/auth/ProtectedTrustRoute.jsx`** - Hardened route guard
2. **`src/pages/verification/TrustShieldVerification.jsx`** - Integrated God-Level engine
3. **`src/App.js`** - Updated routing for hardened flow

## Deployment Steps

### Step 1: Deploy Database Schema
```bash
# Apply the SQL migration to your Supabase project
supabase db push
# OR run via Supabase Dashboard SQL Editor
```

The migration at `supabase/migrations/050_trust_shield_god_level_schema.sql` creates:
- New columns: `verification_step`, `verification_locked`, `device_id`, `identity_hash`, etc.
- Functions: `check_identity_uniqueness()`, `check_suspicious_activity()`, `finalize_verification()`
- Indexes for performance
- RLS policies for security

### Step 2: Deploy Frontend Code
```bash
# Build and deploy
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

### Step 3: Verify Deployment

#### Test Persistent State
1. Start verification, reach Step 3 (Biometrics)
2. Refresh the page
3. Should return to Step 3, NOT Step 1 ✅

#### Test Rate Limiting
1. Attempt verification 5 times rapidly
2. 6th attempt should be blocked with 1-hour cooldown ✅

#### Test ID Quality Check
1. Try uploading a < 50KB image
2. Should be rejected with ERR_FILE_TOO_SMALL ✅

#### Test Duplicate Detection
1. Complete verification with ID
2. Try creating new account with same ID
3. Should be blocked with ERR_DUPLICATE_IDENTITY ✅

#### Test Hard Lock
1. Be unverified, try accessing /home
2. Should redirect to /onboarding ✅

## Error Codes Reference

| Code | Description | Layer |
|------|-------------|-------|
| ERR_DATA_MISMATCH | OCR data doesn't match manual input | 2.2 |
| ERR_FILE_TOO_SMALL | ID image < 50KB | 2.3 |
| ERR_RATE_LIMITED | 5+ attempts in 1 hour | 2.4 |
| ERR_DUPLICATE_IDENTITY | Identity already registered | 2.5 |
| ERR_DEVICE_BLOCKED | Device flagged | 2.1 |
| ERR_IP_BLOCKED | Suspicious IP activity | 2.6 |
| ERR_LIVENESS_FAILED | Biometric incomplete | 3 |

## Monitoring & Logs

Check browser console for:
```
[TrustShield] 🔱 God-Level State Init: { step, lockedStep, source }
[TrustShield] 💾 Step persisted: { success, step }
[TrustShield] 🔒 Step X LOCKED
[TrustShield] ✅ All 6 layers passed
[TrustShield] ✅ Atomic verification complete
```

## Rollback Plan

If issues occur:
1. Revert to previous git commit
2. Run rollback SQL (if provided)
3. Clear `localStorage` keys starting with `trust_shield_`

## Support

Contact: `admin@focusapp.in`
Emergency bypass (dev only): Ctrl+Shift+V on Trust Shield page
