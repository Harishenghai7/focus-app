/**
 * React Hook for CSRF Protection
 * Provides easy integration of CSRF protection in React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCSRFToken,
  initializeCSRFProtection,
  clearCSRFToken,
  validateCSRFToken,
  refreshCSRFToken,
  isCSRFProtectionEnabled,
  addCSRFHeader,
  createProtectedSubmitHandler
} from '../utils/csrfProtection';

/**
 * Hook for CSRF protection
 * @returns {Object} CSRF protection state and functions
 */
export const useCSRFProtection = () => {
  const [token, setToken] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);

  // Initialize CSRF protection
  const initialize = useCallback(() => {
    const newToken = initializeCSRFProtection();
    setToken(newToken);
    setIsEnabled(true);
    return newToken;
  }, []);

  // Get current token
  const getCurrentToken = useCallback(() => {
    const currentToken = getCSRFToken();
    setToken(currentToken);
    return currentToken;
  }, []);

  // Refresh token
  const refresh = useCallback(() => {
    const newToken = refreshCSRFToken();
    setToken(newToken);
    return newToken;
  }, []);

  // Clear token
  const clear = useCallback(() => {
    clearCSRFToken();
    setToken(null);
    setIsEnabled(false);
  }, []);

  // Validate token
  const validate = useCallback((tokenToValidate) => {
    return validateCSRFToken(tokenToValidate);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (isCSRFProtectionEnabled()) {
      getCurrentToken();
      setIsEnabled(true);
    } else {
      initialize();
    }
  }, [initialize, getCurrentToken]);

  return {
    token,
    isEnabled,
    initialize,
    getCurrentToken,
    refresh,
    clear,
    validate
  };
};

/**
 * Hook for protected fetch requests
 * @returns {Function} Protected fetch function
 */
export const useProtectedFetch = () => {
  const { getCurrentToken } = useCSRFProtection();

  const protectedFetch = useCallback(async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const requiresCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (requiresCSRF) {
      const token = getCurrentToken();
      options.headers = addCSRFHeader(options.headers);
    }

    return fetch(url, options);
  }, [getCurrentToken]);

  return protectedFetch;
};

/**
 * Hook for protected form submission
 * @param {Function} onSubmit - Submit handler
 * @returns {Function} Protected submit handler
 */
export const useProtectedForm = (onSubmit) => {
  const { getCurrentToken, validate } = useCSRFProtection();

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();

    // Get and validate token
    const token = getCurrentToken();
    if (!validate(token)) {
      throw new Error('Security token is invalid. Please refresh the page.');
    }

    // Add token to form data
    const formData = new FormData(event.target);
    formData.append('csrf_token', token);

    // Call original handler
    return onSubmit(event, formData, token);
  }, [onSubmit, getCurrentToken, validate]);

  return handleSubmit;
};

/**
 * Hook for CSRF token in component
 * @returns {Object} Token state
 */
export const useCSRFToken = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const currentToken = getCSRFToken();
    setToken(currentToken);
  }, []);

  const refreshToken = useCallback(() => {
    const newToken = refreshCSRFToken();
    setToken(newToken);
    return newToken;
  }, []);

  return {
    token,
    refreshToken
  };
};

/**
 * Hook for monitoring CSRF protection status
 * @returns {Object} Protection status
 */
export const useCSRFStatus = () => {
  const [status, setStatus] = useState({
    enabled: false,
    hasToken: false,
    tokenAge: 0
  });

  useEffect(() => {
    const checkStatus = () => {
      const enabled = isCSRFProtectionEnabled();
      const token = getCSRFToken();
      const hasToken = !!token;

      // Calculate token age
      let tokenAge = 0;
      try {
        const timestamp = sessionStorage.getItem('csrf_token_timestamp');
        if (timestamp) {
          tokenAge = Date.now() - parseInt(timestamp, 10);
        }
      } catch (error) {
        console.error('Error calculating token age:', error);
      }

      setStatus({
        enabled,
        hasToken,
        tokenAge
      });
    };

    checkStatus();

    // Check status every minute
    const interval = setInterval(checkStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

export default useCSRFProtection;
