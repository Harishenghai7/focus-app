/**
 * Analytics Service
 * Tracks user engagement, feature usage, and performance metrics
 */

// Check if analytics is enabled
const isEnabled = () => {
  return (
    process.env.REACT_APP_ENV === 'production' &&
    process.env.REACT_APP_ANALYTICS_ID
  );
};

// Analytics provider (Google Analytics, Mixpanel, etc.)
let analyticsProvider = null;

/**
 * Initialize analytics
 */
export const initializeAnalytics = () => {
  if (!isEnabled()) {
    return;
  }

  try {
    const analyticsId = process.env.REACT_APP_ANALYTICS_ID;
    
    // Initialize Google Analytics 4
    if (analyticsId.startsWith('G-')) {
      initializeGA4(analyticsId);
    }
  } catch (error) {
  }
};

/**
 * Initialize Google Analytics 4
 */
const initializeGA4 = (measurementId) => {
  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', measurementId, {
    send_page_view: false, // We'll send manually
    anonymize_ip: true,
  });

  analyticsProvider = 'ga4';
};

/**
 * Track page view
 */
export const trackPageView = (path, title) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      });
    }
  } catch (error) {
  }
};

/**
 * Track event
 */
export const trackEvent = (category, action, label, value) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  } catch (error) {
  }
};

/**
 * Track user engagement
 */
export const trackEngagement = (action, data = {}) => {
  trackEvent('engagement', action, JSON.stringify(data));
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (feature, action, data = {}) => {
  trackEvent('feature', `${feature}_${action}`, JSON.stringify(data));
};

/**
 * Track conversion
 */
export const trackConversion = (conversionType, value = 0) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('event', 'conversion', {
        conversion_type: conversionType,
        value: value,
      });
    }
  } catch (error) {
  }
};

/**
 * Track user signup
 */
export const trackSignup = (method) => {
  trackConversion('signup', 1);
  trackEvent('auth', 'signup', method);
};

/**
 * Track user login
 */
export const trackLogin = (method) => {
  trackEvent('auth', 'login', method);
};

/**
 * Track post creation
 */
export const trackPostCreation = (type, mediaCount) => {
  trackFeatureUsage('post', 'create', { type, mediaCount });
  trackConversion('post_created', 1);
};

/**
 * Track interaction
 */
export const trackInteraction = (type, contentType) => {
  trackFeatureUsage('interaction', type, { contentType });
};

/**
 * Track message sent
 */
export const trackMessageSent = (conversationType) => {
  trackFeatureUsage('messaging', 'send', { conversationType });
};

/**
 * Track call initiated
 */
export const trackCallInitiated = (callType) => {
  trackFeatureUsage('calls', 'initiate', { callType });
};

/**
 * Track search
 */
export const trackSearch = (query, resultCount) => {
  trackFeatureUsage('search', 'query', { query, resultCount });
};

/**
 * Track profile view
 */
export const trackProfileView = (userId, isOwnProfile) => {
  trackFeatureUsage('profile', 'view', { userId, isOwnProfile });
};

/**
 * Track settings change
 */
export const trackSettingsChange = (setting, value) => {
  trackFeatureUsage('settings', 'change', { setting, value });
};

/**
 * Track error
 */
export const trackError = (errorType, errorMessage) => {
  trackEvent('error', errorType, errorMessage);
};

/**
 * Track performance metric
 */
export const trackPerformance = (metric, value) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value),
        event_category: 'performance',
      });
    }
  } catch (error) {
  }
};

/**
 * Track Web Vitals
 */
export const trackWebVitals = ({ name, value, id }) => {
  trackPerformance(name, value);
};

/**
 * Set user properties
 */
export const setUserProperties = (properties) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }
  } catch (error) {
  }
};

/**
 * Set user ID
 */
export const setUserId = (userId) => {
  if (!isEnabled()) return;

  try {
    if (analyticsProvider === 'ga4' && window.gtag) {
      window.gtag('config', process.env.REACT_APP_ANALYTICS_ID, {
        user_id: userId,
      });
    }
  } catch (error) {
  }
};

/**
 * Track session start
 */
export const trackSessionStart = () => {
  trackEvent('session', 'start', new Date().toISOString());
};

/**
 * Track session end
 */
export const trackSessionEnd = (duration) => {
  trackEvent('session', 'end', 'duration', duration);
};

/**
 * Track funnel step
 */
export const trackFunnelStep = (funnelName, stepName, stepNumber) => {
  trackEvent('funnel', `${funnelName}_${stepName}`, `step_${stepNumber}`);
};

/**
 * Onboarding funnel
 */
export const trackOnboardingStep = (step) => {
  const steps = {
    start: 1,
    username: 2,
    profile_info: 3,
    avatar: 4,
    complete: 5,
  };
  
  trackFunnelStep('onboarding', step, steps[step] || 0);
};

/**
 * Post creation funnel
 */
export const trackPostCreationStep = (step) => {
  const steps = {
    start: 1,
    media_select: 2,
    media_edit: 3,
    caption: 4,
    publish: 5,
  };
  
  trackFunnelStep('post_creation', step, steps[step] || 0);
};

/**
 * Track A/B test variant
 */
export const trackABTest = (testName, variant) => {
  setUserProperties({
    [`ab_test_${testName}`]: variant,
  });
  
  trackEvent('ab_test', testName, variant);
};

/**
 * Track retention
 */
export const trackRetention = (daysSinceSignup) => {
  trackEvent('retention', 'active_user', `day_${daysSinceSignup}`);
};

/**
 * Track feature adoption
 */
export const trackFeatureAdoption = (feature, isFirstTime) => {
  trackEvent('adoption', feature, isFirstTime ? 'first_use' : 'repeat_use');
};

/**
 * Get analytics status
 */
export const getAnalyticsStatus = () => {
  return {
    enabled: isEnabled(),
    provider: analyticsProvider,
    analyticsId: process.env.REACT_APP_ANALYTICS_ID ? '***configured***' : 'not configured',
  };
};

/**
 * Opt out of analytics
 */
export const optOutAnalytics = () => {
  if (analyticsProvider === 'ga4') {
    window[`ga-disable-${process.env.REACT_APP_ANALYTICS_ID}`] = true;
  }
  
  localStorage.setItem('focus_analytics_opt_out', 'true');
};

/**
 * Check if user opted out
 */
export const hasOptedOut = () => {
  return localStorage.getItem('focus_analytics_opt_out') === 'true';
};

export default {
  initialize: initializeAnalytics,
  trackPageView,
  trackEvent,
  trackEngagement,
  trackFeatureUsage,
  trackConversion,
  trackSignup,
  trackLogin,
  trackPostCreation,
  trackInteraction,
  trackMessageSent,
  trackCallInitiated,
  trackSearch,
  trackProfileView,
  trackSettingsChange,
  trackError,
  trackPerformance,
  trackWebVitals,
  setUserProperties,
  setUserId,
  trackSessionStart,
  trackSessionEnd,
  trackFunnelStep,
  trackOnboardingStep,
  trackPostCreationStep,
  trackABTest,
  trackRetention,
  trackFeatureAdoption,
  getAnalyticsStatus,
  optOutAnalytics,
  hasOptedOut,
};
