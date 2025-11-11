/**
 * Comprehensive Rate Limiting Manager
 * Implements rate limiting for various actions to prevent abuse
 */

/**
 * Rate limit configurations for different actions
 */
export const RATE_LIMITS = {
  // Authentication
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again in 1 hour.'
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests. Please try again in 1 hour.'
  },

  // Content creation
  POST_CREATE: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 5 posts per hour
    message: 'You can only create 5 posts per hour. Please try again later.'
  },
  BOLTZ_CREATE: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 10 boltz per hour
    message: 'You can only create 10 boltz per hour. Please try again later.'
  },
  FLASH_CREATE: {
    maxAttempts: 20,
    windowMs: 60 * 60 * 1000, // 20 flashes per hour
    message: 'You can only create 20 flashes per hour. Please try again later.'
  },

  // Interactions
  COMMENT: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 10 comments per minute
    message: 'You\'re commenting too fast. Please slow down.'
  },
  LIKE: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 100 likes per minute
    message: 'You\'re liking too fast. Please slow down.'
  },
  FOLLOW: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 20 follows per minute
    message: 'You\'re following too fast. Please slow down.'
  },

  // Messaging
  MESSAGE: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 30 messages per minute
    message: 'You\'re sending messages too fast. Please slow down.'
  },
  GROUP_CREATE: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 5 groups per hour
    message: 'You can only create 5 groups per hour. Please try again later.'
  },

  // Search and discovery
  SEARCH: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 30 searches per minute
    message: 'You\'re searching too fast. Please slow down.'
  },

  // Profile updates
  PROFILE_UPDATE: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 10 updates per hour
    message: 'You can only update your profile 10 times per hour.'
  },

  // Reports
  REPORT: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 10 reports per hour
    message: 'You can only submit 10 reports per hour.'
  }
};

/**
 * Storage key prefix for rate limit data
 */
const STORAGE_PREFIX = 'rate_limit_';

/**
 * Get rate limit data from storage
 * @param {string} action - Action type
 * @param {string} identifier - User identifier (user ID or IP)
 * @returns {Object} Rate limit data
 */
const getRateLimitData = (action, identifier) => {
  try {
    const key = `${STORAGE_PREFIX}${action}_${identifier}`;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return { attempts: [], firstAttempt: null };
    }

    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error('Error reading rate limit data:', error);
    return { attempts: [], firstAttempt: null };
  }
};

/**
 * Save rate limit data to storage
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 * @param {Object} data - Rate limit data
 */
const saveRateLimitData = (action, identifier, data) => {
  try {
    const key = `${STORAGE_PREFIX}${action}_${identifier}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving rate limit data:', error);
  }
};

/**
 * Clean up old attempts outside the time window
 * @param {Array} attempts - Array of attempt timestamps
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Array} Cleaned attempts array
 */
const cleanOldAttempts = (attempts, windowMs) => {
  const now = Date.now();
  return attempts.filter(timestamp => now - timestamp < windowMs);
};

/**
 * Check if action is rate limited
 * @param {string} action - Action type (e.g., 'COMMENT', 'POST_CREATE')
 * @param {string} identifier - User identifier (user ID or IP)
 * @returns {Object} Rate limit status
 */
export const checkRateLimit = (action, identifier) => {
  if (!action || !identifier) {
    return {
      allowed: true,
      remaining: 0,
      resetAt: null
    };
  }

  const config = RATE_LIMITS[action];
  if (!config) {
    console.warn(`No rate limit configuration for action: ${action}`);
    return {
      allowed: true,
      remaining: 0,
      resetAt: null
    };
  }

  const data = getRateLimitData(action, identifier);
  const cleanedAttempts = cleanOldAttempts(data.attempts, config.windowMs);

  // Check if limit exceeded
  if (cleanedAttempts.length >= config.maxAttempts) {
    const oldestAttempt = Math.min(...cleanedAttempts);
    const resetAt = new Date(oldestAttempt + config.windowMs);
    const remainingMs = resetAt.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      remainingMinutes,
      message: config.message,
      retryAfter: remainingMs
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - cleanedAttempts.length,
    resetAt: cleanedAttempts.length > 0 
      ? new Date(Math.min(...cleanedAttempts) + config.windowMs)
      : null
  };
};

/**
 * Record an attempt for rate limiting
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 * @returns {Object} Updated rate limit status
 */
export const recordAttempt = (action, identifier) => {
  if (!action || !identifier) {
    return { allowed: true, remaining: 0 };
  }

  const config = RATE_LIMITS[action];
  if (!config) {
    return { allowed: true, remaining: 0 };
  }

  const data = getRateLimitData(action, identifier);
  const cleanedAttempts = cleanOldAttempts(data.attempts, config.windowMs);
  
  // Add new attempt
  const now = Date.now();
  cleanedAttempts.push(now);

  // Save updated data
  saveRateLimitData(action, identifier, {
    attempts: cleanedAttempts,
    firstAttempt: cleanedAttempts[0]
  });

  // Check if now limited
  if (cleanedAttempts.length >= config.maxAttempts) {
    const resetAt = new Date(cleanedAttempts[0] + config.windowMs);
    const remainingMs = resetAt.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      remainingMinutes,
      message: config.message,
      retryAfter: remainingMs
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - cleanedAttempts.length,
    resetAt: new Date(cleanedAttempts[0] + config.windowMs)
  };
};

/**
 * Reset rate limit for a specific action and identifier
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 */
export const resetRateLimit = (action, identifier) => {
  if (!action || !identifier) return;

  try {
    const key = `${STORAGE_PREFIX}${action}_${identifier}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};

/**
 * Clear all rate limits for an identifier
 * @param {string} identifier - User identifier
 */
export const clearAllRateLimits = (identifier) => {
  if (!identifier) return;

  try {
    Object.keys(RATE_LIMITS).forEach(action => {
      resetRateLimit(action, identifier);
    });
  } catch (error) {
    console.error('Error clearing rate limits:', error);
  }
};

/**
 * Get formatted rate limit message
 * @param {Object} status - Rate limit status
 * @returns {string} Formatted message
 */
export const getRateLimitMessage = (status) => {
  if (!status || status.allowed) {
    return '';
  }

  if (status.message) {
    return status.message;
  }

  if (status.remainingMinutes) {
    return `Rate limit exceeded. Please try again in ${status.remainingMinutes} minute${status.remainingMinutes !== 1 ? 's' : ''}.`;
  }

  return 'Rate limit exceeded. Please try again later.';
};

/**
 * Create a rate limit middleware for API calls
 * @param {string} action - Action type
 * @returns {Function} Middleware function
 */
export const createRateLimitMiddleware = (action) => {
  return async (identifier, callback) => {
    // Check rate limit
    const status = checkRateLimit(action, identifier);

    if (!status.allowed) {
      throw new Error(getRateLimitMessage(status));
    }

    try {
      // Execute the callback
      const result = await callback();

      // Record successful attempt
      recordAttempt(action, identifier);

      return result;
    } catch (error) {
      // Still record attempt even on error to prevent retry spam
      recordAttempt(action, identifier);
      throw error;
    }
  };
};

/**
 * Get rate limit status for multiple actions
 * @param {Array<string>} actions - Array of action types
 * @param {string} identifier - User identifier
 * @returns {Object} Status for each action
 */
export const getRateLimitStatus = (actions, identifier) => {
  const status = {};

  actions.forEach(action => {
    status[action] = checkRateLimit(action, identifier);
  });

  return status;
};

/**
 * Check if user is being rate limited for any action
 * @param {string} identifier - User identifier
 * @returns {Object} Overall rate limit status
 */
export const isRateLimited = (identifier) => {
  const actions = Object.keys(RATE_LIMITS);
  const limitedActions = [];

  actions.forEach(action => {
    const status = checkRateLimit(action, identifier);
    if (!status.allowed) {
      limitedActions.push({
        action,
        ...status
      });
    }
  });

  return {
    isLimited: limitedActions.length > 0,
    limitedActions,
    count: limitedActions.length
  };
};

/**
 * Display rate limit warning when approaching limit
 * @param {Object} status - Rate limit status
 * @param {number} warningThreshold - Percentage threshold for warning (default 80%)
 * @returns {Object|null} Warning object or null
 */
export const getRateLimitWarning = (status, warningThreshold = 0.8) => {
  if (!status || !status.allowed) return null;

  const config = RATE_LIMITS[status.action];
  if (!config) return null;

  const usagePercent = (config.maxAttempts - status.remaining) / config.maxAttempts;

  if (usagePercent >= warningThreshold) {
    return {
      show: true,
      message: `You have ${status.remaining} ${status.action.toLowerCase()} attempts remaining.`,
      remaining: status.remaining,
      usagePercent: Math.round(usagePercent * 100)
    };
  }

  return null;
};

/**
 * Log rate limit violation
 * @param {string} action - Action type
 * @param {string} identifier - User identifier
 * @param {Object} context - Additional context
 */
export const logRateLimitViolation = (action, identifier, context = {}) => {
  const violation = {
    action,
    identifier: identifier?.substring(0, 8) + '...', // Partial identifier for privacy
    timestamp: new Date().toISOString(),
    ...context
  };

  console.warn('⚠️ Rate Limit Violation:', violation);

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && window.analytics) {
    window.analytics.track('rate_limit_violation', violation);
  }
};

export default {
  RATE_LIMITS,
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitMessage,
  createRateLimitMiddleware,
  getRateLimitStatus,
  isRateLimited,
  getRateLimitWarning,
  logRateLimitViolation
};
