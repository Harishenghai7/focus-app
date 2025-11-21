# Security Implementation Guide

## Overview

This document describes the comprehensive security measures implemented in Focus to protect user data and prevent common web vulnerabilities.

## Table of Contents

1. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
2. [Input Validation and Sanitization](#input-validation-and-sanitization)
3. [Rate Limiting](#rate-limiting)
4. [Signed URLs for Media](#signed-urls-for-media)
5. [CSRF Protection](#csrf-protection)
6. [Testing Security Measures](#testing-security-measures)

---

## Row Level Security (RLS) Policies

### Overview

RLS policies ensure that users can only access data they're authorized to see. All database tables have comprehensive policies that respect privacy settings, blocking, and follow relationships.

### Implementation

**Migration File:** `migrations/033_comprehensive_rls_policies.sql`

**Key Features:**
- Privacy-aware access control (public vs private accounts)
- Blocking enforcement (blocked users cannot interact)
- Follow request system (pending vs active follows)
- Owner-only modifications
- Secure message and notification access

### Testing

Use the RLS Policy Tester utility:

```javascript
import { runAllRLSTests } from './utils/rlsPolicyTester';

// Run all tests
const results = await runAllRLSTests();
console.log(`Success Rate: ${results.summary.successRate}%`);
```

### Key Policies

**Profiles:**
- Public profiles viewable by everyone
- Private profiles only viewable by approved followers
- Users can only update their own profile

**Posts:**
- Viewable based on profile privacy
- Blocked users cannot see each other's posts
- Users can only modify their own posts

**Messages:**
- Users can only view messages they sent or received
- Group messages require conversation participation
- Blocked users cannot message each other

---

## Input Validation and Sanitization

### Overview

All user inputs are validated and sanitized to prevent XSS, SQL injection, and other injection attacks.

### Implementation

**Files:**
- `src/utils/validation.js` - Validation functions
- `src/utils/inputSanitizer.js` - Sanitization utilities

### Validation Functions

```javascript
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateText,
  validateUrl,
  validateFileUpload
} from './utils/validation';

// Email validation
const emailResult = validateEmail('user@example.com');
// { isValid: true, feedback: '' }

// Password validation
const passwordResult = validatePassword('SecurePass123!');
// { isValid: true, strength: 'strong', score: 5, ... }

// Text validation with sanitization
const textResult = validateText('<script>alert("xss")</script>Hello', 500);
// { isValid: true, sanitized: 'Hello', length: 5 }
```

### Sanitization Functions

```javascript
import {
  sanitizeHtml,
  sanitizeSqlInput,
  sanitizeCaption,
  sanitizeFormData
} from './utils/inputSanitizer';

// Sanitize HTML content
const clean = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>');
// '<p>Safe content</p>'

// Sanitize caption with hashtags
const caption = sanitizeCaption('Check out #focus @user <script>bad</script>');
// {
//   sanitized: 'Check out #focus @user ',
//   hashtags: ['focus'],
//   mentions: ['user']
// }
```

### Security Features

- **XSS Prevention:** Removes script tags, event handlers, and dangerous protocols
- **SQL Injection Prevention:** Sanitizes SQL keywords and dangerous characters
- **File Upload Validation:** Checks file types, sizes, and extensions
- **URL Validation:** Only allows HTTP/HTTPS protocols
- **Recursive Sanitization:** Sanitizes nested objects and arrays

---

## Rate Limiting

### Overview

Rate limiting prevents abuse by restricting the number of actions users can perform within a time window.

### Implementation

**Files:**
- `src/utils/rateLimitManager.js` - Rate limiting logic
- `src/hooks/useRateLimit.js` - React hook
- `src/components/RateLimitError.js` - Error display component

### Rate Limits

| Action | Limit | Window | Message |
|--------|-------|--------|---------|
| Login | 5 attempts | 15 minutes | Too many login attempts |
| Post Creation | 5 posts | 1 hour | You can only create 5 posts per hour |
| Comments | 10 comments | 1 minute | You're commenting too fast |
| Messages | 30 messages | 1 minute | You're sending messages too fast |
| Likes | 100 likes | 1 minute | You're liking too fast |
| Follows | 20 follows | 1 minute | You're following too fast |

### Usage

**In React Components:**

```javascript
import { useRateLimit } from './hooks/useRateLimit';

function CommentForm() {
  const { executeWithLimit, allowed, remaining, message } = useRateLimit('COMMENT');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await executeWithLimit(async () => {
        // Your comment submission logic
        await submitComment(commentText);
      });
    } catch (error) {
      // Rate limit exceeded
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {!allowed && <div className="error">{message}</div>}
      {allowed && <div className="info">{remaining} comments remaining</div>}
    </form>
  );
}
```

**Direct Usage:**

```javascript
import { checkRateLimit, recordAttempt } from './utils/rateLimitManager';

// Check if action is allowed
const status = checkRateLimit('POST_CREATE', userId);
if (!status.allowed) {
  console.log(`Rate limited. Try again in ${status.remainingMinutes} minutes`);
  return;
}

// Perform action
await createPost(postData);

// Record the attempt
recordAttempt('POST_CREATE', userId);
```

### Features

- **Automatic Cleanup:** Old attempts outside the time window are automatically removed
- **Warning System:** Shows warnings when approaching limits
- **Persistent Storage:** Uses localStorage to persist across page reloads
- **User-Friendly Messages:** Clear error messages with time remaining
- **Violation Logging:** Logs rate limit violations for monitoring

---

## Signed URLs for Media

### Overview

Signed URLs provide time-limited, secure access to media files, preventing unauthorized access and hotlinking.

### Implementation

**Files:**
- `src/utils/signedUrlManager.js` - Signed URL management
- `src/hooks/useSignedUrl.js` - React hooks

### Usage

**Single Signed URL:**

```javascript
import { useSignedUrl } from './hooks/useSignedUrl';

function ProfileAvatar({ bucket, path }) {
  const { signedUrl, loading, error } = useSignedUrl(bucket, path, {
    expiresIn: 3600, // 1 hour
    autoRefresh: true // Automatically refresh before expiration
  });

  if (loading) return <Skeleton />;
  if (error) return <DefaultAvatar />;

  return <img src={signedUrl} alt="Avatar" />;
}
```

**Multiple Signed URLs:**

```javascript
import { useSignedUrls } from './hooks/useSignedUrl';

function PostCarousel({ bucket, imagePaths }) {
  const { signedUrls, loading } = useSignedUrls(bucket, imagePaths);

  if (loading) return <Loading />;

  return (
    <div className="carousel">
      {signedUrls.map((url, index) => (
        <img key={index} src={url} alt={`Image ${index + 1}`} />
      ))}
    </div>
  );
}
```

**Convert Public URL to Signed URL:**

```javascript
import { convertToSignedUrl } from './utils/signedUrlManager';

// Convert a public URL
const publicUrl = 'https://example.supabase.co/storage/v1/object/public/posts/image.jpg';
const signedUrl = await convertToSignedUrl(publicUrl, 3600);
```

### Features

- **Automatic Caching:** Caches signed URLs to avoid redundant requests
- **Auto-Refresh:** Automatically refreshes URLs before they expire
- **Expiration Management:** Configurable expiration times
- **Bucket-Specific Helpers:** Convenience functions for each storage bucket
- **URL Parsing:** Extracts bucket and path from public URLs

### Configuration

Default expiration: **1 hour (3600 seconds)**

Bucket-specific helpers:
```javascript
import {
  avatarSignedUrl,
  postSignedUrl,
  boltzSignedUrl,
  flashSignedUrl,
  messageSignedUrl
} from './utils/signedUrlManager';

// Get signed URL for avatar
const avatarUrl = await avatarSignedUrl('user123/avatar.jpg');
```

---

## CSRF Protection

### Overview

CSRF (Cross-Site Request Forgery) protection prevents malicious websites from performing unauthorized actions on behalf of authenticated users.

### Implementation

**Files:**
- `src/utils/csrfProtection.js` - CSRF protection logic
- `src/hooks/useCSRFProtection.js` - React hooks
- `src/components/CSRFProtectionProvider.js` - Context provider

### Setup

**1. Wrap your app with the CSRF provider:**

```javascript
import { CSRFProtectionProvider } from './components/CSRFProtectionProvider';

function App() {
  return (
    <CSRFProtectionProvider>
      <YourApp />
    </CSRFProtectionProvider>
  );
}
```

**2. Initialize on login:**

```javascript
import { initializeCSRFProtection, clearCSRFToken } from './utils/csrfProtection';

// On login
const handleLogin = async (credentials) => {
  const user = await login(credentials);
  initializeCSRFProtection(); // Generate new token
  return user;
};

// On logout
const handleLogout = async () => {
  await logout();
  clearCSRFToken(); // Clear token
};
```

### Usage

**Protected Fetch Requests:**

```javascript
import { useProtectedFetch } from './hooks/useCSRFProtection';

function CreatePost() {
  const protectedFetch = useProtectedFetch();

  const handleSubmit = async (postData) => {
    // CSRF token automatically added to POST requests
    const response = await protectedFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    
    return response.json();
  };
}
```

**Protected Form Submission:**

```javascript
import { useProtectedForm } from './hooks/useCSRFProtection';

function CommentForm() {
  const handleSubmit = useProtectedForm(async (event, formData, token) => {
    // Token is automatically added to formData
    const response = await fetch('/api/comments', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Using Context:**

```javascript
import { useCSRF } from './components/CSRFProtectionProvider';

function MyComponent() {
  const { token, protectedFetch, refresh } = useCSRF();

  const handleAction = async () => {
    const response = await protectedFetch('/api/action', {
      method: 'POST',
      body: JSON.stringify({ data: 'value' })
    });
  };
}
```

### Features

- **Automatic Token Generation:** Tokens generated on app load and login
- **Token Expiration:** Tokens expire after 24 hours
- **Automatic Inclusion:** Tokens automatically added to state-changing requests
- **Multiple Methods:** Supports headers, form data, and URL parameters
- **Validation:** Server-side validation support
- **Violation Logging:** Logs CSRF violations for monitoring

### Token Storage

Tokens are stored in **sessionStorage** for security:
- Cleared when browser tab is closed
- Not accessible across different origins
- Automatically expires after 24 hours

---

## Testing Security Measures

### RLS Policy Testing

```bash
# Run RLS tests
npm run test:rls
```

Or in code:
```javascript
import { runAllRLSTests } from './utils/rlsPolicyTester';

const results = await runAllRLSTests();
```

### Input Validation Testing

```javascript
import { validateEmail, validatePassword, sanitizeHtml } from './utils/validation';

// Test email validation
console.assert(validateEmail('test@example.com') === true);
console.assert(validateEmail('invalid-email') === false);

// Test XSS prevention
const dirty = '<script>alert("xss")</script>Hello';
const clean = sanitizeHtml(dirty);
console.assert(!clean.includes('<script>'));
```

### Rate Limiting Testing

```javascript
import { checkRateLimit, recordAttempt } from './utils/rateLimitManager';

// Simulate multiple attempts
for (let i = 0; i < 15; i++) {
  const status = checkRateLimit('COMMENT', 'test-user');
  console.log(`Attempt ${i + 1}: ${status.allowed ? 'Allowed' : 'Blocked'}`);
  
  if (status.allowed) {
    recordAttempt('COMMENT', 'test-user');
  }
}
```

### CSRF Protection Testing

```javascript
import { generateCSRFToken, validateCSRFToken } from './utils/csrfProtection';

// Generate and validate token
const token = generateCSRFToken();
console.assert(validateCSRFToken(token) === true);
console.assert(validateCSRFToken('invalid-token') === false);
```

---

## Security Best Practices

### For Developers

1. **Always validate user input** on both client and server
2. **Use signed URLs** for all media files
3. **Implement rate limiting** for all user actions
4. **Include CSRF tokens** in all state-changing requests
5. **Test RLS policies** before deploying database changes
6. **Log security violations** for monitoring
7. **Keep dependencies updated** to patch vulnerabilities
8. **Use HTTPS** in production
9. **Implement proper error handling** without exposing sensitive information
10. **Regular security audits** of code and dependencies

### For Users

1. Use strong, unique passwords
2. Enable two-factor authentication
3. Be cautious of phishing attempts
4. Report suspicious activity
5. Keep your browser updated

---

## Monitoring and Logging

All security violations are logged and can be monitored:

```javascript
// Security violations are automatically logged
// Check browser console in development
// Sent to analytics in production

// Example violation log:
{
  type: 'rate_limit_violation',
  action: 'COMMENT',
  identifier: 'user123...',
  timestamp: '2024-01-15T10:30:00Z'
}
```

---

## Support

For security concerns or to report vulnerabilities:
- Email: security@focus.app
- Bug Bounty: https://focus.app/security

**Please do not publicly disclose security vulnerabilities.**

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial implementation of comprehensive security measures
- RLS policies for all tables
- Input validation and sanitization
- Rate limiting system
- Signed URLs for media
- CSRF protection

---

## License

This security implementation is part of the Focus application.
All rights reserved.
