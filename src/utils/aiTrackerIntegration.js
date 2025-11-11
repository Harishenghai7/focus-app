/**
 * AI Tracker Integration - Automatic tracking for Focus app features
 */

import { aiTracker } from './aiTracker';

// Track social media interactions
export const trackSocialInteraction = (type, data) => {
  aiTracker.trackCustomEvent(`social_${type}`, {
    ...data,
    timestamp: Date.now(),
    feature: 'social_media'
  });
};

// Track post interactions
export const trackPostInteraction = (action, postData) => {
  aiTracker.trackCustomEvent(`post_${action}`, {
    postId: postData.id,
    postType: postData.content_type || 'post',
    hasMedia: !!(postData.image_url || postData.video_url),
    isCarousel: postData.is_carousel,
    timestamp: Date.now()
  });
};

// Track navigation patterns
export const trackNavigation = (from, to, method = 'click') => {
  aiTracker.trackCustomEvent('navigation', {
    from,
    to,
    method,
    timestamp: Date.now()
  });
};

// Track feature usage
export const trackFeatureUsage = (featureName, context = {}) => {
  aiTracker.trackCustomEvent(`feature_${featureName}`, {
    ...context,
    timestamp: Date.now(),
    url: window.location.pathname
  });
};

// Track user engagement
export const trackEngagement = (type, duration, data = {}) => {
  aiTracker.trackCustomEvent(`engagement_${type}`, {
    duration,
    ...data,
    timestamp: Date.now()
  });
};

// Track errors and issues
export const trackError = (errorType, errorData) => {
  aiTracker.trackCustomEvent(`error_${errorType}`, {
    ...errorData,
    timestamp: Date.now(),
    url: window.location.pathname,
    userAgent: navigator.userAgent
  });
};

// Track performance metrics
export const trackPerformance = (operation, duration, success = true) => {
  aiTracker.trackCustomEvent(`performance_${operation}`, {
    duration,
    success,
    timestamp: Date.now(),
    url: window.location.pathname
  });
};

// Track user preferences
export const trackPreference = (setting, value, previous = null) => {
  aiTracker.trackCustomEvent('preference_change', {
    setting,
    value,
    previous,
    timestamp: Date.now()
  });
};

// Track search behavior
export const trackSearch = (query, results, filters = {}) => {
  aiTracker.trackCustomEvent('search', {
    query: query.substring(0, 100), // Limit query length for privacy
    resultCount: results,
    filters,
    timestamp: Date.now()
  });
};

// Track content creation
export const trackContentCreation = (contentType, metadata = {}) => {
  aiTracker.trackCustomEvent(`create_${contentType}`, {
    ...metadata,
    timestamp: Date.now()
  });
};

// Track messaging behavior
export const trackMessaging = (action, context = {}) => {
  aiTracker.trackCustomEvent(`messaging_${action}`, {
    ...context,
    timestamp: Date.now()
  });
};

// Track call behavior
export const trackCall = (action, callData = {}) => {
  aiTracker.trackCustomEvent(`call_${action}`, {
    ...callData,
    timestamp: Date.now()
  });
};

// Set user context for tracking
export const setUserContext = (userId, userProfile = {}) => {
  aiTracker.setUserId(userId);
  aiTracker.trackCustomEvent('user_context_set', {
    userId,
    profile: {
      hasAvatar: !!userProfile.avatar_url,
      isPrivate: userProfile.is_private,
      followersCount: userProfile.followers_count,
      followingCount: userProfile.following_count
    },
    timestamp: Date.now()
  });
};

export default {
  trackSocialInteraction,
  trackPostInteraction,
  trackNavigation,
  trackFeatureUsage,
  trackEngagement,
  trackError,
  trackPerformance,
  trackPreference,
  trackSearch,
  trackContentCreation,
  trackMessaging,
  trackCall,
  setUserContext
};