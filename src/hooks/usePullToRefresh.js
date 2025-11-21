import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for pull-to-refresh functionality on mobile devices
 * 
 * @param {Function} onRefresh - Async function to call when refresh is triggered
 * @returns {Object} - { isRefreshing: boolean, pullDistance: number, pullProgress: number, isPulling: boolean }
 * 
 * @example
 * const { isRefreshing } = usePullToRefresh(async () => {
 *   await fetchNewData();
 * });
 */
export default function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isPulling = useRef(false);
  const scrollContainer = useRef(null);
  
  const PULL_THRESHOLD = 80; // Distance in pixels to trigger refresh
  const MAX_PULL_DISTANCE = 120; // Maximum pull distance for visual feedback
  
  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);
  
  // Check if container is at top
  const isAtTop = useCallback(() => {
    if (!scrollContainer.current) return true;
    return scrollContainer.current.scrollTop === 0;
  }, []);
  
  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (!isMobile() || isRefreshing) return;
    
    // Only start if at top of scroll container
    if (isAtTop()) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, [isMobile, isRefreshing, isAtTop]);
  
  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    
    touchCurrentY.current = e.touches[0].clientY;
    const distance = touchCurrentY.current - touchStartY.current;
    
    // Only pull down (positive distance) and when at top
    if (distance > 0 && isAtTop()) {
      // Apply resistance to pull (makes it feel more natural)
      const resistance = 0.5;
      const actualDistance = Math.min(distance * resistance, MAX_PULL_DISTANCE);
      
      setPullDistance(actualDistance);
      
      // Prevent default scroll behavior when pulling
      if (actualDistance > 0) {
        e.preventDefault();
      }
    }
  }, [isRefreshing, isAtTop, MAX_PULL_DISTANCE]);
  
  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || isRefreshing) return;
    
    isPulling.current = false;
    
    // Trigger refresh if pulled past threshold
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      
      try {
        if (onRefresh && typeof onRefresh === 'function') {
          await onRefresh();
        }
      } catch (error) {
        console.error('Error during pull-to-refresh:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, PULL_THRESHOLD]);
  
  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    isPulling.current = false;
    setPullDistance(0);
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    if (!isMobile()) return;
    
    // Find or use the main scroll container
    scrollContainer.current = document.querySelector('[data-scroll-container]') || 
                              document.querySelector('.main-content') ||
                              document.documentElement;
    
    const container = scrollContainer.current;
    
    if (container) {
      // Add passive: false to allow preventDefault
      const options = { passive: false };
      
      container.addEventListener('touchstart', handleTouchStart, options);
      container.addEventListener('touchmove', handleTouchMove, options);
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('touchcancel', handleTouchCancel);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart, options);
        container.removeEventListener('touchmove', handleTouchMove, options);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchCancel);
      };
    }
  }, [
    isMobile,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel
  ]);
  
  // Calculate pull progress for visual feedback (0 to 1)
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  
  return {
    isRefreshing,
    pullDistance,
    pullProgress, // For custom loading animations
    isPulling: isPulling.current && pullDistance > 0
  };
}
