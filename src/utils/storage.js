/**
 * Local storage utility with JSON support and error handling
 */

const STORAGE_PREFIX = 'focus-app:';

export const setItem = (key, value) => {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(prefixedKey, serializedValue);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getItem = (key, defaultValue = null) => {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const item = localStorage.getItem(prefixedKey);
    
    if (item === null) {
      return defaultValue;
    }
    
    return JSON.parse(item);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeItem = (key) => {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

export const clear = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

export const hasItem = (key) => {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    return localStorage.getItem(prefixedKey) !== null;
  } catch (error) {
    console.error('Error checking localStorage:', error);
    return false;
  }
};

export const getAllKeys = () => {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.substring(STORAGE_PREFIX.length));
  } catch (error) {
    console.error('Error getting all keys from localStorage:', error);
    return [];
  }
};

export const getStorageInfo = () => {
  try {
    const keys = getAllKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      if (value) {
        totalSize += value.length;
      }
    });
    
    return {
      keys: keys.length,
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      available: isStorageAvailable(),
      quota: getStorageQuota()
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return null;
  }
};

export const isStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

export const getStorageQuota = () => {
  if (navigator.storage && navigator.storage.estimate) {
    return navigator.storage.estimate().then(estimate => ({
      quota: estimate.quota,
      usage: estimate.usage,
      quotaMB: Math.round(estimate.quota / 1024 / 1024),
      usageMB: Math.round(estimate.usage / 1024 / 1024)
    }));
  }
  return Promise.resolve(null);
};

// Session storage utilities
export const session = {
  setItem: (key, value) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      return false;
    }
  },

  getItem: (key, defaultValue = null) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      const item = sessionStorage.getItem(prefixedKey);
      
      if (item === null) {
        return defaultValue;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  },

  removeItem: (key) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
      return false;
    }
  },

  hasItem: (key) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      return sessionStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error('Error checking sessionStorage:', error);
      return false;
    }
  }
};

// Cache with expiration
export const cache = {
  set: (key, value, expirationMinutes = 60) => {
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    const cacheItem = {
      value,
      expiration: expirationTime
    };
    
    return setItem(`cache:${key}`, cacheItem);
  },

  get: (key, defaultValue = null) => {
    const cacheItem = getItem(`cache:${key}`);
    
    if (!cacheItem) {
      return defaultValue;
    }
    
    if (Date.now() > cacheItem.expiration) {
      removeItem(`cache:${key}`);
      return defaultValue;
    }
    
    return cacheItem.value;
  },

  remove: (key) => {
    return removeItem(`cache:${key}`);
  },

  clear: () => {
    const keys = getAllKeys();
    keys.forEach(key => {
      if (key.startsWith('cache:')) {
        removeItem(key);
      }
    });
  },

  has: (key) => {
    const cacheItem = getItem(`cache:${key}`);
    
    if (!cacheItem) {
      return false;
    }
    
    if (Date.now() > cacheItem.expiration) {
      removeItem(`cache:${key}`);
      return false;
    }
    
    return true;
  }
};

// User preferences utilities
export const preferences = {
  set: (key, value) => setItem(`pref:${key}`, value),
  get: (key, defaultValue = null) => getItem(`pref:${key}`, defaultValue),
  remove: (key) => removeItem(`pref:${key}`),
  getAll: () => {
    const keys = getAllKeys();
    const prefs = {};
    
    keys.forEach(key => {
      if (key.startsWith('pref:')) {
        const prefKey = key.substring(5);
        prefs[prefKey] = getItem(key);
      }
    });
    
    return prefs;
  }
};

// Utility functions
export const migrate = (oldKey, newKey) => {
  const value = getItem(oldKey);
  if (value !== null) {
    setItem(newKey, value);
    removeItem(oldKey);
    return true;
  }
  return false;
};

export const backup = () => {
  const keys = getAllKeys();
  const backup = {};
  
  keys.forEach(key => {
    backup[key] = getItem(key);
  });
  
  return backup;
};

export const restore = (backupData) => {
  if (!backupData || typeof backupData !== 'object') {
    return false;
  }
  
  try {
    Object.entries(backupData).forEach(([key, value]) => {
      setItem(key, value);
    });
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
};

export const cleanExpired = () => {
  const keys = getAllKeys();
  let cleanedCount = 0;
  
  keys.forEach(key => {
    if (key.startsWith('cache:')) {
      const cacheItem = getItem(key);
      if (cacheItem && Date.now() > cacheItem.expiration) {
        removeItem(key);
        cleanedCount++;
      }
    }
  });
  
  return cleanedCount;
};

export default {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  getAllKeys,
  getStorageInfo,
  isStorageAvailable,
  getStorageQuota,
  session,
  cache,
  preferences,
  migrate,
  backup,
  restore,
  cleanExpired
};
