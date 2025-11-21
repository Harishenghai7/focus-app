/**
 * CSRF Protection Provider Component
 * Provides CSRF protection context to the entire application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initializeCSRFProtection,
  clearCSRFToken,
  getCSRFToken,
  refreshCSRFToken,
  validateCSRFToken,
  addCSRFHeader
} from '../utils/csrfProtection';

const CSRFContext = createContext(null);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within CSRFProtectionProvider');
  }
  return context;
};

export const CSRFProtectionProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize CSRF protection
  useEffect(() => {
    const newToken = initializeCSRFProtection();
    setToken(newToken);
    setIsInitialized(true);
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

  // Clear token (on logout)
  const clear = useCallback(() => {
    clearCSRFToken();
    setToken(null);
  }, []);

  // Validate token
  const validate = useCallback((tokenToValidate) => {
    return validateCSRFToken(tokenToValidate);
  }, []);

  // Add CSRF header to request
  const addHeader = useCallback((headers = {}) => {
    return addCSRFHeader(headers);
  }, []);

  // Protected fetch wrapper
  const protectedFetch = useCallback(async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const requiresCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (requiresCSRF) {
      options.headers = addCSRFHeader(options.headers);
    }

    return fetch(url, options);
  }, []);

  const value = {
    token,
    isInitialized,
    getCurrentToken,
    refresh,
    clear,
    validate,
    addHeader,
    protectedFetch
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
};

export default CSRFProtectionProvider;
