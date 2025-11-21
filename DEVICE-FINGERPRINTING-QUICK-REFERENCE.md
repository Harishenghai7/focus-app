# Device Fingerprinting - Quick Reference

## 🚀 Quick Start

### Import
```javascript
import { 
  getDeviceFingerprint, 
  saveDeviceFingerprint,
  checkDeviceLimit,
  updateDeviceLastSeen,
  registerDeviceFingerprint,
  getDeviceInfo,
  clearFingerprintCache
} from '../utils/deviceFingerprinting';
```

### Basic Usage
```javascript
// Complete registration
const result = await registerDeviceFingerprint(userId);
if (!result.error) {
  console.log('Device registered:', result.fingerprint);
}
```

---

## 📌 Common Patterns

### Pattern 1: During Signup
```javascript
async function signup(userId, email, password) {
  // ... create user ...
  
  // Register device
  const { limitCheck, saveResult } = await registerDeviceFingerprint(userId);
  
  if (!saveResult.success) {
    console.warn('Device tracking failed, but account created');
  }
  
  return userId;
}
```

### Pattern 2: Check Before Important Action
```javascript
async function beforeVote(userId) {
  try {
    const fp = await getDeviceFingerprint();
    const check = await checkDeviceLimit(fp.visitorId);
    
    // Log for analysis
    if (check.accountCount >= 2) {
      console.warn(`User ${userId} on device with ${check.accountCount} accounts`);
    }
    
    return true; // Allow action
  } catch (e) {
    console.error(e);
    return true; // Don't block on error
  }
}
```

### Pattern 3: Track Login
```javascript
async function onLogin(userId) {
  const fp = await getDeviceFingerprint();
  await updateDeviceLastSeen(fp.visitorId, userId);
}
```

---

## 🔄 Function Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `getDeviceFingerprint()` | Get/generate fingerprint | `{ visitorId, confidence, components }` |
| `saveDeviceFingerprint(userId, fp, info)` | Save to database | `{ success, data/error }` |
| `checkDeviceLimit(fingerprint)` | Check account limit | `{ allowed, accountCount, limit }` |
| `updateDeviceLastSeen(fp, userId)` | Track activity | `{ success, data/error }` |
| `registerDeviceFingerprint(userId)` | Complete workflow | `{ fingerprint, limitCheck, saveResult }` |
| `getDeviceInfo()` | Get browser/device info | `{ browserName, osName, ... }` |
| `clearFingerprintCache()` | Clear cache | `void` |

---

## ⚙️ Configuration

Modify in `deviceFingerprinting.js`:

```javascript
// Cache duration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Account limit per device
const MAX_ACCOUNTS_PER_DEVICE = 2; // Change to your preference
```

---

## 🗄️ Required Database Table

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

CREATE INDEX idx_device_fingerprints_fingerprint ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_user ON device_fingerprints(user_id);
```

---

## 📊 Error Handling

```javascript
try {
  const result = await registerDeviceFingerprint(userId);
  
  if (result.error) {
    console.warn('Device registration failed:', result.error);
    // Don't block user - fingerprinting is non-critical
    return true;
  }
  
  if (result.limitCheck.reachedLimit) {
    console.log('Device limit reached');
    // Handle accordingly
  }
  
} catch (error) {
  console.error('Unexpected error:', error);
  // Still allow user to proceed
}
```

---

## 🔍 Debugging

```javascript
// Clear cache and regenerate
clearFingerprintCache();
const fp = await getDeviceFingerprint();
console.log('Current fingerprint:', fp.visitorId);

// Check device info
const info = getDeviceInfo();
console.log('Device info:', info);

// Check device limit
const check = await checkDeviceLimit(fp.visitorId);
console.log('Device status:', check);
```

---

## ⚡ Performance Notes

- **First call:** ~200-300ms (loads FingerprintJS library)
- **Cached calls:** <1ms (instant)
- **Cache duration:** 24 hours per session
- **Database operations:** 100-200ms depending on connection

---

## 🎯 What This Prevents

✅ Account farming (creating many accounts)  
✅ Vote/engagement manipulation (same person, multiple accounts)  
✅ Ban evasion (new accounts after being banned)  
✅ Resource abuse (spam, flooding)  
✅ Reward farming (exploiting incentive systems)  

---

## ⚠️ What This Doesn't Prevent

❌ VPN/Proxy users (appear as different devices)  
❌ Shared devices (family/office can't distinguish users)  
❌ Sophisticated adversaries (browser fingerprinting can be spoofed)  

**Use as part of a multi-layer security approach, not alone.**

---

## 📈 Monitoring Queries

```sql
-- Find suspicious devices
SELECT fingerprint_hash, COUNT(DISTINCT user_id) as accounts,
       MAX(last_seen) as last_activity
FROM device_fingerprints
GROUP BY fingerprint_hash
HAVING COUNT(DISTINCT user_id) > 2
ORDER BY accounts DESC;

-- Track user's devices
SELECT * FROM device_fingerprints
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Find recently suspicious activity
SELECT fingerprint_hash, user_id, created_at
FROM device_fingerprints
WHERE created_at > NOW() - INTERVAL '24 hours'
AND is_active = true;
```

---

**Version:** 1.0.0  
**Status:** ✅ Ready  
**Last Updated:** November 20, 2025
