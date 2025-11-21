/**
 * Browser Compatibility Utilities
 * Detects browser features and provides fallbacks
 */

// Detect browser type and version
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let isSupported = true;

  // Chrome
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 90;
  }
  // Edge (Chromium)
  else if (userAgent.indexOf('Edg') > -1) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 90;
  }
  // Firefox
  else if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 88;
  }
  // Safari
  else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 14;
  }
  // Opera
  else if (userAgent.indexOf('OPR') > -1 || userAgent.indexOf('Opera') > -1) {
    browserName = 'Opera';
    const match = userAgent.match(/(?:OPR|Opera)\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
    isSupported = parseInt(browserVersion) >= 76;
  }

  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    userAgent,
  };
};

// Detect device type
export const detectDevice = () => {
  const userAgent = navigator.userAgent;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android/i.test(userAgent) && !/Mobile/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
  };
};

// Check for feature support
export const checkFeatureSupport = () => {
  return {
    // Storage APIs
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof Storage !== 'undefined',
    indexedDB: typeof indexedDB !== 'undefined',
    
    // Media APIs
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webRTC: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
    
    // Modern JavaScript features
    promises: typeof Promise !== 'undefined',
    async: typeof (async () => {}) === 'function',
    fetch: typeof fetch !== 'undefined',
    
    // CSS features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssVariables: CSS.supports('--test', '0'),
    
    // Web APIs
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    notifications: 'Notification' in window,
    geolocation: 'geolocation' in navigator,
    
    // File APIs
    fileReader: typeof FileReader !== 'undefined',
    blob: typeof Blob !== 'undefined',
    
    // Intersection Observer
    intersectionObserver: 'IntersectionObserver' in window,
    
    // Resize Observer
    resizeObserver: 'ResizeObserver' in window,
    
    // Clipboard API
    clipboard: navigator.clipboard !== undefined,
    
    // Web Share API
    webShare: navigator.share !== undefined,
    
    // Touch events
    touchEvents: 'ontouchstart' in window,
    
    // Pointer events
    pointerEvents: 'PointerEvent' in window,
  };
};

// Get browser-specific CSS prefix
export const getCSSPrefix = () => {
  const styles = window.getComputedStyle(document.documentElement, '');
  const pre = (Array.prototype.slice
    .call(styles)
    .join('') 
    .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
  )[1];
  
  return {
    dom: pre === 'ms' ? 'MS' : pre,
    lowercase: pre,
    css: `-${pre}-`,
    js: pre === 'ms' ? pre : pre[0].toUpperCase() + pre.substr(1)
  };
};

// Polyfill for requestAnimationFrame
export const requestAnimationFramePolyfill = () => {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => {
      return window.setTimeout(callback, 1000 / 60);
    };
  }
  
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }
};

// Polyfill for Object.assign
export const objectAssignPolyfill = () => {
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target, ...sources) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      
      const to = Object(target);
      
      for (let i = 0; i < sources.length; i++) {
        const nextSource = sources[i];
        
        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      
      return to;
    };
  }
};

// Polyfill for Array.from
export const arrayFromPolyfill = () => {
  if (!Array.from) {
    Array.from = (function() {
      const toStr = Object.prototype.toString;
      const isCallable = function(fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };
      const toInteger = function(value) {
        const number = Number(value);
        if (isNaN(number)) return 0;
        if (number === 0 || !isFinite(number)) return number;
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };
      const maxSafeInteger = Math.pow(2, 53) - 1;
      const toLength = function(value) {
        const len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      };

      return function from(arrayLike) {
        const C = this;
        const items = Object(arrayLike);
        
        if (arrayLike == null) {
          throw new TypeError('Array.from requires an array-like object - not null or undefined');
        }
        
        const mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        let T;
        if (typeof mapFn !== 'undefined') {
          if (!isCallable(mapFn)) {
            throw new TypeError('Array.from: when provided, the second argument must be a function');
          }
          if (arguments.length > 2) {
            T = arguments[2];
          }
        }
        
        const len = toLength(items.length);
        const A = isCallable(C) ? Object(new C(len)) : new Array(len);
        let k = 0;
        let kValue;
        
        while (k < len) {
          kValue = items[k];
          if (mapFn) {
            A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
          k += 1;
        }
        
        A.length = len;
        return A;
      };
    }());
  }
};

// Initialize all polyfills
export const initializePolyfills = () => {
  requestAnimationFramePolyfill();
  objectAssignPolyfill();
  arrayFromPolyfill();
};

// Check if browser is supported and show warning if not
export const checkBrowserSupport = () => {
  const browser = detectBrowser();
  const features = checkFeatureSupport();
  
  const criticalFeatures = [
    'localStorage',
    'promises',
    'fetch',
    'cssFlexbox',
  ];
  
  const missingFeatures = criticalFeatures.filter(feature => !features[feature]);
  
  if (!browser.isSupported || missingFeatures.length > 0) {
    return {
      isSupported: false,
      browser,
      missingFeatures,
      message: `Your browser (${browser.name} ${browser.version}) may not support all features. Please update to the latest version or use a modern browser like Chrome, Firefox, Safari, or Edge.`,
    };
  }
  
  return {
    isSupported: true,
    browser,
    missingFeatures: [],
  };
};

// Get viewport dimensions (cross-browser)
export const getViewportDimensions = () => {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  };
};

// Detect if user prefers reduced motion
export const prefersReducedMotion = () => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

// Detect if user prefers dark mode
export const prefersDarkMode = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches;
};

// Detect if user prefers high contrast
export const prefersHighContrast = () => {
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  return mediaQuery.matches;
};

// Safe console methods (for browsers that don't support console)
export const safeConsole = {
  log: (...args) => {
    if (typeof console !== 'undefined' && console.log) {
    }
  },
  error: (...args) => {
    if (typeof console !== 'undefined' && console.error) {
    }
  },
  warn: (...args) => {
    if (typeof console !== 'undefined' && console.warn) {
    }
  },
  info: (...args) => {
    if (typeof console !== 'undefined' && console.info) {
    }
  },
};

// Export all utilities
export default {
  detectBrowser,
  detectDevice,
  checkFeatureSupport,
  getCSSPrefix,
  initializePolyfills,
  checkBrowserSupport,
  getViewportDimensions,
  prefersReducedMotion,
  prefersDarkMode,
  prefersHighContrast,
  safeConsole,
};
