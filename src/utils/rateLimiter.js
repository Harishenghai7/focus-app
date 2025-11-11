/**
 * Rate Limiter for authentication attempts
 * Tracks failed login attempts and implements lockout mechanism
 */

const STORAGE_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Gets the rate limit data for a specific identifier (email or IP)
 * @param {string} identifier - Email or IP address
 * @returns {Object} Rate limit data
 */
const getRateLimitData = (identifier) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    
    const parsed = JSON.parse(data);
    return parsed[identifier] || { attempts: 0, lockedUntil: null };
  } catch (error) {
    console.error('Error reading rate limit data:', error);
    return { attempts: 0, lockedUntil: null };
  }
};

/**
 * Saves rate limit data for a specific identifier
 * @param {string} identifier - Email or IP address
 * @param {Object} limitData - Rate limit data to save
 */
const saveRateLimitData = (identifier, limitData) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    parsed[identifier] = limitData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error('Error saving rate limit data:', error);
  }
};

/**
 * Checks if an identifier is currently locked out
 * @param {string} identifier - Email or IP address
 * @returns {Object} Lock status and remaining time
 */
export const checkRateLimit = (identifier) => {
  if (!identifier) {
    return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  const limitData = getRateLimitData(identifier);
  
  // Check if locked
  if (limitData.lockedUntil) {
    const now = Date.now();
    
    if (now < limitData.lockedUntil) {
      const remainingMs = limitData.lockedUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      
      return {
        isLocked: true,
        remainingAttempts: 0,
        remainingMinutes,
        lockedUntil: new Date(limitData.lockedUntil)
      };
    } else {
      // Lockout expired, reset
      saveRateLimitData(identifier, { attempts: 0, lockedUntil: null });
      return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };
    }
  }
  
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - limitData.attempts);
  
  return {
    isLocked: false,
    remainingAttempts,
    attempts: limitData.attempts
  };
};

/**
 * Records a failed login attempt
 * @param {string} identifier - Email or IP address
 * @returns {Object} Updated rate limit status
 */
export const recordFailedAttempt = (identifier) => {
  if (!identifier) return { isLocked: false, remainingAttempts: MAX_ATTEMPTS };

  const limitData = getRateLimitData(identifier);
  const newAttempts = limitData.attempts + 1;
  
  if (newAttempts >= MAX_ATTEMPTS) {
    // Lock the account
    const lockedUntil = Date.now() + LOCKOUT_DURATION;
    saveRateLimitData(identifier, {
      attempts: newAttempts,
      lockedUntil,
      firstAttemptAt: limitData.firstAttemptAt || Date.now()
    });
    
    return {
      isLocked: true,
      remainingAttempts: 0,
      remainingMinutes: Math.ceil(LOCKOUT_DURATION / 60000),
      lockedUntil: new Date(lockedUntil)
    };
  }
  
  // Record the attempt
  saveRateLimitData(identifier, {
    attempts: newAttempts,
    lockedUntil: null,
    firstAttemptAt: limitData.firstAttemptAt || Date.now(),
    lastAttemptAt: Date.now()
  });
  
  return {
    isLocked: false,
    remainingAttempts: MAX_ATTEMPTS - newAttempts,
    attempts: newAttempts
  };
};

/**
 * Resets the rate limit for an identifier (on successful login)
 * @param {string} identifier - Email or IP address
 */
export const resetRateLimit = (identifier) => {
  if (!identifier) return;
  
  saveRateLimitData(identifier, { attempts: 0, lockedUntil: null });
};

/**
 * Clears all rate limit data (for testing or admin purposes)
 */
export const clearAllRateLimits = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing rate limits:', error);
  }
};

/**
 * Gets a formatted message for rate limit status
 * @param {Object} status - Rate limit status from checkRateLimit
 * @returns {string} User-friendly message
 */
export const getRateLimitMessage = (status) => {
  if (status.isLocked) {
    return `Too many failed attempts. Please try again in ${status.remainingMinutes} minute${status.remainingMinutes !== 1 ? 's' : ''}.`;
  }
  
  if (status.remainingAttempts <= 2 && status.remainingAttempts > 0) {
    return `Warning: ${status.remainingAttempts} attempt${status.remainingAttempts !== 1 ? 's' : ''} remaining before 15-minute lockout.`;
  }
  
  return '';
};

export default {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitMessage,
  MAX_ATTEMPTS,
  LOCKOUT_DURATION
};
