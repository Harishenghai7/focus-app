/**
 * Device detection utilities
 */

export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
         (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
};

export const isDesktop = () => {
  return !isMobile() && !isTablet();
};

export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android/i.test(navigator.userAgent);
};

export const isWindows = () => {
  if (typeof window === 'undefined') return false;
  
  return /Windows/i.test(navigator.userAgent);
};

export const isMac = () => {
  if (typeof window === 'undefined') return false;
  
  return /Mac/i.test(navigator.userAgent);
};

export const isLinux = () => {
  if (typeof window === 'undefined') return false;
  
  return /Linux/i.test(navigator.userAgent) && !isAndroid();
};

export const getOS = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  
  if (isIOS()) return 'iOS';
  if (isAndroid()) return 'Android';
  if (isWindows()) return 'Windows';
  if (isMac()) return 'macOS';
  if (isLinux()) return 'Linux';
  
  return 'unknown';
};

export const getBrowser = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('SamsungBrowser')) return 'Samsung Internet';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  
  return 'unknown';
};

export const getBrowserVersion = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  const browser = getBrowser();
  
  let version = 'unknown';
  
  try {
    switch (browser) {
      case 'Chrome':
        version = userAgent.match(/Chrome\/(\d+)/)?.[1];
        break;
      case 'Firefox':
        version = userAgent.match(/Firefox\/(\d+)/)?.[1];
        break;
      case 'Safari':
        version = userAgent.match(/Version\/(\d+)/)?.[1];
        break;
      case 'Edge':
        version = userAgent.match(/Edge\/(\d+)/)?.[1];
        break;
      case 'Opera':
        version = userAgent.match(/Opera\/(\d+)/)?.[1] || userAgent.match(/OPR\/(\d+)/)?.[1];
        break;
    }
  } catch (error) {
    console.warn('Error parsing browser version:', error);
  }
  
  return version || 'unknown';
};

export const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

export const getScreenSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight
  };
};

export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
};

export const getDevicePixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
};

export const hasRetinaDislpay = () => {
  return getDevicePixelRatio() > 1;
};

export const hasTouchScreen = () => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getOrientation = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  if (window.screen?.orientation) {
    return window.screen.orientation.type;
  }
  
  // Fallback
  const { width, height } = getViewportSize();
  return width > height ? 'landscape' : 'portrait';
};

export const isPortrait = () => {
  return getOrientation().includes('portrait');
};

export const isLandscape = () => {
  return getOrientation().includes('landscape');
};

export const supportsWebGL = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (error) {
    return false;
  }
};

export const supportsWebGL2 = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch (error) {
    return false;
  }
};

export const supportsWebRTC = () => {
  if (typeof window === 'undefined') return false;
  
  return !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection);
};

export const supportsWebAssembly = () => {
  if (typeof window === 'undefined') return false;
  
  return typeof WebAssembly === 'object';
};

export const supportsServiceWorker = () => {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator;
};

export const supportsPushNotifications = () => {
  if (typeof window === 'undefined') return false;
  
  return 'Notification' in window && 'PushManager' in window;
};

export const supportsGeolocation = () => {
  if (typeof window === 'undefined') return false;
  
  return 'geolocation' in navigator;
};

export const supportsLocalStorage = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (error) {
    return false;
  }
};

export const supportsSessionStorage = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    sessionStorage.setItem('test', 'test');
    sessionStorage.removeItem('test');
    return true;
  } catch (error) {
    return false;
  }
};

export const supportsIndexedDB = () => {
  if (typeof window === 'undefined') return false;
  
  return 'indexedDB' in window;
};

export const getDeviceMemory = () => {
  if (typeof window === 'undefined') return null;
  
  return navigator.deviceMemory || null;
};

export const getLogicalProcessors = () => {
  if (typeof window === 'undefined') return null;
  
  return navigator.hardwareConcurrency || null;
};

export const getConnectionType = () => {
  if (typeof window === 'undefined') return null;
  
  return navigator.connection?.effectiveType || null;
};

export const isSlowConnection = () => {
  const connectionType = getConnectionType();
  return connectionType === 'slow-2g' || connectionType === '2g';
};

export const getGPUInfo = () => {
  if (!supportsWebGL()) return null;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return null;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    if (!debugInfo) return null;
    
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    };
  } catch (error) {
    return null;
  }
};

export const getDeviceFingerprint = () => {
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages || [],
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    screenColorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    touchSupport: hasTouchScreen(),
    devicePixelRatio: getDevicePixelRatio(),
    deviceMemory: getDeviceMemory(),
    hardwareConcurrency: getLogicalProcessors(),
    gpu: getGPUInfo(),
    connectionType: getConnectionType()
  };
  
  // Create a simple hash of the fingerprint
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return {
    ...fingerprint,
    hash: hash.toString(36)
  };
};

export const isLowEndDevice = () => {
  const deviceMemory = getDeviceMemory();
  const hardwareConcurrency = getLogicalProcessors();
  
  // Consider device low-end if:
  // - Has less than 4GB RAM
  // - Has less than 4 logical processors
  // - Is on a slow connection
  return (
    (deviceMemory && deviceMemory < 4) ||
    (hardwareConcurrency && hardwareConcurrency < 4) ||
    isSlowConnection()
  );
};

export const getDeviceCapabilities = () => {
  return {
    // Device info
    type: getDeviceType(),
    os: getOS(),
    browser: getBrowser(),
    browserVersion: getBrowserVersion(),
    
    // Hardware
    hasRetinaDisplay: hasRetinaDislpay(),
    hasTouchScreen: hasTouchScreen(),
    deviceMemory: getDeviceMemory(),
    logicalProcessors: getLogicalProcessors(),
    
    // Performance indicators
    isLowEndDevice: isLowEndDevice(),
    isSlowConnection: isSlowConnection(),
    
    // Feature support
    webGL: supportsWebGL(),
    webGL2: supportsWebGL2(),
    webRTC: supportsWebRTC(),
    webAssembly: supportsWebAssembly(),
    serviceWorker: supportsServiceWorker(),
    pushNotifications: supportsPushNotifications(),
    geolocation: supportsGeolocation(),
    localStorage: supportsLocalStorage(),
    sessionStorage: supportsSessionStorage(),
    indexedDB: supportsIndexedDB()
  };
};

export default {
  isMobile,
  isTablet,
  isDesktop,
  isIOS,
  isAndroid,
  isWindows,
  isMac,
  isLinux,
  getOS,
  getBrowser,
  getBrowserVersion,
  getDeviceType,
  getScreenSize,
  getViewportSize,
  getDevicePixelRatio,
  hasRetinaDislpay,
  hasTouchScreen,
  getOrientation,
  isPortrait,
  isLandscape,
  supportsWebGL,
  supportsWebGL2,
  supportsWebRTC,
  supportsWebAssembly,
  supportsServiceWorker,
  supportsPushNotifications,
  supportsGeolocation,
  supportsLocalStorage,
  supportsSessionStorage,
  supportsIndexedDB,
  getDeviceMemory,
  getLogicalProcessors,
  getConnectionType,
  isSlowConnection,
  getGPUInfo,
  getDeviceFingerprint,
  isLowEndDevice,
  getDeviceCapabilities
};
