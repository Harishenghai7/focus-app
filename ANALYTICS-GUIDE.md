# Analytics Guide

This guide covers the analytics and user tracking system for the Focus application.

## Overview

Focus uses Google Analytics 4 (GA4) to track user engagement, feature usage, conversion funnels, and performance metrics. This helps understand user behavior and improve the product.

## Setup

### 1. Create Google Analytics Account

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new GA4 property
3. Copy your Measurement ID (format: G-XXXXXXXXXX)

### 2. Configure Environment Variables

Add to your `.env.production`:

```bash
REACT_APP_ANALYTICS_ID=G-XXXXXXXXXX
REACT_APP_ENV=production
```

### 3. Verify Installation

Check browser console for:
```
✅ Analytics initialized
```

## Features

### Page View Tracking

Automatically tracks:
- Page navigation
- Route changes
- Time on page

### Event Tracking

Tracks user actions:
- Button clicks
- Form submissions
- Feature usage
- Errors

### Conversion Tracking

Monitors key conversions:
- User signups
- Post creation
- Message sent
- Call initiated

### Funnel Tracking

Tracks multi-step processes:
- Onboarding flow
- Post creation flow
- Settings changes

### Performance Monitoring

Tracks Core Web Vitals:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

## Usage

### Track Page Views

```javascript
import { trackPageView } from './utils/analytics';

// Track page view
trackPageView('/home', 'Home Feed');
```

### Track Events

```javascript
import { trackEvent } from './utils/analytics';

// Track custom event
trackEvent('engagement', 'like_post', 'post_123', 1);
```

### Track Feature Usage

```javascript
import { trackFeatureUsage } from './utils/analytics';

// Track feature usage
trackFeatureUsage('messaging', 'send', {
  conversationType: 'direct',
  hasMedia: true
});
```

### Track Conversions

```javascript
import { trackConversion } from './utils/analytics';

// Track conversion
trackConversion('post_created', 1);
```

### Track User Actions

```javascript
import {
  trackSignup,
  trackLogin,
  trackPostCreation,
  trackInteraction,
  trackMessageSent,
  trackCallInitiated,
  trackSearch,
  trackProfileView
} from './utils/analytics';

// Track signup
trackSignup('email'); // or 'google', 'github'

// Track login
trackLogin('email');

// Track post creation
trackPostCreation('image', 3); // type, mediaCount

// Track interaction
trackInteraction('like', 'post'); // type, contentType

// Track message
trackMessageSent('direct'); // or 'group'

// Track call
trackCallInitiated('video'); // or 'audio'

// Track search
trackSearch('sunset photos', 42); // query, resultCount

// Track profile view
trackProfileView('user_123', false); // userId, isOwnProfile
```

### Track Funnels

```javascript
import {
  trackOnboardingStep,
  trackPostCreationStep
} from './utils/analytics';

// Track onboarding funnel
trackOnboardingStep('start');
trackOnboardingStep('username');
trackOnboardingStep('profile_info');
trackOnboardingStep('avatar');
trackOnboardingStep('complete');

// Track post creation funnel
trackPostCreationStep('start');
trackPostCreationStep('media_select');
trackPostCreationStep('media_edit');
trackPostCreationStep('caption');
trackPostCreationStep('publish');
```

### Set User Properties

```javascript
import { setUserProperties, setUserId } from './utils/analytics';

// Set user ID (after login)
setUserId(user.id);

// Set user properties
setUserProperties({
  account_type: 'premium',
  signup_date: '2024-01-01',
  preferred_theme: 'dark'
});
```

### Track Performance

```javascript
import { trackPerformance } from './utils/analytics';

// Track custom performance metric
const startTime = performance.now();
await loadData();
const duration = performance.now() - startTime;

trackPerformance('load_feed', duration);
```

## Key Metrics

### Engagement Metrics

Track in GA4:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Pages per session
- Bounce rate

### Feature Usage

Monitor:
- Post creation rate
- Message send rate
- Call initiation rate
- Search usage
- Profile views

### Conversion Funnels

Analyze:
1. **Signup Funnel:**
   - Landing page view
   - Signup start
   - Email verification
   - Onboarding complete

2. **Post Creation Funnel:**
   - Create button click
   - Media selection
   - Caption entry
   - Post published

3. **Messaging Funnel:**
   - Messages page view
   - Conversation start
   - Message sent
   - Reply received

### Performance Metrics

Monitor:
- Page load time (< 3s target)
- API response time (< 500ms target)
- LCP (< 2.5s target)
- FID (< 100ms target)
- CLS (< 0.1 target)

## GA4 Dashboard

### Custom Reports

Create reports for:

1. **User Engagement:**
   - Active users over time
   - Feature usage breakdown
   - Session duration distribution

2. **Conversion Analysis:**
   - Signup conversion rate
   - Post creation rate
   - Retention cohorts

3. **Performance:**
   - Page load times
   - API response times
   - Error rates

### Custom Dimensions

Set up dimensions:
- User ID
- Account type
- Signup method
- Preferred theme
- Device type

### Custom Metrics

Track metrics:
- Posts created
- Messages sent
- Calls made
- Searches performed

## Privacy & Compliance

### GDPR Compliance

1. **Cookie Consent:**
   ```javascript
   // Only initialize after consent
   if (userConsent) {
     initializeAnalytics();
   }
   ```

2. **Data Anonymization:**
   ```javascript
   // IP anonymization enabled by default
   gtag('config', measurementId, {
     anonymize_ip: true
   });
   ```

3. **Opt-Out:**
   ```javascript
   import { optOutAnalytics } from './utils/analytics';
   
   // User opts out
   optOutAnalytics();
   ```

### Data Retention

Configure in GA4:
- Event data: 14 months
- User data: 14 months
- Reset on new activity: Yes

### PII Protection

Never track:
- Passwords
- Email addresses (use hashed IDs)
- Phone numbers
- Payment information
- Private messages

## Best Practices

### 1. Consistent Naming

Use consistent event names:
```javascript
// Good
trackEvent('engagement', 'like_post', 'post_123');
trackEvent('engagement', 'comment_post', 'post_123');

// Bad
trackEvent('engagement', 'like', 'post_123');
trackEvent('user_action', 'comment', 'post_123');
```

### 2. Meaningful Labels

Add context to events:
```javascript
trackFeatureUsage('messaging', 'send', {
  conversationType: 'direct',
  hasMedia: true,
  messageLength: 'short'
});
```

### 3. Track User Journey

Track complete flows:
```javascript
// Start of flow
trackFunnelStep('post_creation', 'start', 1);

// Each step
trackFunnelStep('post_creation', 'media_select', 2);
trackFunnelStep('post_creation', 'caption', 3);

// Completion
trackFunnelStep('post_creation', 'publish', 4);
```

### 4. Monitor Performance

Track critical operations:
```javascript
const transaction = startTransaction('load_feed');
await loadFeed();
transaction.finish();
```

### 5. Respect Privacy

Check opt-out status:
```javascript
import { hasOptedOut } from './utils/analytics';

if (!hasOptedOut()) {
  trackEvent('engagement', 'like_post');
}
```

## Troubleshooting

### Events Not Appearing

1. **Check Configuration:**
   ```bash
   echo $REACT_APP_ANALYTICS_ID
   # Should be G-XXXXXXXXXX
   ```

2. **Check Console:**
   ```javascript
   import { getAnalyticsStatus } from './utils/analytics';
   console.log(getAnalyticsStatus());
   ```

3. **Check Network:**
   - Open DevTools > Network
   - Filter for "google-analytics"
   - Verify requests are sent

### Delayed Data

GA4 data can take 24-48 hours to appear:
- Use DebugView for real-time testing
- Check "Realtime" report for immediate data

### Missing User Properties

Ensure properties are set after login:
```javascript
setUserId(user.id);
setUserProperties({
  account_type: user.account_type
});
```

## Testing

### Debug Mode

Enable debug mode in development:

```javascript
// Add to .env.development
REACT_APP_GA_DEBUG=true
```

### DebugView

1. Open GA4 > Configure > DebugView
2. Interact with your app
3. See events in real-time

### GA4 Event Builder

Test events:
1. Open Chrome DevTools
2. Install GA Debugger extension
3. View events as they fire

## Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Best Practices](https://developers.google.com/analytics/devguides/collection/ga4/best-practices)
- [Privacy & Compliance](https://support.google.com/analytics/topic/2919631)

## Support

For analytics issues:
1. Check GA4 status
2. Verify configuration
3. Test in DebugView
4. Review GA4 documentation
5. Contact Google Analytics support
