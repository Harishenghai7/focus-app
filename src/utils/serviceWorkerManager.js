/**
 * Service Worker Manager
 * Utilities for managing service worker registration, updates, and caching
 */

/**
 * Register service worker with update handling
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          notifyUserOfUpdate();
        }
      });
    });

    return registration;
  } catch (error) {
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      return success;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive() {
  return 'serviceWorker' in navigator && 
         navigator.serviceWorker.controller !== null;
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear specific cache
 */
export async function clearCache(cacheName) {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const success = await caches.delete(cacheName);
    return success;
  } catch (error) {
    return false;
  }
}

/**
 * Get cache size information
 */
export async function getCacheInfo() {
  if (!('caches' in window)) {
    return null;
  }

  try {
    const cacheNames = await caches.keys();
    const cacheInfo = await Promise.all(
      cacheNames.map(async (cacheName) => {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        return {
          name: cacheName,
          size: keys.length
        };
      })
    );

    return cacheInfo;
  } catch (error) {
    return null;
  }
}

/**
 * Precache specific URLs
 */
export async function precacheUrls(urls) {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cache = await caches.open('focus-precache');
    await cache.addAll(urls);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if URL is cached
 */
export async function isUrlCached(url) {
  if (!('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const response = await cache.match(url);
      if (response) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Notify user of service worker update
 */
function notifyUserOfUpdate() {
  // Create a custom event that the app can listen to
  const event = new CustomEvent('sw-update-available', {
    detail: {
      message: 'A new version of Focus is available!',
      action: 'reload'
    }
  });
  window.dispatchEvent(event);
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipWaitingAndActivate() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Listen for service worker updates
 */
export function onServiceWorkerUpdate(callback) {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handleUpdate = (event) => {
    callback(event.detail);
  };

  window.addEventListener('sw-update-available', handleUpdate);

  // Return cleanup function
  return () => {
    window.removeEventListener('sw-update-available', handleUpdate);
  };
}

/**
 * Get storage estimate
 */
export async function getStorageEstimate() {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  } catch (error) {
    return null;
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerActive,
  clearAllCaches,
  clearCache,
  getCacheInfo,
  precacheUrls,
  isUrlCached,
  skipWaitingAndActivate,
  onServiceWorkerUpdate,
  getStorageEstimate
};
