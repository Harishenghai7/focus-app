/**
 * Analytics Tracking Service
 * 
 * Purpose: Track user actions for analytics and insights
 * Supports: Page views, custom events, user identification
 * Integration: Plausible, Google Analytics, or custom analytics
 */

// Analytics configuration
const ANALYTICS_CONFIG = {
  enabled: process.env.REACT_APP_ANALYTICS_ENABLED !== 'false',
  debug: process.env.NODE_ENV === 'development',
  providers: {
    plausible: process.env.REACT_APP_PLAUSIBLE_DOMAIN || null,
    googleAnalytics: process.env.REACT_APP_GA_TRACKING_ID || null,
    custom: process.env.REACT_APP_CUSTOM_ANALYTICS_ENDPOINT || null
  }
};

/**
 * Track a page view
 * @param {string} pageName - Name of the page being viewed
 * @param {Object} additionalProps - Additional properties to track
 */
export const trackPageView = (pageName, additionalProps = {}) => {
  if (!ANALYTICS_CONFIG.enabled) {
    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics Debug] Page view:', pageName, additionalProps);
    }
    return;
  }

  try {
    const pageData = {
      page: pageName,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...additionalProps
    };

    // Plausible Analytics
    if (ANALYTICS_CONFIG.providers.plausible && window.plausible) {
      window.plausible('pageview', { props: pageData });
    }

    // Google Analytics
    if (ANALYTICS_CONFIG.providers.googleAnalytics && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalProps
      });
    }

    // Custom Analytics
    if (ANALYTICS_CONFIG.providers.custom) {
      sendToCustomAnalytics('pageview', pageData);
    }

    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics] Page view tracked:', pageName, pageData);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties and metadata
 */
export const trackEvent = (eventName, properties = {}) => {
  if (!ANALYTICS_CONFIG.enabled) {
    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics Debug] Event:', eventName, properties);
    }
    return;
  }

  try {
    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      path: window.location.pathname,
      ...properties
    };

    // Plausible Analytics
    if (ANALYTICS_CONFIG.providers.plausible && window.plausible) {
      window.plausible(eventName, { props: properties });
    }

    // Google Analytics
    if (ANALYTICS_CONFIG.providers.googleAnalytics && window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Custom Analytics
    if (ANALYTICS_CONFIG.providers.custom) {
      sendToCustomAnalytics('event', eventData);
    }

    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics] Event tracked:', eventName, eventData);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
};

/**
 * Track user identification and properties
 * @param {string|number} userId - User ID
 * @param {Object} userData - User properties and metadata
 */
export const trackUser = (userId, userData = {}) => {
  if (!ANALYTICS_CONFIG.enabled) {
    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics Debug] User identified:', userId, userData);
    }
    return;
  }

  try {
    const userInfo = {
      userId: userId,
      timestamp: new Date().toISOString(),
      ...userData
    };

    // Plausible Analytics (custom event for user identification)
    if (ANALYTICS_CONFIG.providers.plausible && window.plausible) {
      window.plausible('user_identified', { props: { userId, ...userData } });
    }

    // Google Analytics
    if (ANALYTICS_CONFIG.providers.googleAnalytics && window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        ...userData
      });
      window.gtag('event', 'user_identified', { userId, ...userData });
    }

    // Custom Analytics
    if (ANALYTICS_CONFIG.providers.custom) {
      sendToCustomAnalytics('identify', userInfo);
    }

    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics] User identified:', userId, userInfo);
    }
  } catch (error) {
    console.error('[Analytics] Error tracking user:', error);
  }
};

/**
 * Send data to custom analytics endpoint
 * @param {string} type - Type of analytics data (pageview, event, identify)
 * @param {Object} data - Analytics data to send
 */
const sendToCustomAnalytics = async (type, data) => {
  try {
    const endpoint = ANALYTICS_CONFIG.providers.custom;
    
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('[Analytics] Error sending to custom endpoint:', error);
  }
};

// ==============================================
// PREDEFINED EVENT TRACKERS
// ==============================================

/**
 * Track post-related events
 */
export const trackPostEvents = {
  created: (postId, postType = 'standard') => {
    trackEvent('post_created', {
      post_id: postId,
      post_type: postType
    });
  },
  
  liked: (postId, userId) => {
    trackEvent('post_liked', {
      post_id: postId,
      user_id: userId
    });
  },
  
  unliked: (postId, userId) => {
    trackEvent('post_unliked', {
      post_id: postId,
      user_id: userId
    });
  },
  
  shared: (postId, shareMethod) => {
    trackEvent('post_shared', {
      post_id: postId,
      share_method: shareMethod
    });
  },
  
  viewed: (postId, viewDuration) => {
    trackEvent('post_viewed', {
      post_id: postId,
      view_duration: viewDuration
    });
  },
  
  deleted: (postId) => {
    trackEvent('post_deleted', {
      post_id: postId
    });
  }
};

/**
 * Track comment-related events
 */
export const trackCommentEvents = {
  added: (commentId, postId) => {
    trackEvent('comment_added', {
      comment_id: commentId,
      post_id: postId
    });
  },
  
  edited: (commentId, postId) => {
    trackEvent('comment_edited', {
      comment_id: commentId,
      post_id: postId
    });
  },
  
  deleted: (commentId, postId) => {
    trackEvent('comment_deleted', {
      comment_id: commentId,
      post_id: postId
    });
  },
  
  liked: (commentId, userId) => {
    trackEvent('comment_liked', {
      comment_id: commentId,
      user_id: userId
    });
  }
};

/**
 * Track user interaction events
 */
export const trackUserEvents = {
  followed: (followedUserId, followingUserId) => {
    trackEvent('user_followed', {
      followed_user_id: followedUserId,
      following_user_id: followingUserId
    });
  },
  
  unfollowed: (unfollowedUserId, unfollowingUserId) => {
    trackEvent('user_unfollowed', {
      unfollowed_user_id: unfollowedUserId,
      unfollowing_user_id: unfollowingUserId
    });
  },
  
  profileViewed: (viewedUserId, viewerUserId) => {
    trackEvent('profile_viewed', {
      viewed_user_id: viewedUserId,
      viewer_user_id: viewerUserId
    });
  },
  
  profileUpdated: (userId, updatedFields) => {
    trackEvent('profile_updated', {
      user_id: userId,
      updated_fields: updatedFields
    });
  },
  
  blocked: (blockedUserId, blockerUserId) => {
    trackEvent('user_blocked', {
      blocked_user_id: blockedUserId,
      blocker_user_id: blockerUserId
    });
  }
};

/**
 * Track messaging events
 */
export const trackMessageEvents = {
  sent: (messageId, recipientId, messageType = 'text') => {
    trackEvent('message_sent', {
      message_id: messageId,
      recipient_id: recipientId,
      message_type: messageType
    });
  },
  
  received: (messageId, senderId) => {
    trackEvent('message_received', {
      message_id: messageId,
      sender_id: senderId
    });
  },
  
  read: (messageId, readerId) => {
    trackEvent('message_read', {
      message_id: messageId,
      reader_id: readerId
    });
  },
  
  conversationStarted: (conversationId, participantIds) => {
    trackEvent('conversation_started', {
      conversation_id: conversationId,
      participant_count: participantIds.length
    });
  }
};

/**
 * Track authentication events
 */
export const trackAuthEvents = {
  login: (userId, method = 'email') => {
    trackEvent('user_login', {
      user_id: userId,
      auth_method: method
    });
  },
  
  logout: (userId) => {
    trackEvent('user_logout', {
      user_id: userId
    });
  },
  
  signup: (userId, method = 'email') => {
    trackEvent('user_signup', {
      user_id: userId,
      signup_method: method
    });
  },
  
  passwordReset: (userId) => {
    trackEvent('password_reset', {
      user_id: userId
    });
  }
};

/**
 * Track search and discovery events
 */
export const trackSearchEvents = {
  performed: (query, resultCount) => {
    trackEvent('search_performed', {
      search_query: query,
      result_count: resultCount
    });
  },
  
  resultClicked: (query, resultId, resultPosition) => {
    trackEvent('search_result_clicked', {
      search_query: query,
      result_id: resultId,
      result_position: resultPosition
    });
  }
};

/**
 * Track engagement metrics
 */
export const trackEngagement = {
  sessionStart: () => {
    trackEvent('session_start', {
      referrer: document.referrer
    });
  },
  
  sessionEnd: (duration) => {
    trackEvent('session_end', {
      duration_seconds: duration
    });
  },
  
  timeOnPage: (pageName, duration) => {
    trackEvent('time_on_page', {
      page: pageName,
      duration_seconds: duration
    });
  },
  
  scrollDepth: (pageName, depth) => {
    trackEvent('scroll_depth', {
      page: pageName,
      depth_percentage: depth
    });
  }
};

/**
 * Track error events
 */
export const trackError = (errorType, errorMessage, errorContext = {}) => {
  trackEvent('error_occurred', {
    error_type: errorType,
    error_message: errorMessage,
    ...errorContext
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = (metricName, value, unit = 'ms') => {
  trackEvent('performance_metric', {
    metric_name: metricName,
    value: value,
    unit: unit
  });
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Initialize analytics tracking
 * Sets up event listeners and session tracking
 */
export const initAnalytics = () => {
  if (!ANALYTICS_CONFIG.enabled) {
    console.log('[Analytics] Analytics tracking is disabled');
    return;
  }

  // Track session start
  trackEngagement.sessionStart();

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      trackEvent('page_hidden');
    } else {
      trackEvent('page_visible');
    }
  });

  // Track session end on page unload
  window.addEventListener('beforeunload', () => {
    const sessionDuration = Math.round((Date.now() - window.performance.timing.navigationStart) / 1000);
    trackEngagement.sessionEnd(sessionDuration);
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Analytics initialized with config:', ANALYTICS_CONFIG);
  }
};

/**
 * Disable analytics tracking
 */
export const disableAnalytics = () => {
  ANALYTICS_CONFIG.enabled = false;
  console.log('[Analytics] Analytics tracking disabled');
};

/**
 * Enable analytics tracking
 */
export const enableAnalytics = () => {
  ANALYTICS_CONFIG.enabled = true;
  console.log('[Analytics] Analytics tracking enabled');
};

/**
 * Get current analytics configuration
 */
export const getAnalyticsConfig = () => {
  return { ...ANALYTICS_CONFIG };
};

// Default export with all tracking functions
export default {
  trackPageView,
  trackEvent,
  trackUser,
  initAnalytics,
  disableAnalytics,
  enableAnalytics,
  getAnalyticsConfig,
  
  // Event trackers
  post: trackPostEvents,
  comment: trackCommentEvents,
  user: trackUserEvents,
  message: trackMessageEvents,
  auth: trackAuthEvents,
  search: trackSearchEvents,
  engagement: trackEngagement,
  
  // Utility trackers
  trackError,
  trackPerformance
};
