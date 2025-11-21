# 🛡️ useTrustShield Hook - Quick Reference

**Location:** `src/hooks/useTrustShield.js`

## 📥 Import

```jsx
import useTrustShield from '../hooks/useTrustShield';
// OR with context
import { TrustShieldProvider, useTrustShieldContext } from '../hooks/useTrustShield';
```

---

## 🎯 Basic Usage

```jsx
function MyComponent() {
  const {
    trustScore,           // 0-100 number
    verificationLevel,    // string: 'new' | 'unverified' | 'basic' | 'verified' | 'trusted' | 'highly_trusted'
    canPerform,          // function(action) => Promise<{ allowed, reason, limit, remaining }>
    updateTrust,         // function(reason, metadata) => Promise
    refreshStatus,       // function() => Promise
    isLoading,           // boolean
    error                // string | null
  } = useTrustShield();

  // Your logic here
}
```

---

## 📊 Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `trustStatus` | Object\|null | Complete verification status object |
| `trustScore` | number | Trust score (0-100) |
| `verificationLevel` | string | Current verification level |
| `restrictions` | Object | Account restrictions |
| `badges` | Array | Earned badges |
| `rateLimits` | Object | Rate limits for current level |
| `details` | Object | Verification details |
| `isLoading` | boolean | Loading state |
| `error` | string\|null | Error message |
| `userId` | string\|null | Current user ID |
| `isVerified` | boolean | Is user verified? |
| `isTrusted` | boolean | Is trust score >= 70? |
| `hasRestrictions` | boolean | Has any restrictions? |
| `requiresReview` | boolean | Requires manual review? |

---

## 🔧 Available Functions

### `canPerform(actionType)`
Check if user can perform an action.

```jsx
const permission = await canPerform('post');

// Returns:
{
  allowed: boolean,      // Can perform action?
  reason: string,        // Reason if denied
  limit: number,         // Rate limit (optional)
  remaining: number,     // Remaining actions (optional)
  waitTime: number       // Seconds to wait (optional)
}
```

**Action Types:**
- `'post'` - Create a post
- `'comment'` - Comment on posts
- `'like'` - Like content
- `'follow'` - Follow users
- `'message'` - Send messages

### `updateTrust(reason, metadata)`
Trigger trust score recalculation.

```jsx
await updateTrust('email_verified', {
  verification_type: 'email',
  timestamp: new Date().toISOString()
});
```

**Common Reasons:**
- `'email_verified'`
- `'phone_verified'`
- `'profile_completed'`
- `'captcha_passed'`
- `'manual_update'`

### `refreshStatus()`
Force refresh trust status (bypasses cache).

```jsx
await refreshStatus();
```

### `clearCache()`
Clear all cached data.

```jsx
clearCache();
```

---

## 🎨 Common Patterns

### 1️⃣ **Check Permission Before Action**
```jsx
const handlePost = async () => {
  const permission = await canPerform('post');
  
  if (!permission.allowed) {
    alert(permission.reason);
    return;
  }
  
  // Create post
  await createPost();
};
```

### 2️⃣ **Display Trust Score**
```jsx
<div className="trust-badge">
  <span>Trust: {trustScore}/100</span>
  <span>Level: {verificationLevel}</span>
</div>
```

### 3️⃣ **Handle Rate Limits**
```jsx
if (!permission.allowed && permission.waitTime) {
  alert(`Rate limited. Wait ${permission.waitTime}s`);
}
```

### 4️⃣ **Update After Verification**
```jsx
const handleEmailVerified = async () => {
  await updateTrust('email_verified');
  await refreshStatus(); // Get new score
};
```

### 5️⃣ **Conditional Rendering**
```jsx
{isTrusted && <PremiumFeatures />}
{hasRestrictions && <RestrictionWarning />}
{requiresReview && <ManualReviewNotice />}
```

---

## 🎭 Context Provider

### Setup
```jsx
// App.jsx
import { TrustShieldProvider } from './hooks/useTrustShield';

function App() {
  return (
    <TrustShieldProvider>
      <YourApp />
    </TrustShieldProvider>
  );
}
```

### Usage
```jsx
// Any child component
import { useTrustShieldContext } from '../hooks/useTrustShield';

function ChildComponent() {
  const { trustScore } = useTrustShieldContext();
  return <div>Score: {trustScore}</div>;
}
```

---

## ⚡ Performance Tips

1. **Use Context**: Wrap app in `<TrustShieldProvider>` to share state
2. **Cache Aware**: Hook caches for 5 minutes automatically
3. **Batch Checks**: Check multiple permissions at once if needed
4. **Auto-refresh**: Status refreshes every 5 minutes automatically

---

## 🚦 Verification Levels

| Level | Trust Score | Description |
|-------|-------------|-------------|
| `new` | 0-10 | Brand new account |
| `unverified` | 0-30 | Low trust, restricted |
| `basic` | 30-50 | Passed basic checks |
| `verified` | 50-70 | Email verified, good behavior |
| `trusted` | 70-90 | High trust, established |
| `highly_trusted` | 90-100 | Maximum trust, all privileges |

---

## 📊 Rate Limits (Default)

### New Accounts
- Posts: 2/hour
- Comments: 5/hour
- Likes: 20/hour
- Follows: 10/hour
- Messages: 5/hour

### Verified Accounts
- Posts: 10/hour
- Comments: 50/hour
- Likes: 200/hour
- Follows: 50/hour
- Messages: 50/hour

### Trusted Accounts
- Posts: 20/hour
- Comments: 100/hour
- Likes: 500/hour
- Follows: 100/hour
- Messages: 100/hour

---

## 🎯 Example Components

### Trust Badge
```jsx
function TrustBadge() {
  const { trustScore, verificationLevel } = useTrustShield();
  
  return (
    <div className={`badge ${verificationLevel}`}>
      {trustScore}
    </div>
  );
}
```

### Permission Gate
```jsx
function PermissionGate({ action, children }) {
  const { canPerform } = useTrustShield();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    canPerform(action).then(p => setAllowed(p.allowed));
  }, [action]);

  return allowed ? children : <Denied />;
}
```

### Post Button
```jsx
function CreatePostButton() {
  const { canPerform } = useTrustShield();
  
  const handleClick = async () => {
    const p = await canPerform('post');
    if (p.allowed) {
      createPost();
    } else {
      alert(p.reason);
    }
  };

  return <button onClick={handleClick}>Post</button>;
}
```

---

## 🐛 Common Issues

### Hook not updating?
```jsx
// Force refresh
await refreshStatus();
```

### Context not available?
```jsx
// Wrap app in provider
<TrustShieldProvider>
  <App />
</TrustShieldProvider>
```

### User not authenticated?
```jsx
// Check if user exists
if (!userId) {
  // User not logged in
}
```

---

## 📖 More Resources

- **Full Examples**: `TRUST-SHIELD-HOOK-EXAMPLES.md`
- **System Docs**: `TRUST-SHIELD-SYSTEM-COMPLETE.md`
- **Setup Guide**: `TRUST-SHIELD-ENV-SETUP.md`
- **Completion**: `🛡️-TRUST-SHIELD-HOOK-READY.md`

---

## 🚀 Ready to Use!

```jsx
// Import
import useTrustShield from '../hooks/useTrustShield';

// Use
const { trustScore, canPerform } = useTrustShield();

// Check permission
const permission = await canPerform('post');

// Done! 🎉
```

---

**Last Updated:** ${new Date().toISOString()}  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
