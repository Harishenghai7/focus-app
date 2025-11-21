# Onboarding Wizard - Quick Reference Guide

## 🎯 Overview
A beautiful 5-step wizard that verifies users and ensures platform safety.

## 📱 User Flow

### Step 1: Welcome (STEPS.WELCOME)
```
🎯 Focus Logo Animation
"Meet real people, not fake profiles"
"Verified Profiles - Making the safest social media platform possible"
[Get Started Button] →
```

### Step 2: OAuth Selection (STEPS.OAUTH)
```
Choose sign-in method:
┌─────────────────────────┐
│ [G] Continue with Google │
├─────────────────────────┤
│ [f] Continue with Facebook│
├─────────────────────────┤
│ [✉] Continue with Email │
│   ├─ Email input        │
│   ├─ Password input     │
│   └─ [Continue] button  │
└─────────────────────────┘
```

### Step 3: Phone Verification (STEPS.PHONE)
```
🔒 Security Icon
"We verify every user for your safety"
"One profile per number - No fake accounts"

Part A: Enter Phone
┌──────────┬───────────────┐
│ [+1 🇺🇸] │ [1234567890]  │
└──────────┴───────────────┘
[Send Verification Code] →

Part B: Enter OTP
┌─────────────────────────┐
│   [ 0 0 0 0 0 0 ]       │
└─────────────────────────┘
[Verify Code] →
```

### Step 4: Profile Setup (STEPS.PROFILE)
```
"Your data, your control - We value your privacy"

┌─────────────────────────┐
│    [📷 Upload Photo]     │
│                         │
│ Username: [______]  ✓   │
│ Bio: [____________]     │
│      [____________]     │
│      [____________]     │
│      150/150 chars      │
│                         │
│  [Complete Setup] →     │
└─────────────────────────┘
```

### Step 5: Welcome (STEPS.COMPLETE)
```
✅ Big Green Checkmark
🎉 CONFETTI ANIMATION 🎉
"You're Verified! ✓"
"Start exploring real connections"

[Welcome message panel]
[Go to Home Button]
"Redirecting in 5 seconds..."
```

## 🔧 Developer Reference

### Component Props
```javascript
// No props needed - fully self-contained
<Onboarding />
```

### State Variables
```javascript
currentStep          // 1-5 (STEPS enum)
loading             // boolean
error               // string
authMethod          // '', 'email'
email, password     // strings
countryCode         // '+1', '+44', etc.
phoneNumber         // string (digits only)
otp                 // string (6 digits)
otpSent             // boolean
username            // string (a-z0-9_)
usernameAvailable   // true/false/null
bio                 // string (max 150)
profilePicture      // File object
showConfetti        // boolean
```

### Key Functions
```javascript
checkAuth()                  // Check existing session
handleGoogleSignIn()         // OAuth: Google
handleFacebookSignIn()       // OAuth: Facebook
handleEmailSignUp()          // Email/password signup
handleSendOTP()              // Generate & send OTP
handleVerifyOTP()            // Validate OTP
handleProfilePictureChange() // Upload image
handleCompleteProfile()      // Final submission
handleNext()                 // Navigate forward
handleBack()                 // Navigate backward
canProceed()                 // Validate current step
```

### Database Operations
```javascript
// Read: Check onboarding status
supabase.from('profiles').select('phone_verified, username')

// Read: Check username availability
supabase.from('profiles').select('username').eq('username', ...)

// Read: Check phone number exists
supabase.from('profiles').select('id').eq('phone_number', ...)

// Update: Phone verification
supabase.from('profiles').update({
  phone_number,
  phone_verified: true
})

// Update: Complete profile
supabase.from('profiles').update({
  username,
  bio,
  profile_picture_url,
  onboarding_completed: true
})

// Storage: Upload profile picture
supabase.storage.from('avatars').upload(filePath, file)
```

### Validation Rules
```javascript
// Email/Password
- Email: required, valid format
- Password: min 6 characters

// Phone
- Phone number: min 10 digits
- Country code: required
- OTP: exactly 6 digits

// Profile
- Username: min 3 chars, only [a-z0-9_], must be unique
- Bio: max 150 chars, optional
- Picture: max 5MB, optional
```

## 🎨 Styling Reference

### Colors
```css
Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
Button Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Success: #4caf50
Error: #f44336
Google: #DB4437
Facebook: #4267B2
```

### Key Styles
- Glass card: `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(20px)`
- Border radius: `16px` (4 * theme spacing)
- Button padding: `py: 2` (16px vertical)
- Progress bar height: `6px`

## 🚀 Integration Steps

1. **Install Dependencies**
```powershell
npm install react-confetti
# framer-motion and @mui/* already installed
```

2. **Add Route**
```javascript
import Onboarding from './pages/Onboarding';

<Route path="/onboarding" element={<Onboarding />} />
```

3. **Redirect Logic**
```javascript
// In App.js or auth context
if (!user.phone_verified || !user.username) {
  navigate('/onboarding');
}
```

4. **Database Schema**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

5. **Storage Bucket**
```javascript
// Create 'avatars' bucket in Supabase
// Enable public access
// Create 'profile-pictures' folder
```

## 🧪 Testing Commands

### Development OTP
```javascript
// OTP is logged to console
console.log('OTP sent:', generatedOTP);
// Check browser console for the code
```

### Test User Flow
1. Go to `/onboarding`
2. Click "Get Started"
3. Choose auth method
4. Enter phone: `1234567890`
5. Check console for OTP
6. Enter OTP from console
7. Create username: `testuser123`
8. (Optional) Upload picture
9. (Optional) Add bio
10. Click "Complete Setup"
11. See confetti! 🎉

## 📊 Progress Tracking

### Visual Indicators
- **Linear Progress Bar**: Shows percentage (0-100%)
- **Step Counter**: "Step X of 5"
- **Back Button**: Only on steps 2-5

### Navigation Rules
```javascript
Step 1 → Step 2: Always allowed
Step 2 → Step 3: After auth (email signup or OAuth)
Step 3 → Step 4: After phone verification
Step 4 → Step 5: After username set
Step 5 → Home: Manual or auto (5s)
```

## 🎬 Animations

### Framer Motion
```javascript
// Page transitions
initial={{ opacity: 0, x: 50 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -50 }}

// Logo animation
initial={{ scale: 0 }}
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 260, damping: 20 }}
```

### Confetti
```javascript
<Confetti
  width={window.innerWidth}
  height={window.innerHeight}
  recycle={false}
  numberOfPieces={500}
/>
```

## ⚠️ Important Notes

1. **OTP Development Mode**: OTP is logged to console. In production, integrate SMS service (Twilio).

2. **OAuth Redirect**: Set redirect URLs in Google/Facebook console:
   - `http://localhost:3000/onboarding` (dev)
   - `https://yourdomain.com/onboarding` (prod)

3. **Storage Permissions**: Ensure Supabase storage bucket allows:
   - Public read access
   - Authenticated write access

4. **Phone Uniqueness**: One phone = one account enforced

5. **Session Cleanup**: OTP removed from session storage after verification

## 🐛 Troubleshooting

### Issue: OAuth not working
- Check Supabase OAuth settings
- Verify redirect URLs match
- Check browser console for errors

### Issue: Username always "taken"
- Check database connection
- Verify profiles table has username column
- Check RLS policies allow reads

### Issue: Image upload fails
- Check file size (< 5MB)
- Verify 'avatars' bucket exists
- Check storage policies

### Issue: OTP not showing
- Check browser console
- Verify session storage enabled
- Check for JavaScript errors

## 📞 Support

For issues or questions:
1. Check ONBOARDING-WIZARD-COMPLETE.md
2. Review browser console errors
3. Check Supabase logs
4. Verify database schema

---

**Happy Onboarding! 🎯✨**
