# Error Tracking Guide

This guide covers the error tracking and monitoring system for the Focus application using Sentry.

## Overview

Focus uses Sentry for comprehensive error tracking, performance monitoring, and session replay. This helps identify and fix issues quickly in production.

## Setup

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for "React"
3. Copy your DSN (Data Source Name)

### 2. Configure Environment Variables

Add to your `.env.production`:

```bash
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id
REACT_APP_ENV=production
REACT_APP_VERSION=0.1.0
```

### 3. Install Dependencies

```bash
npm install @sentry/react @sentry/tracing
```

## Features

### Error Tracking

Automatically captures:
- Uncaught exceptions
- Unhandled promise rejections
- React component errors (via Error Boundary)
- API errors
- Network failures

### Performance Monitoring

Tracks:
- Page load times
- API response times
- Component render times
- Navigation performance

### Session Replay

Records:
- User interactions (with privacy masking)
- Console logs
- Network requests
- DOM changes

### Breadcrumbs

Logs:
- User actions (clicks, navigation)
- API calls
- Console messages
- State changes

## Usage

### Manual Error Capture

```javascript
import { captureException, captureMessage } from './utils/errorTracking';

// Capture an exception
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    context: 'user-action',
    action: 'create-post'
  });
}

// Capture a message
captureMessage('User completed onboarding', 'info', {
  userId: user.id,
  completionTime: Date.now()
});
```

### Set User Context

```javascript
import { setUser } from './utils/errorTracking';

// After login
setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// After logout
setUser(null);
```

### Add Breadcrumbs

```javascript
import { addBreadcrumb } from './utils/errorTracking';

addBreadcrumb({
  category: 'user-action',
  message: 'User liked post',
  level: 'info',
  data: {
    postId: post.id,
    timestamp: Date.now()
  }
});
```

### Track API Calls

```javascript
import { trackAPICall } from './utils/errorTracking';

const startTime = Date.now();
try {
  const response = await fetch('/api/posts');
  const duration = Date.now() - startTime;
  
  trackAPICall('/api/posts', 'GET', duration, response.status);
} catch (error) {
  const duration = Date.now() - startTime;
  trackAPICall('/api/posts', 'GET', duration, 0);
  throw error;
}
```

### Performance Monitoring

```javascript
import { startTransaction } from './utils/errorTracking';

const transaction = startTransaction('load-feed', 'navigation');

try {
  await loadFeedData();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

## Configuration

### Error Filtering

Errors are automatically filtered in `src/utils/errorTracking.js`:

```javascript
// Ignored error messages
const ignoredMessages = [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  'Network request failed',
];
```

Add more patterns as needed.

### Sample Rates

Configure in `src/utils/errorTracking.js`:

```javascript
tracesSampleRate: 0.1,        // 10% of transactions
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

Adjust based on your traffic and budget.

### Privacy

Sensitive data is automatically masked:

- All text in session replays
- All media in session replays
- Passwords and tokens in URLs
- Console logs (filtered out)

## Monitoring

### Sentry Dashboard

Access your Sentry dashboard to:

1. **View Errors:**
   - See all captured errors
   - Group similar errors
   - Track error frequency
   - View stack traces

2. **Performance:**
   - Monitor page load times
   - Track API response times
   - Identify slow operations

3. **Session Replay:**
   - Watch user sessions
   - See what led to errors
   - Understand user behavior

4. **Releases:**
   - Track errors by version
   - Compare error rates
   - Monitor deployments

### Alerts

Set up alerts in Sentry:

1. **Error Rate Alerts:**
   ```
   Alert when error rate > 10 errors/minute
   ```

2. **New Issue Alerts:**
   ```
   Alert on first occurrence of new error
   ```

3. **Performance Alerts:**
   ```
   Alert when p95 response time > 3 seconds
   ```

4. **Regression Alerts:**
   ```
   Alert when resolved issue reoccurs
   ```

## Best Practices

### 1. Add Context

Always add context to errors:

```javascript
captureException(error, {
  component: 'PostCard',
  action: 'like-post',
  postId: post.id,
  userId: user.id
});
```

### 2. Use Breadcrumbs

Add breadcrumbs for important actions:

```javascript
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to profile',
  data: { userId: targetUser.id }
});
```

### 3. Set User Context

Update user context on auth changes:

```javascript
// On login
setUser(user);

// On logout
setUser(null);
```

### 4. Track Performance

Monitor critical operations:

```javascript
const transaction = startTransaction('create-post');
// ... operation ...
transaction.finish();
```

### 5. Filter Noise

Don't send every error:

```javascript
// Only send operational errors
if (error.isOperational) {
  captureException(error);
}
```

## Troubleshooting

### Errors Not Appearing

1. **Check DSN:**
   ```bash
   echo $REACT_APP_SENTRY_DSN
   ```

2. **Check Environment:**
   ```bash
   echo $REACT_APP_ENV
   # Should be 'production'
   ```

3. **Check Console:**
   ```javascript
   import { getStatus } from './utils/errorTracking';
   console.log(getStatus());
   ```

### Too Many Errors

1. **Increase Filtering:**
   ```javascript
   // Add more ignored patterns
   const ignoredMessages = [
     'ResizeObserver loop limit exceeded',
     'Your pattern here'
   ];
   ```

2. **Reduce Sample Rate:**
   ```javascript
   tracesSampleRate: 0.05, // 5% instead of 10%
   ```

### Missing Context

1. **Add User Context:**
   ```javascript
   setUser(user);
   ```

2. **Add Breadcrumbs:**
   ```javascript
   addBreadcrumb({ message: 'Important action' });
   ```

3. **Add Tags:**
   ```javascript
   setTag('feature', 'messaging');
   ```

## Cost Optimization

### 1. Adjust Sample Rates

Lower sample rates for high-traffic apps:

```javascript
// Low traffic (< 1000 users/day)
tracesSampleRate: 0.5,
replaysSessionSampleRate: 0.5,

// Medium traffic (1000-10000 users/day)
tracesSampleRate: 0.1,
replaysSessionSampleRate: 0.1,

// High traffic (> 10000 users/day)
tracesSampleRate: 0.01,
replaysSessionSampleRate: 0.01,
```

### 2. Filter Errors

Only send important errors:

```javascript
beforeSend(event, hint) {
  // Don't send development errors
  if (process.env.NODE_ENV === 'development') {
    return null;
  }
  
  // Don't send known issues
  if (isKnownIssue(event)) {
    return null;
  }
  
  return event;
}
```

### 3. Use Quotas

Set quotas in Sentry dashboard:
- Max events per month
- Max replays per month
- Alert when approaching limit

## Integration with CI/CD

### Upload Source Maps

Add to your build script:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps
sentry-cli releases files $VERSION upload-sourcemaps ./build/static/js
```

### Create Releases

```bash
# Create release
sentry-cli releases new $VERSION

# Associate commits
sentry-cli releases set-commits $VERSION --auto

# Finalize release
sentry-cli releases finalize $VERSION
```

### Netlify Integration

Add to `netlify.toml`:

```toml
[build.environment]
  SENTRY_AUTH_TOKEN = "your-auth-token"
  SENTRY_ORG = "your-org"
  SENTRY_PROJECT = "focus"

[[plugins]]
  package = "@sentry/netlify-build-plugin"
  
  [plugins.inputs]
    sentryOrg = "your-org"
    sentryProject = "focus"
```

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Best Practices](https://docs.sentry.io/product/best-practices/)

## Support

For issues with error tracking:
1. Check Sentry status: https://status.sentry.io/
2. Review Sentry docs
3. Check console for initialization errors
4. Verify environment variables
5. Contact Sentry support
