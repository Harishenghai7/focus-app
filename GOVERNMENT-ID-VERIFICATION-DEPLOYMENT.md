# Government ID + Face Verification System - Deployment Guide

## 🚀 Quick Start

This guide will help you deploy the Government ID verification system to your Focus app.

## ✅ Prerequisites

- [ ] Supabase project set up
- [ ] Node.js and npm installed
- [ ] Face-api.js models downloaded
- [ ] DigiLocker partnership application submitted (or sandbox credentials)

---

## 📋 Step-by-Step Deployment

### 1. Database Migration

Run the database migration to create required tables:

```bash
# Navigate to your project
cd c:\Users\history_creator_2007\focus-app

# Apply the migration (if using Supabase CLI)
supabase db push

# OR manually run the SQL file in Supabase Dashboard → SQL Editor
# File: supabase/migrations/20251204_government_id_verification.sql
```

**Verify tables created:**
- `user_devices`
- `verification_logs`
- `parent_verifications`
- New columns in `profiles` table
- "Verified Human" badge in `badge_definitions`

---

### 2. Download Face-API.js Models

Download the required models and place them in `public/models/`:

```bash
# Create models directory
mkdir public\models

# Download models from: https://github.com/justadudewhohacks/face-api.js-models
# Required files:
# - tiny_face_detector_model-weights_manifest.json
# - tiny_face_detector_model-shard1
# - face_landmark_68_model-weights_manifest.json
# - face_landmark_68_model-shard1
# - face_recognition_model-weights_manifest.json
# - face_recognition_model-shard1
# - face_recognition_model-shard2
```

**Quick download script** (PowerShell):
```powershell
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"
$models = @(
    "tiny_face_detector",
    "face_landmark_68",
    "face_recognition"
)

foreach ($model in $models) {
    Invoke-WebRequest -Uri "$baseUrl/$model/$model`_model-weights_manifest.json" -OutFile "public\models\$model`_model-weights_manifest.json"
    # Download shard files as well
}
```

---

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# DigiLocker API
REACT_APP_DIGILOCKER_CLIENT_ID=your_client_id_here
REACT_APP_DIGILOCKER_REDIRECT_URI=http://localhost:3000/auth/digilocker/callback
```

**For production**, update to your domain:
```env
REACT_APP_DIGILOCKER_REDIRECT_URI=https://yourapp.com/auth/digilocker/callback
```

---

### 4. Configure Supabase Edge Functions

Set environment variables in **Supabase Dashboard → Edge Functions → Settings**:

```
DIGILOCKER_CLIENT_ID=your_client_id_here
DIGILOCKER_SECRET=your_client_secret_here
DIGILOCKER_REDIRECT_URI=https://yourapp.com/auth/digilocker/callback
APP_BASE_URL=https://yourapp.com
```

---

### 5. Deploy Edge Functions

```bash
# Deploy all three Edge Functions
supabase functions deploy digilocker-verify
supabase functions deploy verify-face-match
supabase functions deploy send-parent-consent-email

# Verify deployment
supabase functions list
```

---

### 6. Apply for DigiLocker Partnership

**For Development (Sandbox)**:
1. Visit: https://www.digilocker.gov.in/web/partners/requesters
2. Select "Sandbox" environment
3. Fill in application details
4. Receive sandbox credentials within 24-48 hours

**For Production**:
1. Same application portal
2. Select "Production" environment
3. Provide business details and use case
4. Wait 7-14 business days for approval
5. Receive production credentials

**Required Information**:
- Organization name
- Website URL
- Use case description
- Redirect URI (callback URL)
- Contact details

---

### 7. Test the System

#### Test DigiLocker OAuth Flow:
1. Navigate to `/verification-center`
2. Click "Government ID Verification"
3. Select "18 or above"
4. Click "Continue to DigiLocker"
5. Verify redirect to DigiLocker portal

#### Test Face Detection:
1. Complete DigiLocker verification
2. Allow camera access
3. Position face in frame
4. Blink once
5. Verify selfie capture

#### Test Face Matching:
1. Wait for automatic face matching
2. Verify confidence score ≥95%
3. Check badge awarded
4. Verify Trust Score increased by +50

#### Test Parent Consent (Teen Flow):
1. Select "13-17 years" age group
2. Enter parent email
3. Verify email sent
4. Check parent verification link

---

## 🔒 Security Checklist

- [ ] RLS policies enabled on all new tables
- [ ] Edge Functions use service role key (not anon key)
- [ ] CORS headers configured correctly
- [ ] Rate limiting active (5 attempts per 24 hours)
- [ ] Device fingerprint uniqueness enforced
- [ ] Face match confidence threshold set to 95%
- [ ] DigiLocker state parameter validated (CSRF protection)
- [ ] Parent consent tokens expire after 7 days

---

## 📊 Monitoring

### Key Metrics to Track:

1. **Verification Success Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
   FROM verification_logs
   WHERE verification_type = 'face_match'
   AND created_at >= NOW() - INTERVAL '7 days';
   ```

2. **Average Face Match Confidence**
   ```sql
   SELECT AVG(face_match_confidence) as avg_confidence
   FROM profiles
   WHERE face_verified = true;
   ```

3. **Device Fingerprint Collisions**
   ```sql
   SELECT device_fingerprint, COUNT(*) as count
   FROM user_devices
   WHERE is_active = true
   GROUP BY device_fingerprint
   HAVING COUNT(*) > 1;
   ```

4. **Verification Attempts by Type**
   ```sql
   SELECT verification_type, status, COUNT(*) as count
   FROM verification_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY verification_type, status
   ORDER BY count DESC;
   ```

---

## 🐛 Troubleshooting

### Issue: Face detection models not loading

**Solution:**
- Verify models are in `public/models/` directory
- Check browser console for CORS errors
- Ensure model files are served correctly (not 404)
- Clear browser cache

### Issue: DigiLocker redirect fails

**Solution:**
- Verify redirect URI matches exactly in DigiLocker dashboard
- Check state parameter is being stored and validated
- Ensure client ID is correct
- Check browser console for errors

### Issue: Face match confidence too low

**Solution:**
- Ensure good lighting conditions
- Ask user to remove glasses/hat
- Verify DigiLocker photo quality
- Check camera resolution

### Issue: Device fingerprint already used

**Solution:**
- This is expected behavior (prevents multi-account abuse)
- User must use a different device
- Or contact support to reset verification

### Issue: Parent consent email not received

**Solution:**
- Check spam folder
- Verify email address is correct
- Check Supabase Auth email settings
- Consider using external email service (SendGrid/Mailgun)

---

## 📝 Next Steps

After successful deployment:

1. **Test with real users** (beta testers)
2. **Monitor error logs** in Supabase Dashboard
3. **Collect user feedback** on verification flow
4. **Optimize face detection** parameters if needed
5. **Set up email service** for parent consent (if using external provider)
6. **Create user documentation** and FAQ
7. **Train support team** on verification process

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Database migration applied without errors
- ✅ Face-api.js models load in browser
- ✅ DigiLocker OAuth flow completes successfully
- ✅ Face liveness detection works (blink detection)
- ✅ Face matching achieves ≥95% confidence
- ✅ "Verified Human" badge awarded
- ✅ Trust Score increases by +50
- ✅ Device fingerprint prevents multi-account abuse
- ✅ Parent consent email sent successfully
- ✅ No console errors during verification flow

---

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Review Supabase Edge Function logs
3. Verify environment variables are set correctly
4. Test with DigiLocker sandbox credentials first
5. Refer to implementation plan for detailed architecture

---

**Deployment Date**: December 4, 2024
**Version**: 1.0.0
**Status**: Ready for Testing
