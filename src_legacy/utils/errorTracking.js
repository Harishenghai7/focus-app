/**
 * Error Tracking Service
 * Integrates with Sentry for error monitoring and reporting
 */

import * as Sentry from '@sentry/react';

// Check if error tracking is enabled
const isEnabled = () => {
  return (
    process.env.REACT_APP_ENV === 'production' &&
    process.env.REACT_APP_SENTRY_DSN
  );
};

/**
 * Initialize error tracking
 */
export const initializeErrorTracking = () => {
  if (!isEnabled()) {
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.REACT_APP_ENV || 'production',
      release: `focus@${process.env.REACT_APP_VERSION || '0.1.0'}`,
      
      // Performance monitoring
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out certain errors
        const error = hint.originalException;
        
        // Ignore network errors in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        
        // Ignore specific error messages
        const ignoredMessages = [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          'Network request failed',
        ];
        
        if (error && error.message) {
          for (const msg of ignoredMessages) {
            if (error.message.includes(msg)) {
              return null;
            }
          }
        }
        
        // Add user context if available
        const userStr = localStorage.getItem('focus_user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            event.user = {
              id: user.id,
              email: user.email,
              username: user.username,
            };
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        return event;
      },
      
      // Breadcrumbs
      beforeBreadcrumb(breadcrumb, hint) {
        // Filter sensitive data from breadcrumbs
        if (breadcrumb.category === 'console') {
          return null;
        }
        
        // Remove sensitive data from URLs
        if (breadcrumb.data && breadcrumb.data.url) {
          breadcrumb.data.url = breadcrumb.data.url.replace(/token=[^&]+/, 'token=***');
        }
        
        return breadcrumb;
      },
    });
  } catch (error) {
  }
};

/**
 * Capture an exception
 */
export const captureException = (error, context = {}) => {
  if (!isEnabled()) {
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

/**
 * Capture a message
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!isEnabled()) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
};

/**
 * Set user context
 */
export const setUser = (user) => {
  if (!isEnabled()) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb
 */
export const addBreadcrumb = (breadcrumb) => {
  if (!isEnabled()) return;

  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set context
 */
export const setContext = (name, context) => {
  if (!isEnabled()) return;

  Sentry.setContext(name, context);
};

/**
 * Set tag
 */
export const setTag = (key, value) => {
  if (!isEnabled()) return;

  Sentry.setTag(key, value);
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name, op = 'custom') => {
  if (!isEnabled()) {
    return {
      finish: () => {},
      setStatus: () => {},
      setData: () => {},
    };
  }

  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Wrap a function with error tracking
 */
export const wrapFunction = (fn, name) => {
  if (!isEnabled()) return fn;

  return (...args) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.catch((error) => {
          captureException(error, {
            function: name,
            args: args.map(arg => typeof arg),
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      captureException(error, {
        function: name,
        args: args.map(arg => typeof arg),
      });
      throw error;
    }
  };
};

/**
 * Track API call
 */
export const trackAPICall = (endpoint, method, duration, status) => {
  if (!isEnabled()) return;

  addBreadcrumb({
    category: 'api',
    message: `${method} ${endpoint}`,
    level: status >= 400 ? 'error' : 'info',
    data: {
      endpoint,
      method,
      duration,
      status,
    },
  });

  if (status >= 400) {
    captureMessage(`API Error: ${method} ${endpoint}`, 'error', {
      endpoint,
      method,
      status,
      duration,
    });
  }
};

/**
 * Track user action
 */
export const trackUserAction = (action, data = {}) => {
  if (!isEnabled()) return;

  addBreadcrumb({
    category: 'user-action',
    message: action,
    level: 'info',
    data,
  });
};

/**
 * Track navigation
 */
export const trackNavigation = (from, to) => {
  if (!isEnabled()) return;

  addBreadcrumb({
    category: 'navigation',
    message: `Navigate from ${from} to ${to}`,
    level: 'info',
    data: { from, to },
  });
};

/**
 * Get error tracking status
 */
export const getStatus = () => {
  return {
    enabled: isEnabled(),
    dsn: process.env.REACT_APP_SENTRY_DSN ? '***configured***' : 'not configured',
    environment: process.env.REACT_APP_ENV || 'development',
  };
};

/**
 * Track performance metrics
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {object} tags - Additional tags
 */
export const trackPerformance = (name, value, tags = {}) => {
  if (!isEnabled()) return;
  
  try {
    Sentry.metrics.distribution(name, value, {
      tags,
      unit: 'millisecond',
    });
  } catch (error) {
  }
};

export default {
  initialize: initializeErrorTracking,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  trackPerformance,
  setContext,
  setTag,
  startTransaction,
  wrapFunction,
  trackAPICall,
  trackUserAction,
  trackNavigation,
  getStatus,
};
