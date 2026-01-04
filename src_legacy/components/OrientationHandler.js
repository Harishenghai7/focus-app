import { useEffect } from 'react';
import { useOrientation } from '../hooks/useOrientation';

/**
 * OrientationHandler Component
 * Handles orientation changes and preserves application state
 */
const OrientationHandler = ({ children, onOrientationChange }) => {
  const orientation = useOrientation();

  useEffect(() => {
    // Save scroll position before orientation change
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
    };

    // Add orientation class to body
    document.body.classList.remove('portrait', 'landscape');
    document.body.classList.add(orientation.isPortrait ? 'portrait' : 'landscape');

    // Add orientation-changing class for smooth transition
    document.body.classList.add('orientation-changing');

    // Restore scroll position after orientation change
    const timer = setTimeout(() => {
      window.scrollTo(scrollPosition.x, scrollPosition.y);
      document.body.classList.remove('orientation-changing');
    }, 300);

    // Call callback if provided
    if (onOrientationChange) {
      onOrientationChange(orientation);
    }

    // Log orientation change for debugging
    return () => {
      clearTimeout(timer);
    };
  }, [orientation, onOrientationChange]);

  // Handle viewport height changes (especially for mobile browsers)
  useEffect(() => {
    const updateViewportHeight = () => {
      // Set CSS custom property for actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  return children;
};

export default OrientationHandler;
