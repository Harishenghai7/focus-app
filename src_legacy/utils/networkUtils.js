/**
 * Network utilities
 */

export const isOnline = () => {
  return navigator.onLine;
};

export const isOffline = () => {
  return !navigator.onLine;
};

export const getConnectionType = () => {
  if (!navigator.connection) return 'unknown';
  
  return navigator.connection.effectiveType || 'unknown';
};

export const getConnectionSpeed = () => {
  if (!navigator.connection) return null;
  
  return {
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    effectiveType: navigator.connection.effectiveType,
    saveData: navigator.connection.saveData
  };
};

export const onOnline = (callback) => {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
};

export const onOffline = (callback) => {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
};

export const onConnectionChange = (callback) => {
  if (!navigator.connection) return () => {};
  
  const handler = () => callback(getConnectionSpeed());
  navigator.connection.addEventListener('change', handler);
  
  return () => navigator.connection.removeEventListener('change', handler);
};

export const ping = async (url = window.location.origin, timeout = 5000) => {
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = performance.now();
    
    return {
      success: true,
      time: endTime - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      time: null
    };
  }
};

export const measureLatency = async (url = window.location.origin, attempts = 3) => {
  const results = [];
  
  for (let i = 0; i < attempts; i++) {
    const result = await ping(url);
    results.push(result);
    
    if (i < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      success: false,
      average: null,
      min: null,
      max: null,
      results
    };
  }
  
  const times = successfulResults.map(r => r.time);
  
  return {
    success: true,
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    results
  };
};

export const downloadSpeedTest = async (url, sizeBytes = 1024 * 1024) => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const endTime = performance.now();
    
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    const speed = (blob.size * 8) / duration / 1000000; // Convert to Mbps
    
    return {
      success: true,
      speed: speed,
      size: blob.size,
      duration: duration
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

export const fetchWithRetry = async (url, options = {}, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};

export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const preloadResource = (url, type = 'fetch') => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'fetch') {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to preload ${url}`));
    
    document.head.appendChild(link);
  });
};

export const prefetchResource = (url) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to prefetch ${url}`));
    
    document.head.appendChild(link);
  });
};

export const createNetworkMonitor = () => {
  let isMonitoring = false;
  let callbacks = new Set();
  
  const updateStatus = () => {
    const status = {
      online: isOnline(),
      connection: getConnectionSpeed(),
      timestamp: Date.now()
    };
    
    callbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Network monitor callback error:', error);
      }
    });
  };
  
  const startMonitoring = () => {
    if (isMonitoring) return;
    
    isMonitoring = true;
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateStatus);
    }
  };
  
  const stopMonitoring = () => {
    if (!isMonitoring) return;
    
    isMonitoring = false;
    window.removeEventListener('online', updateStatus);
    window.removeEventListener('offline', updateStatus);
    
    if (navigator.connection) {
      navigator.connection.removeEventListener('change', updateStatus);
    }
  };
  
  return {
    start: startMonitoring,
    stop: stopMonitoring,
    
    subscribe: (callback) => {
      callbacks.add(callback);
      
      if (!isMonitoring) {
        startMonitoring();
      }
      
      // Return current status immediately
      callback({
        online: isOnline(),
        connection: getConnectionSpeed(),
        timestamp: Date.now()
      });
      
      return () => {
        callbacks.delete(callback);
        
        if (callbacks.size === 0) {
          stopMonitoring();
        }
      };
    },
    
    getStatus: () => ({
      online: isOnline(),
      connection: getConnectionSpeed(),
      timestamp: Date.now()
    }),
    
    isMonitoring: () => isMonitoring
  };
};

export const detectSlowConnection = () => {
  if (!navigator.connection) return false;
  
  const connection = navigator.connection;
  
  return (
    connection.saveData ||
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    (connection.effectiveType === '3g' && connection.downlink < 1.5)
  );
};

export const getOptimalImageQuality = () => {
  if (detectSlowConnection()) {
    return 0.6; // Lower quality for slow connections
  }
  
  const connection = getConnectionSpeed();
  
  if (connection && connection.effectiveType === '4g' && connection.downlink > 10) {
    return 0.9; // High quality for fast connections
  }
  
  return 0.8; // Default quality
};

export const shouldPreloadImages = () => {
  return !detectSlowConnection() && !navigator.connection?.saveData;
};

export const estimateLoadTime = (sizeBytes) => {
  const connection = getConnectionSpeed();
  
  if (!connection || !connection.downlink) {
    return null; // Can't estimate without connection info
  }
  
  // Convert from Mbps to bytes per second
  const bytesPerSecond = (connection.downlink * 1000000) / 8;
  
  // Add some overhead for latency and protocol overhead
  const estimatedSeconds = (sizeBytes / bytesPerSecond) * 1.5;
  
  return Math.max(estimatedSeconds, 0.1); // Minimum 100ms
};

export const adaptiveTimeout = (baseTimeout = 5000) => {
  const connection = getConnectionSpeed();
  
  if (!connection) return baseTimeout;
  
  if (connection.effectiveType === 'slow-2g') return baseTimeout * 4;
  if (connection.effectiveType === '2g') return baseTimeout * 3;
  if (connection.effectiveType === '3g') return baseTimeout * 2;
  
  return baseTimeout;
};

export const batchRequests = (requests, batchSize = 5, delay = 100) => {
  const batches = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  
  return batches.reduce(async (promise, batch, index) => {
    await promise;
    
    if (index > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return Promise.all(batch.map(request => request()));
  }, Promise.resolve());
};

export default {
  isOnline,
  isOffline,
  getConnectionType,
  getConnectionSpeed,
  onOnline,
  onOffline,
  onConnectionChange,
  ping,
  measureLatency,
  downloadSpeedTest,
  fetchWithRetry,
  fetchWithTimeout,
  preloadResource,
  prefetchResource,
  createNetworkMonitor,
  detectSlowConnection,
  getOptimalImageQuality,
  shouldPreloadImages,
  estimateLoadTime,
  adaptiveTimeout,
  batchRequests
};
