/**
 * React Hook for Rate Limiting
 * Provides easy integration of rate limiting in React components
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  checkRateLimit,
  recordAttempt,
  getRateLimitMessage,
  getRateLimitWarning,
  logRateLimitViolation
} from '../utils/rateLimitManager';

/**
 * Hook for rate limiting actions
 * @param {string} action - Action type (e.g., 'COMMENT', 'POST_CREATE')
 * @param {Object} options - Hook options
 * @returns {Object} Rate limit state and functions
 */
export const useRateLimit = (action, options = {}) => {
  const { user } = useAuth();
  const {
    onLimitExceeded = null,
    showWarning = true,
    warningThreshold = 0.8
  } = options;

  const [status, setStatus] = useState({
    allowed: true,
    remaining: 0,
    resetAt: null,
    message: ''
  });

  const [warning, setWarning] = useState(null);

  // Get user identifier (user ID or fallback to session ID)
  const getIdentifier = useCallback(() => {
    if (user?.id) return user.id;
    
    // Fallback to session-based identifier
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }, [user]);

  // Check rate limit status
  const checkLimit = useCallback(() => {
    const identifier = getIdentifier();
    const limitStatus = checkRateLimit(action, identifier);
    
    setStatus({
      allowed: limitStatus.allowed,
      remaining: limitStatus.remaining,
      resetAt: limitStatus.resetAt,
      message: limitStatus.message || '',
      remainingMinutes: limitStatus.remainingMinutes
    });

    // Check for warning
    if (showWarning && limitStatus.allowed) {
      const warningStatus = getRateLimitWarning(
        { ...limitStatus, action },
        warningThreshold
      );
      setWarning(warningStatus);
    }

    return limitStatus;
  }, [action, getIdentifier, showWarning, warningThreshold]);

  // Execute action with rate limiting
  const executeWithLimit = useCallback(async (callback) => {
    const identifier = getIdentifier();
    const limitStatus = checkRateLimit(action, identifier);

    if (!limitStatus.allowed) {
      const message = getRateLimitMessage(limitStatus);
      
      // Log violation
      logRateLimitViolation(action, identifier);

      // Call onLimitExceeded callback if provided
      if (onLimitExceeded) {
        onLimitExceeded(limitStatus);
      }

      // Update status
      setStatus({
        allowed: false,
        remaining: 0,
        resetAt: limitStatus.resetAt,
        message,
        remainingMinutes: limitStatus.remainingMinutes
      });

      throw new Error(message);
    }

    try {
      // Execute the callback
      const result = await callback();

      // Record attempt
      const newStatus = recordAttempt(action, identifier);
      
      setStatus({
        allowed: newStatus.allowed,
        remaining: newStatus.remaining,
        resetAt: newStatus.resetAt,
        message: newStatus.message || ''
      });

      // Check for warning after recording
      if (showWarning && newStatus.allowed) {
        const warningStatus = getRateLimitWarning(
          { ...newStatus, action },
          warningThreshold
        );
        setWarning(warningStatus);
      }

      return result;
    } catch (error) {
      // Still record attempt even on error
      recordAttempt(action, identifier);
      throw error;
    }
  }, [action, getIdentifier, onLimitExceeded, showWarning, warningThreshold]);

  // Check status on mount and when action changes
  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return {
    // Status
    allowed: status.allowed,
    remaining: status.remaining,
    resetAt: status.resetAt,
    message: status.message,
    remainingMinutes: status.remainingMinutes,
    
    // Warning
    warning,
    
    // Functions
    executeWithLimit,
    checkLimit
  };
};

/**
 * Hook for displaying rate limit errors
 * @returns {Object} Error display state and functions
 */
export const useRateLimitError = () => {
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  const displayError = useCallback((message, duration = 5000) => {
    setError(message);
    setShowError(true);

    if (duration > 0) {
      setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(null), 300); // Clear after fade out
      }, duration);
    }
  }, []);

  const clearError = useCallback(() => {
    setShowError(false);
    setTimeout(() => setError(null), 300);
  }, []);

  return {
    error,
    showError,
    displayError,
    clearError
  };
};

/**
 * Hook for monitoring multiple rate limits
 * @param {Array<string>} actions - Array of action types to monitor
 * @returns {Object} Status for all actions
 */
export const useMultipleRateLimits = (actions) => {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState({});

  const getIdentifier = useCallback(() => {
    if (user?.id) return user.id;
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }, [user]);

  const checkAllLimits = useCallback(() => {
    const identifier = getIdentifier();
    const newStatuses = {};

    actions.forEach(action => {
      const status = checkRateLimit(action, identifier);
      newStatuses[action] = {
        allowed: status.allowed,
        remaining: status.remaining,
        resetAt: status.resetAt,
        message: status.message || ''
      };
    });

    setStatuses(newStatuses);
    return newStatuses;
  }, [actions, getIdentifier]);

  useEffect(() => {
    checkAllLimits();
  }, [checkAllLimits]);

  return {
    statuses,
    checkAllLimits,
    isAnyLimited: Object.values(statuses).some(s => !s.allowed)
  };
};

export default useRateLimit;
