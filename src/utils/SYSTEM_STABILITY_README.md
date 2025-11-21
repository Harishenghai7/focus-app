# System Stability and Core Infrastructure

This document describes the comprehensive system stability improvements implemented for the Focus app.

## Overview

The system stability infrastructure provides:
- Enhanced error handling with recovery options
- Global error management with user-friendly messages
- Offline detection and request queueing
- Skeleton screens for all loading states
- Retry logic with exponential backoff
- Memory leak detection and subscription cleanup

## Components

### 1. Error Handling (`errorHandler.js`)

Comprehensive error handling system with classification, retry logic, and user-friendly messages.

**Features:**
- Error type classification (Network, Auth, Validation, etc.)
- User-friendly error messages
- Retry logic with exponential backoff
- Timeout handling
- Batch error handling
- Error notifications

**Usage:**
```javascript
import { handleError, retryWithBackoff, withTimeout } from './utils/errorHandler';

// Handle an error
const errorInfo = handleError(error, { context: 'myFunction' });

// Retry with backoff
const result = await retryWithBackoff(
  async () => fetchData(),
  3, // max retries
  1000 // base delay
);

// Add timeout
const result = await withTimeout(
  fetchData(),
  30000 // 30 seconds
);
```

### 2. Enhanced Error Boundary (`ErrorBoundary.js`)

React error boundary with multiple recovery options and detailed error reporting.

**Features:**
- Soft reset (try again)
- Hard reset (clear cache and restart)
- Error report copying
- Error frequency tracking
- Automatic reload on repeated errors
- Development mode details

**Usage:**
```javascript
import ErrorBoundary from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 3. Skeleton Screens (`SkeletonScreen.js`)

Comprehensive skeleton screen components for all loading states.

**Components:**
- `PostSkeleton` - For feed posts
- `ProfileSkeleton` - For profile headers
- `UserListSkeleton` - For user lists
- `MessageListSkeleton` - For message lists
- `NotificationSkeleton` - For notifications
- `GridSkeleton` - For explore grids
- `StorySkeleton` - For story circles
- `LoadingSpinner` - Animated spinner
- `LoadingOverlay` - Full-screen loading

**Usage:**
```javascript
import { PostSkeleton, LoadingSpinner } from './components/SkeletonScreen';

{isLoading ? <PostSkeleton /> : <Post data={post} />}
```

### 4. Subscription Manager (`subscriptionManager.js`)

Prevents memory leaks by managing realtime subscriptions.

**Features:**
- Automatic subscription cleanup
- Maximum subscription limit
- Inactive subscription detection
- Memory usage monitoring
- Activity tracking
- Pattern-based cleanup

**Usage:**
```javascript
import { addSubscription, removeSubscription } from './utils/subscriptionManager';

// Add subscription
const cleanup = addSubscription('feed_updates', subscription, {
  component: 'Home',
  type: 'realtime'
});

// Remove subscription
removeSubscription('feed_updates');

// Or use cleanup function
cleanup();
```

**React Hook:**
```javascript
import { useSubscription } from './utils/subscriptionManager';

useSubscription(
  'my_subscription',
  async () => {
    return supabase
      .channel('my_channel')
      .on('postgres_changes', { ... }, handler)
      .subscribe();
  },
  [dependencies]
);
```

### 5. API Client (`apiClient.js`)

Unified API client with retry, timeout, caching, and offline support.

**Features:**
- Automatic retry with exponential backoff
- Request timeout handling
- Response caching
- Offline request queueing
- Batch operations
- File upload/download
- Prefetching

**Usage:**
```javascript
import { fetchData, insertData, updateData } from './utils/apiClient';

// Fetch with caching
const { data, error } = await fetchData('posts', {
  filters: { user_id: userId },
  order: 'created_at:desc',
  limit: 10,
  cache: true,
  cacheKey: `posts_${userId}`
});

// Insert with offline queue
const { data, error } = await insertData('posts', postData, {
  offlineQueue: true
});

// Update with retry
const { data, error } = await updateData('posts', postId, updates, {
  retries: 3
});
```

### 6. Offline Manager (`offlineManager.js`)

Enhanced offline functionality with request queueing and retry logic.

**Features:**
- Offline detection
- Action queueing
- Automatic retry with exponential backoff
- Cache management
- Optimistic updates
- Sync status tracking

**Usage:**
```javascript
import { useOffline } from './utils/offlineManager';

const { isOnline, pendingActions, queueAction } = useOffline();

// Queue action when offline
if (!isOnline) {
  queueAction({
    type: 'like',
    userId: user.id,
    contentId: post.id,
    contentType: 'post'
  });
}
```

### 7. Loading State Hooks (`useLoadingState.js`)

React hooks for managing loading states.

**Hooks:**
- `useLoadingState` - Basic loading state
- `useMultipleLoadingStates` - Multiple loading states
- `useDebouncedLoading` - Debounced loading (prevents flash)
- `useMinimumLoadingTime` - Minimum loading time
- `useAsyncOperation` - Async operation with loading
- `usePaginatedLoading` - Pagination with loading

**Usage:**
```javascript
import { useLoadingState, useAsyncOperation } from './hooks/useLoadingState';

// Basic loading state
const { isLoading, error, data, execute } = useLoadingState();

const handleSubmit = async () => {
  try {
    const result = await execute(async () => {
      return await submitData();
    });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err);
  }
};

// Async operation
const { isLoading, error, data, execute } = useAsyncOperation();

await execute(
  async () => fetchData(),
  {
    onSuccess: (data) => console.log('Success:', data),
    onError: (error) => console.error('Error:', error),
    minLoadingTime: 500 // Prevent flash
  }
);
```

### 8. Error Logger (`errorLogger.js`)

Centralized error logging with monitoring integration.

**Features:**
- Error logging with context
- Local storage persistence
- Event listeners for uncaught errors
- Monitoring service integration
- Error categorization
- Performance tracking

**Usage:**
```javascript
import { logError, logApiError, logAuthError } from './utils/errorLogger';

// Log general error
logError(error, { context: 'myFunction', userId: user.id });

// Log API error
logApiError(error, '/api/posts', 'GET');

// Log auth error
logAuthError(error, 'login');
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap your app and major sections in error boundaries:

```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2. Show Loading States

Always show skeleton screens or loading indicators:

```javascript
{isLoading ? <PostSkeleton /> : <Post data={post} />}
```

### 3. Handle Errors Gracefully

Use the error handler for all async operations:

```javascript
try {
  const result = await fetchData();
} catch (error) {
  const errorInfo = handleError(error);
  showNotification(errorInfo.message, 'error');
}
```

### 4. Manage Subscriptions

Always clean up subscriptions:

```javascript
useEffect(() => {
  const cleanup = addSubscription('my_sub', subscription);
  return cleanup;
}, []);
```

### 5. Use API Client

Use the API client instead of direct Supabase calls:

```javascript
// Instead of:
const { data } = await supabase.from('posts').select('*');

// Use:
const { data } = await fetchData('posts', { cache: true });
```

### 6. Queue Offline Actions

Queue actions when offline:

```javascript
if (!isOnline) {
  queueAction({ type: 'like', ... });
  return;
}
```

### 7. Implement Retry Logic

Use retry logic for critical operations:

```javascript
const result = await retryWithBackoff(
  async () => criticalOperation(),
  3 // max retries
);
```

## Performance Considerations

### Memory Management

- Subscriptions are automatically cleaned up after 5 minutes of inactivity
- Maximum of 10 concurrent subscriptions (configurable)
- Memory usage is monitored and logged

### Caching

- API responses are cached by default for 5 minutes
- Cache is automatically cleared when memory is low
- Stale cache is used as fallback on errors

### Loading States

- Debounced loading prevents UI flash for fast operations
- Minimum loading time prevents jarring transitions
- Skeleton screens improve perceived performance

## Monitoring

### Error Tracking

All errors are logged with context:
- Error type and message
- Stack trace
- User agent and URL
- User ID (if available)
- Timestamp

### Performance Metrics

Track performance with:
```javascript
import { logPerformance } from './utils/errorLogger';

const start = Date.now();
await operation();
logPerformance('operation_name', Date.now() - start);
```

### Subscription Monitoring

Monitor subscriptions:
```javascript
import { getSubscriptionInfo } from './utils/subscriptionManager';

const info = getSubscriptionInfo();
console.log('Active subscriptions:', info.total);
console.log('Details:', info.subscriptions);
```

## Troubleshooting

### High Memory Usage

If memory usage is high:
1. Check active subscriptions: `getSubscriptionInfo()`
2. Clear cache: `clearCache()`
3. Reduce max subscriptions: `subscriptionManager.setMaxSubscriptions(5)`

### Repeated Errors

If errors repeat:
1. Check error logs: `getErrors()`
2. Clear error log: `clearErrors()`
3. The error boundary will auto-reload after 3 errors

### Offline Issues

If offline sync fails:
1. Check pending actions: `offlineManager.getStatus()`
2. Clear pending actions: `offlineManager.pendingActions = []`
3. Check network connectivity

## Testing

### Test Error Handling

```javascript
// Trigger error boundary
throw new Error('Test error');

// Test retry logic
await retryWithBackoff(
  async () => {
    throw new Error('Test');
  },
  3
);
```

### Test Loading States

```javascript
const { isLoading, execute } = useLoadingState();

await execute(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  return 'Success';
});
```

### Test Offline Mode

```javascript
// Simulate offline
Object.defineProperty(navigator, 'onLine', { value: false });

// Queue action
queueAction({ type: 'like', ... });

// Simulate online
Object.defineProperty(navigator, 'onLine', { value: true });
window.dispatchEvent(new Event('online'));
```

## Future Improvements

- [ ] Integrate with Sentry for error monitoring
- [ ] Add analytics tracking
- [ ] Implement service worker for offline support
- [ ] Add request deduplication
- [ ] Implement optimistic UI updates framework
- [ ] Add network quality detection
- [ ] Implement adaptive retry strategies
- [ ] Add error recovery suggestions

## Support

For issues or questions, check:
1. Error logs: `getErrors()`
2. Subscription info: `getSubscriptionInfo()`
3. Offline status: `offlineManager.getStatus()`
4. Console logs (development mode)
