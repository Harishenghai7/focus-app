/**
 * Lazy Loading Utilities for Code Splitting
 * Provides helpers for lazy loading components with custom loading states
 */

import { lazy } from 'react';

/**
 * Lazy load a component with retry logic
 * @param {Function} importFunc - Dynamic import function
 * @param {number} retries - Number of retry attempts
 * @returns {React.LazyExoticComponent}
 */
export const lazyWithRetry = (importFunc, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attemptsLeft) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 0) {
              reject(error);
              return;
            }
            
            console.warn(`Failed to load component, retrying... (${attemptsLeft} attempts left)`);
            
            // Retry after a delay
            setTimeout(() => {
              attemptImport(attemptsLeft - 1);
            }, 1000);
          });
      };
      
      attemptImport(retries);
    });
  });
};

/**
 * Preload a lazy component
 * @param {React.LazyExoticComponent} LazyComponent - Lazy component to preload
 */
export const preloadComponent = (LazyComponent) => {
  // Access the _payload to trigger the import
  if (LazyComponent._payload) {
    LazyComponent._payload._result();
  }
};

/**
 * Create a lazy component with prefetch on hover
 * @param {Function} importFunc - Dynamic import function
 * @returns {Object} - Object with Component and prefetch function
 */
export const lazyWithPrefetch = (importFunc) => {
  let componentPromise = null;
  
  const prefetch = () => {
    if (!componentPromise) {
      componentPromise = importFunc();
    }
    return componentPromise;
  };
  
  const Component = lazy(() => {
    if (!componentPromise) {
      componentPromise = importFunc();
    }
    return componentPromise;
  });
  
  return { Component, prefetch };
};

/**
 * Lazy load multiple components at once
 * @param {Object} imports - Object with component names as keys and import functions as values
 * @returns {Object} - Object with lazy loaded components
 */
export const lazyLoadMultiple = (imports) => {
  const lazyComponents = {};
  
  Object.keys(imports).forEach((key) => {
    lazyComponents[key] = lazy(imports[key]);
  });
  
  return lazyComponents;
};

export default {
  lazyWithRetry,
  preloadComponent,
  lazyWithPrefetch,
  lazyLoadMultiple
};
