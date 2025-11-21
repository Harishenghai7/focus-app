# Device Fingerprinting System Guide

## 📋 Overview

The device fingerprinting system is an advanced security mechanism designed to prevent:
- **Account farming** - Creating multiple accounts for fraudulent purposes
- **Vote manipulation** - Same person voting multiple times with different accounts
- **Ban evasion** - Creating new accounts after being banned
- **Resource abuse** - One person using multiple accounts to spam or exploit the system

## 🔧 Implementation

### Installation

The `@fingerprintjs/fingerprintjs` library has been installed via npm:

```bash
npm install @fingerprintjs/fingerprintjs
```

### File Location

```
src/utils/deviceFingerprinting.js
```

## 📚 API Reference

### 1. `getDeviceFingerprint()`

Generates or retrieves a cached device fingerprint.

```javascript
import { getDeviceFingerprint } from '../utils/deviceFingerprinting';

const fingerprint = await getDeviceFingerprint();
console.log(fingerprint.visitorId);  // "abc123def456..."
console.log(fingerprint.confidence); // Confidence score object
```

**Features:**
- ✅ Singleton pattern - FingerprintJS library loaded only once
- ✅ Dual-layer caching - Memory cache + sessionStorage (24-hour duration)
- ✅ Returns: `{ visitorId, confidence, components }`

---

### 2. `saveDeviceFingerprint(userId, fingerprint, deviceInfo)`

Saves or updates device fingerprint data in Supabase.

```javascript
import { getDeviceFingerprint, saveDeviceFingerprint, getDeviceInfo } from '../utils/deviceFingerprinting';

const fingerprint = await getDeviceFingerprint();
const deviceInfo = getDeviceInfo();

const result = await saveDeviceFingerprint(userId, fingerprint, deviceInfo);

if (result.success) {
  console.log('Device saved:', result.data);
} else {
  console.error('Failed to save:', result.error);
}
```

**Stored Data:**
- `fingerprint_hash` - Unique device identifier
- `visitor_id` - FingerprintJS visitor ID
- `user_id` - Associated user ID
- `confidence_score` - Fingerprint reliability score
- `browser_name` - Browser type (Chrome, Firefox, etc.)
- `os_name` - Operating system
- `device_type` - "desktop" or "mobile"
- `screen_resolution` - Screen dimensions
- `timezone` - User's timezone
- `last_seen` - Last access timestamp
- `usage_count` - Number of times device was used

**Returns:**
```javascript
{
  success: true,
  data: { /* device record */ }
}
// OR
{
  success: false,
  error: "Error message"
}
```

---

### 3. `checkDeviceLimit(fingerprint)`

Checks if a device has reached the account creation limit.

```javascript
import { checkDeviceLimit } from '../utils/deviceFingerprinting';

const check = await checkDeviceLimit(fingerprint.visitorId);

if (!check.allowed) {
  console.log(`Device has ${check.accountCount} accounts. Limit: ${check.limit}`);
  // Prevent account creation
} else {
  console.log('Device can create another account');
  // Allow account creation
}
```

**Configuration:**
- Default limit: **2 accounts per device**
- Configurable via `MAX_ACCOUNTS_PER_DEVICE` constant

**Returns:**
```javascript
{
  allowed: true,              // Can create another account
  accountCount: 1,            // Current accounts on device
  limit: 2,                   // Maximum allowed
  reachedLimit: false         // Has limit been exceeded?
}
```

---

### 4. `updateDeviceLastSeen(fingerprint, userId)`

Updates the last access timestamp and increments usage counter.

```javascript
import { updateDeviceLastSeen } from '../utils/deviceFingerprinting';

const result = await updateDeviceLastSeen(fingerprint.visitorId, userId);

if (result.success) {
  console.log('Device updated:', result.data);
}
```

**Updates:**
- `last_seen` - Current timestamp
- `usage_count` - Incremented by 1

---

### 5. `getDeviceInfo()`

Extracts device information from browser APIs.

```javascript
import { getDeviceInfo } from '../utils/deviceFingerprinting';

const info = getDeviceInfo();
// Returns:
// {
//   browserName: "Chrome",
//   osName: "Windows",
//   deviceType: "desktop",
//   screenResolution: "1920x1080",
//   timezone: "America/New_York"
// }
```

---

### 6. `clearFingerprintCache()`

Clears cached fingerprint data (for testing or after browser data is cleared).

```javascript
import { clearFingerprintCache } from '../utils/deviceFingerprinting';

clearFingerprintCache();
```

---

### 7. `registerDeviceFingerprint(userId)` (Complete Workflow)

Complete device registration workflow - combines all steps.

```javascript
import { registerDeviceFingerprint } from '../utils/deviceFingerprinting';

const result = await registerDeviceFingerprint(userId);

if (result.error) {
  console.error('Registration failed:', result.error);
} else {
  console.log('Fingerprint:', result.fingerprint);
  console.log('Limit check:', result.limitCheck);
  console.log('Saved:', result.saveResult);
}
```

**Process:**
1. Generates device fingerprint
2. Checks account limit
3. Retrieves device info
4. Saves fingerprint to database
5. Updates last_seen timestamp

---

## 🗄️ Database Schema

Required Supabase table: `device_fingerprints`

```sql
CREATE TABLE device_fingerprints (
  id BIGSERIAL PRIMARY KEY,
  fingerprint_hash TEXT NOT NULL,
  visitor_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  confidence_score FLOAT,
  browser_name TEXT,
  os_name TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  last_seen TIMESTAMP,
  usage_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(fingerprint_hash, user_id)
);

CREATE INDEX idx_device_fingerprints_fingerprint 
ON device_fingerprints(fingerprint_hash);

CREATE INDEX idx_device_fingerprints_user 
ON device_fingerprints(user_id);

CREATE INDEX idx_device_fingerprints_last_seen 
ON device_fingerprints(last_seen);
```

---

## 💡 Usage Examples

### Example 1: During User Registration

```javascript
import { registerDeviceFingerprint, checkDeviceLimit } from '../utils/deviceFingerprinting';

async function handleUserSignup(userId) {
  try {
    // Register device
    const registration = await registerDeviceFingerprint(userId);
    
    if (registration.error) {
      throw new Error(registration.error);
    }

    // Check if device has hit limit
    if (registration.limitCheck.reachedLimit) {
      console.warn(`Device has reached limit (${registration.limitCheck.accountCount}/${registration.limitCheck.limit} accounts)`);
      // Optional: Allow but warn user, or block registration
    }

    console.log('✅ Device registered successfully');
    return true;

  } catch (error) {
    console.error('❌ Registration failed:', error);
    return false;
  }
}
```

### Example 2: During Login

```javascript
import { getDeviceFingerprint, updateDeviceLastSeen } from '../utils/deviceFingerprinting';

async function handleUserLogin(userId) {
  try {
    const fingerprint = await getDeviceFingerprint();
    
    // Update device activity
    await updateDeviceLastSeen(fingerprint.visitorId, userId);
    
    console.log('✅ Login recorded on device');

  } catch (error) {
    console.error('Failed to record device:', error);
    // Don't block login, just log the error
  }
}
```

### Example 3: Before Action (Voting, Posting, etc.)

```javascript
import { getDeviceFingerprint, checkDeviceLimit } from '../utils/deviceFingerprinting';

async function canUserPerformAction(userId) {
  try {
    const fingerprint = await getDeviceFingerprint();
    const check = await checkDeviceLimit(fingerprint.visitorId);

    if (check.error) {
      console.warn('Could not verify device:', check.error);
      // Continue anyway - don't block action
      return true;
    }

    if (check.reachedLimit) {
      // Log suspicion but allow - depends on your policy
      console.warn('Device reached account limit');
      // You can add additional checks here
    }

    return true;

  } catch (error) {
    console.error('Device check failed:', error);
    return true; // Don't block user
  }
}
```

---

## 🔒 Security Considerations

### How It Prevents Fraud

1. **Account Farming Prevention**
   - Device can only create 2 accounts (configurable)
   - New accounts detected immediately
   - Reduces profit incentive for mass account creation

2. **Vote Manipulation Prevention**
   - System tracks device usage per account
   - Suspicious patterns can be detected
   - Same device voting multiple times is logged

3. **Ban Evasion Prevention**
   - Banned user's device is marked in system
   - If they create new account on same device, flag it
   - Can require email verification, phone verification, etc.

### Limitations

- **VPN/Proxy Usage**: Users on VPN may appear as different devices
- **Shared Devices**: Family/office computers can't distinguish users
- **Device Changes**: Browser cache clear will generate new fingerprint
- **Privacy**: Some browsers block fingerprinting (Safari ITP, Firefox ETP)

### Best Practices

```javascript
// ✅ DO: Use device fingerprinting as part of multi-factor approach
async function isAccountSuspicious(userId, newAccount = false) {
  const fingerprint = await getDeviceFingerprint();
  const limit = await checkDeviceLimit(fingerprint.visitorId);
  
  let suspicionScore = 0;
  
  if (limit.accountCount >= 2) suspicionScore += 3;
  if (newAccount) suspicionScore += 2;
  
  // Also check:
  // - Email domain (hotmail.com, gmail.com counts differently)
  // - Phone verification status
  // - Account age
  // - Behavioral patterns
  
  return suspicionScore >= 5;
}

// ❌ DON'T: Blindly block users based on fingerprint alone
// Always allow some false positives for user experience
// Use fingerprinting for logging and analysis, not strict blocking
```

---

## 📊 Monitoring & Analytics

### Queries to Track Device Activity

```sql
-- Find devices with suspicious account counts
SELECT fingerprint_hash, COUNT(DISTINCT user_id) as account_count, MAX(last_seen)
FROM device_fingerprints
GROUP BY fingerprint_hash
HAVING COUNT(DISTINCT user_id) > 2
ORDER BY account_count DESC;

-- Find most active devices
SELECT fingerprint_hash, device_type, browser_name, 
       COUNT(*) as usage_count, MAX(last_seen) as last_seen
FROM device_fingerprints
GROUP BY fingerprint_hash, device_type, browser_name
ORDER BY usage_count DESC
LIMIT 20;

-- Find recently created accounts on same device
SELECT f1.fingerprint_hash, f1.user_id, f1.created_at,
       f2.user_id as other_user, f2.created_at as other_created
FROM device_fingerprints f1
JOIN device_fingerprints f2 
  ON f1.fingerprint_hash = f2.fingerprint_hash 
  AND f1.user_id < f2.user_id
WHERE f1.created_at > NOW() - INTERVAL '7 days'
ORDER BY f1.created_at DESC;
```

---

## 🧪 Testing

### Unit Test Example

```javascript
import { getDeviceFingerprint, checkDeviceLimit, clearFingerprintCache } from '../utils/deviceFingerprinting';

describe('Device Fingerprinting', () => {
  beforeEach(() => {
    clearFingerprintCache();
  });

  it('should cache fingerprint', async () => {
    const fp1 = await getDeviceFingerprint();
    const fp2 = await getDeviceFingerprint();
    
    expect(fp1.visitorId).toBe(fp2.visitorId);
  });

  it('should check device limit', async () => {
    const check = await checkDeviceLimit('test-fingerprint');
    
    expect(check).toHaveProperty('allowed');
    expect(check).toHaveProperty('accountCount');
    expect(check).toHaveProperty('limit');
  });
});
```

---

## 🚀 Future Enhancements

- [ ] Behavioral analysis (typing speed, mouse movement patterns)
- [ ] Machine learning for fraud detection
- [ ] Integration with Sentry for anomaly detection
- [ ] Geo-location verification
- [ ] IP reputation scoring
- [ ] Device model detection
- [ ] Browser extension detection
- [ ] WebGL fingerprinting
- [ ] Canvas fingerprinting
- [ ] Font detection

---

## 📖 Related Documentation

- [Authentication Security Implementation](./AUTHENTICATION-SECURITY-IMPLEMENTATION.md)
- [Rate Limiting Guide](./RATEIMINIG-GUIDE.md)
- [Security Best Practices](./SECURITY-BEST-PRACTICES.md)

---

## ❓ FAQ

**Q: Will this block legitimate users?**  
A: No, fingerprinting is used for logging and analysis, not strict blocking. Family members can still use the same device.

**Q: What about privacy concerns?**  
A: FingerprintJS uses only public browser APIs. No personal data is collected. Users can clear browser data to reset their fingerprint.

**Q: Can users bypass device fingerprinting?**  
A: Yes - VPNs, browser settings changes, incognito mode, etc. Use it as part of a multi-layer security approach.

**Q: How often is the fingerprint regenerated?**  
A: Cached for 24 hours per session. Browser data clear resets it immediately.

**Q: What's the performance impact?**  
A: Minimal. First load takes ~200ms, subsequent calls use cache (instant).

---

**Created:** November 20, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete and Ready for Integration
