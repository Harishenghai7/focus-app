# Utils Inventory

## Overview
This document inventories all utility functions in the `/src/utils/` directory, documenting their purpose, parameters, return values, dependencies, and usage patterns.

## Utils Summary
- **Total Utils**: 45+ utility files
- **Categories**: Validation, formatting, API clients, security, media processing, analytics
- **Dependencies**: Mix of browser APIs, external libraries, and custom code
- **Testing**: Partial test coverage (some utils have tests)

## Utility Categories

### Validation & Sanitization (8)

1. **validation.js**
   - **Purpose**: Input validation functions
   - **Functions**: `validateEmail`, `validatePassword`, `validateUsername`, `validateText`, `validateUrl`, `validatePhone`, `validateHashtag`, `validateFileUpload`, `validateAge`, `sanitizeHtml`, `sanitizeSqlInput`
   - **Dependencies**: None
   - **Tests**: Yes (`validation.test.js`)

2. **inputSanitizer.js**
   - **Purpose**: Input sanitization and security
   - **Functions**: `sanitizeObject`, `sanitizeFormData`, `sanitizeFilename`, `sanitizeSearchQuery`, `sanitizeEmail`, `sanitizeCaption`, `sanitizeBio`, `sanitizeUsername`, `escapeRegex`, `detectXSS`, `detectSQLInjection`
   - **Dependencies**: DOMPurify (assumed)
   - **Tests**: Yes (`inputSanitizer.test.js`)

3. **mediaValidator.js**
   - **Purpose**: Media file validation
   - **Functions**: `validateImage`, `validateVideo`, `validateAudio`, `getMediaType`, `checkFileSize`, `validateDimensions`
   - **Dependencies**: File API
   - **Usage**: File uploads, media processing

4. **contentParser.js**
   - **Purpose**: Content parsing and processing
   - **Functions**: `parseMentions`, `parseHashtags`, `parseUrls`, `extractMetadata`, `formatContent`
   - **Dependencies**: None
   - **Tests**: Yes (`contentParser.test.js`)

### Formatting & Display (6)

5. **dateFormatter.js**
   - **Purpose**: Date and time formatting
   - **Functions**: `formatDate`, `formatTime`, `formatRelativeTime`, `formatMessageTime`, `getTimeAgo`
   - **Dependencies**: None
   - **Tests**: Yes (`dateFormatter.test.js`)

6. **altTextGenerator.js**
   - **Purpose**: Automatic alt text generation for images
   - **Functions**: `generateAltText`, `analyzeImage`, `getDescriptiveText`
   - **Dependencies**: AI/ML APIs (assumed)
   - **Usage**: Accessibility, SEO

7. **colorContrast.js**
   - **Purpose**: Color contrast and accessibility utilities
   - **Functions**: `calculateContrastRatio`, `isAccessible`, `suggestAccessibleColor`, `getContrastColor`
   - **Dependencies**: None
   - **Usage**: Theme generation, accessibility compliance

8. **i18n.js**
   - **Purpose**: Internationalization utilities
   - **Functions**: `translate`, `formatNumber`, `formatCurrency`, `getLocale`, `setLocale`
   - **Dependencies**: None
   - **Usage**: Multi-language support

9. **videoUtils.js**
   - **Purpose**: Video processing utilities
   - **Functions**: `compressVideo`, `extractThumbnail`, `getVideoDuration`, `convertFormat`
   - **Dependencies**: FFmpeg.wasm or similar
   - **Usage**: Video uploads, processing

10. **imageUtils.js**
    - **Purpose**: Image processing utilities
    - **Functions**: `resizeImage`, `cropImage`, `compressImage`, `convertFormat`, `getImageDimensions`
    - **Dependencies**: Canvas API, CompressorJS
    - **Usage**: Image uploads, optimization

### API & Networking (5)

11. **apiClient.js**
    - **Purpose**: HTTP client wrapper
    - **Functions**: `get`, `post`, `put`, `delete`, `uploadFile`, `setAuthToken`
    - **Dependencies**: Fetch API
    - **Usage**: API communication

12. **fetchOrCreateUser.js**
    - **Purpose**: User creation/fetching logic
    - **Functions**: `fetchOrCreateUser`, `syncUserProfile`
    - **Dependencies**: Supabase
    - **Usage**: Authentication flow

13. **createUserProfile.js**
    - **Purpose**: User profile creation utilities
    - **Functions**: `createProfile`, `initializeProfile`, `migrateLegacyProfile`
    - **Dependencies**: Supabase
    - **Usage**: User onboarding

14. **insertUser.js**
    - **Purpose**: User insertion utilities
    - **Functions**: `insertUser`, `validateUserData`, `handleUserCreation`
    - **Dependencies**: Supabase
    - **Usage**: Registration

15. **realtimeManager.js**
    - **Purpose**: Real-time connection management
    - **Functions**: `subscribeToChannel`, `unsubscribeFromChannel`, `broadcastMessage`
    - **Dependencies**: Supabase realtime
    - **Usage**: Live features

### Security & Authentication (8)

16. **authSecurityManager.js**
    - **Purpose**: Authentication security utilities
    - **Functions**: `hashPassword`, `verifyPassword`, `generateToken`, `validateToken`, `recordFailedAttempt`, `resetRateLimit`
    - **Dependencies**: Crypto APIs
    - **Usage**: Password management, token handling

17. **sessionManager.js**
    - **Purpose**: Session management
    - **Functions**: `createSession`, `validateSession`, `destroySession`, `refreshSession`
    - **Dependencies**: Local storage, Supabase
    - **Usage**: User sessions

18. **twoFactorAuth.js**
    - **Purpose**: 2FA utilities
    - **Functions**: `generateSecret`, `verifyToken`, `generateQRCode`, `enable2FA`, `disable2FA`
    - **Dependencies**: OTP Auth library
    - **Usage**: Two-factor authentication

19. **csrfProtection.js**
    - **Purpose**: CSRF protection utilities
    - **Functions**: `generateToken`, `validateToken`, `getProtectedHeaders`
    - **Dependencies**: Crypto APIs
    - **Usage**: Form security

20. **securityLogger.js**
    - **Purpose**: Security event logging
    - **Functions**: `logSecurityEvent`, `logFailedLogin`, `logSuspiciousActivity`
    - **Dependencies**: None (console/file logging)
    - **Usage**: Security monitoring

21. **deviceFingerprint.js**
    - **Purpose**: Device fingerprinting for security
    - **Functions**: `generateFingerprint`, `validateFingerprint`, `detectAnomaly`
    - **Dependencies**: Canvas API, WebGL
    - **Usage**: Fraud detection

22. **rateLimitManager.js**
    - **Purpose**: Rate limiting utilities
    - **Functions**: `checkRateLimit`, `recordRequest`, `getRemainingRequests`
    - **Dependencies**: Redis/memory storage
    - **Usage**: API protection

23. **rateLimiter.js**
    - **Purpose**: Client-side rate limiting
    - **Functions**: `canMakeRequest`, `waitForReset`, `getBackoffTime`
    - **Dependencies**: None
    - **Usage**: Request throttling

### Analytics & Tracking (4)

24. **analytics.js**
    - **Purpose**: Analytics and tracking utilities
    - **Functions**: `trackEvent`, `trackPageView`, `trackUserAction`, `getAnalyticsData`
    - **Dependencies**: Analytics service (Google Analytics, etc.)
    - **Usage**: User behavior tracking

### Media & Files (4)

28. **uploadFile.js**
    - **Purpose**: File upload utilities
    - **Functions**: `uploadToStorage`, `getUploadUrl`, `validateUpload`, `handleProgress`
    - **Dependencies**: Supabase storage
    - **Usage**: File uploads

29. **imageCompression.js**
    - **Purpose**: Image compression utilities
    - **Functions**: `compressImage`, `optimizeForWeb`, `getCompressionRatio`
    - **Dependencies**: CompressorJS
    - **Usage**: Image optimization

30. **signedUrlManager.js**
    - **Purpose**: Signed URL management
    - **Functions**: `generateSignedUrl`, `validateSignedUrl`, `refreshSignedUrl`
    - **Dependencies**: Supabase storage
    - **Usage**: Secure file access

31. **serviceWorkerManager.js**
    - **Purpose**: Service worker utilities
    - **Functions**: `registerWorker`, `updateWorker`, `handleMessages`
    - **Dependencies**: Service Worker API
    - **Usage**: Offline functionality

### Notifications & Communication (4)

32. **notificationService.js**
    - **Purpose**: Notification management
    - **Functions**: `sendNotification`, `scheduleNotification`, `cancelNotification`
    - **Dependencies**: Notification API, Supabase
    - **Usage**: Push notifications

33. **pushNotifications.js**
    - **Purpose**: Push notification utilities
    - **Functions**: `requestPermission`, `subscribeToPush`, `sendPushNotification`
    - **Dependencies**: Push API, service workers
    - **Usage**: Browser push notifications

34. **callNotifications.js**
    - **Purpose**: Call notification system
    - **Functions**: `notifyIncomingCall`, `notifyCallEnded`, `notifyMissedCall`
    - **Dependencies**: WebRTC, Notification API
    - **Usage**: Call notifications

35. **notificationPreferences.js**
    - **Purpose**: Notification preference management
    - **Functions**: `getPreferences`, `updatePreferences`, `filterNotifications`
    - **Dependencies**: Local storage
    - **Usage**: User preferences

### Error Handling & Logging (4)

36. **errorHandler.js**
    - **Purpose**: Error handling utilities
    - **Functions**: `handleError`, `logError`, `reportError`, `getErrorInfo`
    - **Dependencies**: Error reporting service
    - **Usage**: Error management

37. **errorTracking.js**
    - **Purpose**: Error tracking and reporting
    - **Functions**: `trackError`, `trackPerformance`, `generateReport`
    - **Dependencies**: Sentry or similar
    - **Usage**: Error monitoring

38. **errorLogger.js**
    - **Purpose**: Error logging utilities
    - **Functions**: `logToConsole`, `logToFile`, `logToService`
    - **Dependencies**: None
    - **Usage**: Development logging

39. **logger.js**
    - **Purpose**: General logging utilities
    - **Functions**: `log`, `warn`, `error`, `info`, `debug`
    - **Dependencies**: None
    - **Usage**: Application logging

### Caching & Performance (3)

40. **cacheManager.js**
    - **Purpose**: Caching utilities
    - **Functions**: `setCache`, `getCache`, `clearCache`, `isExpired`
    - **Dependencies**: Local storage, IndexedDB
    - **Usage**: Data caching

41. **feedCache.js**
    - **Purpose**: Feed-specific caching
    - **Functions**: `cacheFeed`, `getCachedFeed`, `invalidateFeed`
    - **Dependencies**: IndexedDB
    - **Usage**: Feed performance

42. **queryCache.js**
    - **Purpose**: Query result caching
    - **Functions**: `cacheQuery`, `getCachedQuery`, `invalidateQuery`
    - **Dependencies**: Memory cache
    - **Usage**: API response caching

### UI & UX Utilities (3)

43. **haptics.js**
    - **Purpose**: Haptic feedback utilities
    - **Functions**: `vibrate`, `provideFeedback`, `isSupported`
    - **Dependencies**: Vibration API
    - **Usage**: Mobile interactions

44. **browserCompatibility.js**
    - **Purpose**: Browser compatibility checks
    - **Functions**: `checkFeatureSupport`, `getBrowserInfo`, `isSupported`
    - **Dependencies**: Modernizr-like checks
    - **Usage**: Feature detection

45. **offlineManager.js**
    - **Purpose**: Offline functionality management
    - **Functions**: `isOnline`, `syncWhenOnline`, `queueRequests`
    - **Dependencies**: Navigator.onLine, Service Workers
    - **Usage**: Offline support

### Specialized Utilities (3)

46. **autoTester.js**
    - **Purpose**: Automated testing utilities
    - **Functions**: `runTests`, `generateReport`, `checkCoverage`
    - **Dependencies**: Testing frameworks
    - **Usage**: QA automation

47. **autoErrorFixer.js**
    - **Purpose**: Automatic error fixing
    - **Functions**: `analyzeError`, `suggestFix`, `applyFix`
    - **Dependencies**: AI services
    - **Usage**: Development assistance

48. **rlsPolicyTester.js**
    - **Purpose**: Row Level Security testing
    - **Functions**: `testPolicy`, `validateAccess`, `generateReport`
    - **Dependencies**: Supabase
    - **Usage**: Security testing

## Utils Architecture Issues

### Code Quality
- **Inconsistent exports**: Mix of named exports, default exports, and object exports
- **Missing documentation**: Many utilities lack JSDoc comments
- **Error handling**: Inconsistent error handling patterns
- **Testing gaps**: Only 3 utils have comprehensive tests

### Performance Concerns
- **Heavy dependencies**: Some utils import large libraries
- **Memory usage**: Caching utils may cause memory leaks
- **Bundle impact**: Large utils increase bundle size

### Security Considerations
- **Input validation**: Some utils may have validation gaps
- **Cryptographic operations**: Need review for security best practices
- **File handling**: File utils need security review

## Recommendations

### Immediate Actions
1. **Add comprehensive tests** for critical utilities
2. **Standardize export patterns** across all utils
3. **Add JSDoc documentation** to all functions
4. **Implement consistent error handling**

### Security Review
1. **Audit cryptographic functions** in security utils
2. **Review file handling** in upload/media utils
3. **Validate input sanitization** effectiveness
4. **Check for vulnerabilities** in dependencies

### Performance Optimization
1. **Lazy load heavy utilities** when possible
2. **Implement proper cleanup** in caching utils
3. **Optimize bundle size** by tree shaking
4. **Add performance monitoring**

### Architecture Improvements
1. **Create utility categories** with clear separation
2. **Implement dependency injection** for services
3. **Add TypeScript support** for better type safety
4. **Create utility composition** patterns

## Testing Status
- **Total utils**: 48
- **Tested utils**: 3 (6.25%)
- **Missing tests**: 45 utils
- **Test coverage**: Minimal

## Dependencies Analysis
- **External libraries**: CompressorJS, OTP Auth, various APIs
- **Browser APIs**: File API, Canvas API, WebRTC, Service Workers
- **Supabase integration**: 15+ utils depend on Supabase
- **AI/ML services**: Several utils depend on AI services

## Next Steps
1. Complete utility testing suite
2. Security audit of all utilities
3. Performance optimization
4. Documentation completion
5. TypeScript migration planning
