/**
 * Version Management System
 * Handles app version tracking, update notifications, and forced refreshes
 */

// Get app version from package.json
export const APP_VERSION = process.env.REACT_APP_VERSION || '0.1.0';

// Storage keys
const VERSION_KEY = 'focus_app_version';
const LAST_CHECK_KEY = 'focus_last_version_check';
const UPDATE_DISMISSED_KEY = 'focus_update_dismissed';

// Check interval (5 minutes)
const CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Get stored version
 */
export const getStoredVersion = () => {
  return localStorage.getItem(VERSION_KEY);
};

/**
 * Set stored version
 */
export const setStoredVersion = (version) => {
  localStorage.setItem(VERSION_KEY, version);
};

/**
 * Get last check timestamp
 */
const getLastCheckTime = () => {
  const timestamp = localStorage.getItem(LAST_CHECK_KEY);
  return timestamp ? parseInt(timestamp, 10) : 0;
};

/**
 * Set last check timestamp
 */
const setLastCheckTime = () => {
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
};

/**
 * Check if update was dismissed
 */
const isUpdateDismissed = (version) => {
  return localStorage.getItem(UPDATE_DISMISSED_KEY) === version;
};

/**
 * Mark update as dismissed
 */
export const dismissUpdate = (version) => {
  localStorage.setItem(UPDATE_DISMISSED_KEY, version);
};

/**
 * Clear dismissed update
 */
export const clearDismissedUpdate = () => {
  localStorage.removeItem(UPDATE_DISMISSED_KEY);
};

/**
 * Compare version strings (semantic versioning)
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
};

/**
 * Check if new version is available
 */
export const isNewVersionAvailable = () => {
  const storedVersion = getStoredVersion();
  
  if (!storedVersion) {
    // First time running, store current version
    setStoredVersion(APP_VERSION);
    return false;
  }
  
  return compareVersions(APP_VERSION, storedVersion) > 0;
};

/**
 * Check for updates from server
 * Fetches version.json from public folder
 */
export const checkForUpdates = async () => {
  try {
    // Don't check too frequently
    const lastCheck = getLastCheckTime();
    const now = Date.now();
    
    if (now - lastCheck < CHECK_INTERVAL) {
      return null;
    }
    
    setLastCheckTime();
    
    // Fetch version info with cache busting
    const response = await fetch(`/version.json?t=${now}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch version info');
    }
    
    const data = await response.json();
    const serverVersion = data.version;
    
    // Compare with current version
    if (compareVersions(serverVersion, APP_VERSION) > 0) {
      return {
        currentVersion: APP_VERSION,
        newVersion: serverVersion,
        releaseNotes: data.releaseNotes || [],
        forceUpdate: data.forceUpdate || false,
        updateUrl: data.updateUrl || window.location.href
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Force refresh the application
 */
export const forceRefresh = () => {
  // Clear service worker cache
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
  
  // Clear browser cache
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }
  
  // Update stored version
  setStoredVersion(APP_VERSION);
  clearDismissedUpdate();
  
  // Hard reload
  window.location.reload(true);
};

/**
 * Initialize version management
 */
export const initializeVersionManagement = () => {
  const storedVersion = getStoredVersion();
  
  if (!storedVersion) {
    // First time running
    setStoredVersion(APP_VERSION);
  } else if (compareVersions(APP_VERSION, storedVersion) > 0) {
    // New version detected
    setStoredVersion(APP_VERSION);
    clearDismissedUpdate();
  }
  
  return {
    version: APP_VERSION,
    isNewVersion: isNewVersionAvailable()
  };
};

/**
 * Get version info for display
 */
export const getVersionInfo = () => {
  return {
    version: APP_VERSION,
    buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
    environment: process.env.REACT_APP_ENV || 'development',
    commit: process.env.REACT_APP_COMMIT_SHA || 'unknown'
  };
};

/**
 * Start periodic version checking
 */
export const startVersionChecking = (onUpdateAvailable) => {
  // Check immediately
  checkForUpdates().then((update) => {
    if (update && !isUpdateDismissed(update.newVersion)) {
      onUpdateAvailable(update);
    }
  });
  
  // Check periodically
  const intervalId = setInterval(async () => {
    const update = await checkForUpdates();
    if (update && !isUpdateDismissed(update.newVersion)) {
      onUpdateAvailable(update);
    }
  }, CHECK_INTERVAL);
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

export default {
  APP_VERSION,
  getStoredVersion,
  setStoredVersion,
  compareVersions,
  isNewVersionAvailable,
  checkForUpdates,
  forceRefresh,
  initializeVersionManagement,
  getVersionInfo,
  startVersionChecking,
  dismissUpdate,
  clearDismissedUpdate
};
