import { lazy } from 'react';

/**
 * Lazy load a component with retry logic
 */
export const lazyWithRetry = (importFunc, retries = 3, retryDelay = 1500) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attemptsLeft) => {
        importFunc()
          .then((module) => {
            // ✅ Always return an object with a default export
            if (module.default) {
              resolve(module);
            } else {
              reject(
                new Error(
                  'Lazy import did not provide a default export. Please add "export default" to your component.'
                )
              );
            }
          })
          .catch((error) => {
            if (attemptsLeft === 0) {
              console.error('Failed to load component after all retries:', error);
              // Try to reload the page as a last resort for chunk load errors
              if (error.name === 'ChunkLoadError') {
                console.warn('Chunk load error detected. Clearing cache and reloading...');
                if ('caches' in window) {
                  caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                  });
                }
                window.location.reload();
              }
              reject(error);
              return;
            }
            console.warn(
              `Failed to load component, retrying in ${retryDelay}ms... (${attemptsLeft} attempts left)`,
              error.message
            );
            setTimeout(() => attemptImport(attemptsLeft - 1), retryDelay);
          });
      };
      attemptImport(retries);
    });
  });
};

/**
 * Lazy load with prefetch
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
    return componentPromise.then((module) => {
      if (module.default) {
        return module;
      }
      throw new Error(
        'Lazy import did not provide a default export. Please add "export default" to your component.'
      );
    });
  });

  return { Component, prefetch };
};
