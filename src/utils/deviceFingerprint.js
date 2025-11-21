/**
 * Device Fingerprinting Utility
 * 
 * Generates a unique fingerprint for the current device/browser combination
 * using a combination of browser attributes and hardware information.
 * 
 * Security Considerations:
 * - Uses a combination of stable and semi-stable browser attributes
 * - Implements hashing for privacy
 * - Handles errors gracefully to prevent fingerprinting failure
 * - Includes entropy from multiple sources for better uniqueness
 */

// Using Web Crypto API for hashing which is available in modern browsers

// Cache the fingerprint for performance
let cachedFingerprint = null;

/**
 * Generates a stable fingerprint for the current device/browser
 * @returns {Promise<string>} A promise that resolves to the device fingerprint
 */
export const getFingerprint = async () => {
  // Return cached fingerprint if available
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  try {
    // Collect fingerprint components
    const components = await Promise.all([
      getBrowserFingerprint(),
      getHardwareFingerprint(),
      getWebGLFingerprint(),
      getCanvasFingerprint(),
      getAudioFingerprint(),
    ]);

    try {
      // Combine and hash the components
      const fingerprint = await hashFingerprint(components.join('::'));
      
      // Cache the result
      cachedFingerprint = fingerprint;
      
      return fingerprint;
    } catch (error) {
      console.error('Error generating fingerprint hash:', error);
      // Fallback to a simple hash if Web Crypto fails
      return String(components.join('::')).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0).toString(16);
    }
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to a basic fingerprint if there's an error
    return hashFingerprint(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
    }));
  }
};

/**
 * Collects browser-specific fingerprint components
 */
async function getBrowserFingerprint() {
  const plugins = Array.from(navigator.plugins || []).map(p => ({
    name: p.name,
    description: p.description,
    filename: p.filename,
    length: p.length,
  }));

  const mimeTypes = Array.from(navigator.mimeTypes || []).map(mt => ({
    type: mt.type,
    description: mt.description,
    suffixes: mt.suffixes,
  }));

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const networkInfo = connection ? {
    type: connection.type,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  } : {};

  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.screen.orientation?.type || window.screen.mozOrientation || window.screen.msOrientation,
  };

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = navigator.languages || [navigator.language || navigator.userLanguage || ''];
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    vendor: navigator.vendor,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    doNotTrack: navigator.doNotTrack === '1' || false,
    cookieEnabled: navigator.cookieEnabled,
    pdfViewerEnabled: navigator.pdfViewerEnabled || false,
    webdriver: navigator.webdriver || false,
    languages,
    timezone,
    plugins,
    mimeTypes,
    network: networkInfo,
    screen: screenInfo,
  };
}

/**
 * Collects hardware-related fingerprint components
 */
async function getHardwareFingerprint() {
  const deviceInfo = {
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: navigator.deviceMemory || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };

  // Additional hardware info if available
  const batteryInfo = await (async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        return {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      }
    } catch (e) {
      // Ignore battery API errors
    }
    return null;
  })();

  return { ...deviceInfo, battery: batteryInfo };
}

/**
 * Generates a WebGL fingerprint
 */
async function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return { error: 'WebGL not supported' };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';

    const params = [
      'VENDOR', 'RENDERER', 'VERSION', 'SHADING_LANGUAGE_VERSION',
      'MAX_TEXTURE_SIZE', 'MAX_VIEWPORT_DIMS', 'MAX_VERTEX_ATTRIBS',
      'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_FRAGMENT_UNIFORM_VECTORS',
      'MAX_VARYING_VECTORS', 'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
      'MAX_VERTEX_TEXTURE_IMAGE_UNITS', 'MAX_TEXTURE_IMAGE_UNITS',
      'MAX_RENDERBUFFER_SIZE', 'MAX_CUBE_MAP_TEXTURE_SIZE'
    ].reduce((acc, param) => {
      try {
        acc[param] = gl.getParameter(gl[param]);
      } catch (e) {
        acc[param] = 'error';
      }
      return acc;
    }, {});

    return {
      vendor,
      renderer,
      params,
      extensions: gl.getSupportedExtensions(),
      shaderPrecision: ['HIGH_FLOAT', 'MEDIUM_FLOAT', 'LOW_FLOAT', 'HIGH_INT', 'MEDIUM_INT', 'LOW_INT']
        .reduce((acc, type) => {
          const typeEnum = gl[type];
          if (typeEnum === undefined) return acc;
          
          ['VERTEX_SHADER', 'FRAGMENT_SHADER'].forEach(shaderType => {
            const shaderTypeEnum = gl[shaderType];
            if (shaderTypeEnum === undefined) return;
            
            const key = `${type}_${shaderType}`;
            try {
              const precision = gl.getShaderPrecisionFormat(shaderTypeEnum, typeEnum);
              acc[key] = precision ? {
                rangeMin: precision.rangeMin,
                rangeMax: precision.rangeMax,
                precision: precision.precision,
              } : null;
            } catch (e) {
              acc[key] = 'error';
            }
          });
          
          return acc;
        }, {})
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generates a canvas fingerprint
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 240;
    canvas.height = 60;
    
    // Draw background
    ctx.fillStyle = 'rgb(128, 128, 128)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.font = '18px Arial';
    ctx.fillText('FocusApp', 10, 20);
    
    // Draw shape
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, Math.PI * 2, true);
    ctx.stroke();
    
    // Add some noise
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Get the canvas data URL
    const dataURL = canvas.toDataURL();
    
    // Create a simple hash of the image data
    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return {
      dataURL: dataURL.substring(0, 100) + '...', // Only store a portion
      hash: hash.toString(16),
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Generates an audio fingerprint
 */
function getAudioFingerprint() {
  try {
    // Audio fingerprinting can be done using the Web Audio API
    // This is a simple implementation that works in most modern browsers
    const audioContext = window.OfflineAudioContext || 
                         window.webkitOfflineAudioContext ||
                         (window.AudioContext && 
                          (() => {
                            const ctx = new AudioContext();
                            return new (window.OfflineAudioContext || 
                                      window.webkitOfflineAudioContext)(1, 2, ctx.sampleRate);
                          }));
    
    if (!audioContext) {
      return { error: 'AudioContext not supported' };
    }
    
    const context = new audioContext(1, 5000, 44100);
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();
    
    // Configure oscillator
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);
    
    // Configure compressor
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.reduction = -20;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;
    
    // Connect nodes
    oscillator.connect(compressor);
    compressor.connect(context.destination);
    
    // Start and stop quickly
    oscillator.start(0);
    oscillator.stop(0.01);
    
    // Process the audio
    return new Promise((resolve) => {
      context.oncomplete = (e) => {
        const output = e.renderedBuffer.getChannelData(0);
        let sum = 0;
        
        // Calculate checksum of the audio output
        for (let i = 0; i < output.length; i++) {
          sum += Math.abs(output[i]);
        }
        
        resolve({
          checksum: sum.toString(16),
          length: output.length,
          sampleRate: e.renderedBuffer.sampleRate,
        });
      };
      
      context.startRendering();
    });
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Hashes the fingerprint data for privacy using Web Crypto API
 */
async function hashFingerprint(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Export the main function and any utilities
export default {
  getFingerprint,
  // Export for testing
  _hashFingerprint: hashFingerprint,
};
