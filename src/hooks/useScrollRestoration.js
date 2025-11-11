import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to handle scroll position restoration across navigation
 */
export const useScrollRestoration = (key = null) => {
  const location = useLocation();
  const scrollPositions = useRef(new Map());
  const currentKey = key || location.pathname;

  // Save scroll position before navigation
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current.set(currentKey, {
        x: window.scrollX,
        y: window.scrollY,
        timestamp: Date.now()
      });
    };

    // Save on route change
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentKey]);

  // Restore scroll position on mount
  useEffect(() => {
    const restoreScrollPosition = () => {
      const saved = scrollPositions.current.get(currentKey);
      
      if (saved) {
        // Only restore if saved recently (within 5 minutes)
        const isRecent = Date.now() - saved.timestamp < 5 * 60 * 1000;
        
        if (isRecent) {
          // Use requestAnimationFrame to ensure DOM is ready
          requestAnimationFrame(() => {
            window.scrollTo(saved.x, saved.y);
          });
        }
      }
    };

    // Delay restoration to allow content to load
    const timer = setTimeout(restoreScrollPosition, 100);
    
    return () => clearTimeout(timer);
  }, [currentKey]);

  // Manual save/restore functions
  const savePosition = (customKey = currentKey) => {
    scrollPositions.current.set(customKey, {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    });
  };

  const restorePosition = (customKey = currentKey) => {
    const saved = scrollPositions.current.get(customKey);
    if (saved) {
      window.scrollTo(saved.x, saved.y);
    }
  };

  const clearPosition = (customKey = currentKey) => {
    scrollPositions.current.delete(customKey);
  };

  return {
    savePosition,
    restorePosition,
    clearPosition
  };
};

export default useScrollRestoration;