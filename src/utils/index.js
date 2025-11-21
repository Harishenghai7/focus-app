/**
 * Utils Barrel Export
 * 
 * Centralized export of all utility functions and modules
 * Enables easier imports: import { validation, analytics } from '@/utils'
 */

// Validation & Security
export * as validation from './validation';
export * as inputSanitizer from './inputSanitizer';
export * as csrfProtection from './csrfProtection';
export * as authSecurityManager from './authSecurityManager';
export * as deviceFingerprint from './deviceFingerprint';
export * as securityLogger from './securityLogger';
export * as twoFactorAuth from './twoFactorAuth';
export * as rlsPolicyTester from './rlsPolicyTester';

// API & HTTP
export * as apiClient from './apiClient';
export * as apiErrorHandler from './apiErrorHandler';
export * as callSignaling from './callSignaling';
export * as fetchOrCreateUser from './fetchOrCreateUser';
export * as insertUser from './insertUser';
export * as createUserProfile from './createUserProfile';
export * as signedUrlManager from './signedUrlManager';
export * as uploadFile from './uploadFile';
export * as webrtcService from './webrtcService';
export * as notificationService from './notificationService';
export * as pushNotifications from './pushNotifications';
export * as rateLimitManager from './rateLimitManager';

// Data & State Management
export { feedCache } from './feedCache';
export { queryCache } from './queryCache';
export { cacheManager } from './cacheManager';
export { stateDeduplicator } from './stateDeduplicator';
export { subscriptionManager } from './subscriptionManager';
export { sessionManager } from './sessionManager';
export { offlineManager } from './offlineManager';
export { draftManager } from './draftManager';
export { versionManager } from './versionManager';
export { NotificationManager } from './NotificationManager';

// Utilities & Helpers
export * as dateFormatter from './dateFormatter';
export * as imageUtils from './imageUtils';
export * as imageCompression from './imageCompression';
export * as videoUtils from './videoUtils';
export * as contentParser from './contentParser';
export * as linkifiedText from './linkifiedText';
export * as altTextGenerator from './altTextGenerator';
export * as lazyLoad from './lazyLoad';
export * as haptics from './haptics';
export * as browserCompatibility from './browserCompatibility';
export * as colorContrast from './colorContrast';
export * as accessibility from './accessibility';
export * as i18n from './i18n';
export * as logger from './logger';
export * as errorHandler from './errorHandler';

// Analytics & Tracking
export * as analytics from './analytics';
export * as errorTracking from './errorTracking';
export * as errorLogger from './errorLogger';
export * as reportWebVitals from './reportWebVitals';
export * as autoErrorFixer from './autoErrorFixer';

// Features & Services
export * as searchService from './searchService';
export * as trendingService from './trendingService';
export * as realtimeManager from './realtimeManager';
export * as serviceWorkerManager from './serviceWorkerManager';
export * as scheduledPostsPublisher from './scheduledPostsPublisher';
export * as notificationPreferences from './notificationPreferences';
export * as callNotifications from './callNotifications';
export * as rateLimiter from './rateLimiter';

// Auth & Other
export * as authListener from './authListener';
export * as logout from './logout';
