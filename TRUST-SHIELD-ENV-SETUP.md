# 🔧 Trust Shield Environment Setup

## Required Environment Variables

Add these to your `.env` file:

```env
# hCaptcha Configuration
# Get your site key from: https://www.hcaptcha.com/
REACT_APP_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001

# For development, the above test key works
# For production, replace with your actual hCaptcha site key
```

## Getting Your hCaptcha Site Key

### 1. Sign Up for hCaptcha
Visit: https://www.hcaptcha.com/

### 2. Create a New Site
- Dashboard → New Site
- Enter your domain (e.g., `focus-app.com`)
- For development: Add `localhost`

### 3. Copy Site Key
- Copy the "Sitekey" from your dashboard
- Paste into `.env` file

### 4. Test Mode
For development/testing, you can use the test key:
```
10000000-ffff-ffff-ffff-000000000001
```
This always passes (for testing UI only).

## Alternative: FriendlyCaptcha

If you prefer FriendlyCaptcha (privacy-focused):

```env
REACT_APP_FRIENDLY_CAPTCHA_SITE_KEY=your_friendly_captcha_key
```

Visit: https://friendlycaptcha.com/

## Verification in Backend

For production, you'll need to verify the CAPTCHA token server-side:

### hCaptcha Verification
```javascript
// In your API endpoint
const response = await fetch('https://hcaptcha.com/siteverify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${captchaToken}`
});

const data = await response.json();
if (data.success) {
  // CAPTCHA verified
}
```

### Required Backend Env Var
```env
HCAPTCHA_SECRET_KEY=your_secret_key_from_dashboard
```

## IP Intelligence Services (Optional)

For enhanced IP detection, consider these services:

### IPQualityScore (Recommended)
```env
IPQUALITYSCORE_API_KEY=your_api_key
```
Visit: https://www.ipqualityscore.com/

### ipdata.co
```env
IPDATA_API_KEY=your_api_key
```
Visit: https://ipdata.co/

### IP-API (Free tier available)
No key needed for basic usage.

## Current Setup (No Keys Required)

The Trust Shield currently works with:
- ✅ Device fingerprinting (client-side)
- ✅ Basic IP detection (free services)
- ✅ Email analysis (pattern-based)
- ✅ Behavioral analysis (database-driven)
- ✅ Social graph analysis (database-driven)

## Production Recommendations

For production, add these services:
1. **hCaptcha** - Human verification ($0/month for up to 1M requests)
2. **IPQualityScore** - Advanced fraud detection ($25/month)
3. **SendGrid/Twilio** - Email/SMS verification ($15/month)

## Testing Without Keys

You can test the full flow without any API keys:
- hCaptcha test key always passes
- IP detection uses free fallbacks
- All other features work database-only

## Environment File Example

Create `.env` in project root:

```env
# Supabase (Already configured)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key

# hCaptcha (Add this)
REACT_APP_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001

# Optional: IP Intelligence
IPQUALITYSCORE_API_KEY=

# Optional: Email Verification
SENDGRID_API_KEY=

# Optional: SMS Verification
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## Restart Development Server

After adding environment variables:

```bash
# Stop the server (Ctrl+C)
# Restart
npm start
```

Environment variables are loaded on server start.

## Troubleshooting

### hCaptcha Not Loading
- Check site key in `.env`
- Verify `REACT_APP_` prefix
- Restart dev server
- Check browser console for errors

### CAPTCHA Always Failing
- Using production key in development?
- Add `localhost` to allowed domains in hCaptcha dashboard
- Check secret key configuration (backend)

### Can't Test Without Keys
- Use provided test keys
- All features work in "mock mode"
- Database operations still function

---

**Ready to go!** 🚀

Start the app and test the Trust Shield onboarding flow.
