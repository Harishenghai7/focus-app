import { useState, useEffect } from 'react';

/**
 * Custom hook to detect and handle device orientation changes
 * @returns {Object} orientation state and utilities
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    type: getOrientationType(),
    angle: getOrientationAngle(),
    isPortrait: isPortraitMode(),
    isLandscape: isLandscapeMode(),
  });

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = {
        type: getOrientationType(),
        angle: getOrientationAngle(),
        isPortrait: isPortraitMode(),
        isLandscape: isLandscapeMode(),
      };
      
      setOrientation(newOrientation);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('orientationchange', {
        detail: newOrientation
      }));
    };

    // Listen for orientation change events
    if (window.screen && window.screen.orientation) {
      // Modern API
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    // Also listen for resize as a fallback
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return orientation;
};

/**
 * Get the current orientation type
 * @returns {string} 'portrait-primary', 'portrait-secondary', 'landscape-primary', or 'landscape-secondary'
 */
function getOrientationType() {
  if (window.screen && window.screen.orientation && window.screen.orientation.type) {
    return window.screen.orientation.type;
  }
  
  // Fallback based on window dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  if (height > width) {
    return 'portrait-primary';
  } else {
    return 'landscape-primary';
  }
}

/**
 * Get the current orientation angle
 * @returns {number} 0, 90, 180, or 270
 */
function getOrientationAngle() {
  if (window.screen && window.screen.orientation && window.screen.orientation.angle !== undefined) {
    return window.screen.orientation.angle;
  }
  
  // Fallback for older browsers
  if (window.orientation !== undefined) {
    return window.orientation;
  }
  
  // Default to 0 if no API available
  return 0;
}

/**
 * Check if device is in portrait mode
 * @returns {boolean}
 */
function isPortraitMode() {
  const type = getOrientationType();
  return type.includes('portrait') || window.innerHeight > window.innerWidth;
}

/**
 * Check if device is in landscape mode
 * @returns {boolean}
 */
function isLandscapeMode() {
  const type = getOrientationType();
  return type.includes('landscape') || window.innerWidth > window.innerHeight;
}

/**
 * Lock orientation (if supported)
 * @param {string} lockType - 'portrait', 'landscape', 'portrait-primary', etc.
 * @returns {Promise<void>}
 */
export const lockOrientation = async (lockType) => {
  if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
    try {
      await window.screen.orientation.lock(lockType);
      return true;
    } catch (error) {
      console.warn('Orientation lock failed:', error);
      return false;
    }
  }
  
  console.warn('Orientation lock not supported');
  return false;
};

/**
 * Unlock orientation (if supported)
 * @returns {void}
 */
export const unlockOrientation = () => {
  if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
    try {
      window.screen.orientation.unlock();
      return true;
    } catch (error) {
      console.warn('Orientation unlock failed:', error);
      return false;
    }
  }
  
  console.warn('Orientation unlock not supported');
  return false;
};

/**
 * Custom hook to lock orientation for a component
 * @param {string} lockType - 'portrait', 'landscape', etc.
 */
export const useOrientationLock = (lockType) => {
  useEffect(() => {
    let locked = false;
    
    const lock = async () => {
      locked = await lockOrientation(lockType);
    };
    
    lock();
    
    return () => {
      if (locked) {
        unlockOrientation();
      }
    };
  }, [lockType]);
};

export default useOrientation;
