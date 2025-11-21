import { useState, useEffect } from 'react';

/**
 * Hook for layout-related functionality
 * Provides mobile detection, layout type detection, and responsive utilities
 */
export const useLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobile(width <= 480);
      setIsTablet(width > 480 && width <= 768);
      setIsDesktop(width > 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLayoutType = (pathname) => {
    if (!pathname) return 'feed';
    
    if (pathname.includes('/profile') || pathname.includes('/user/')) {
      return 'profile';
    }
    
    if (pathname.includes('/messages') || 
        pathname.includes('/chat') || 
        pathname.includes('/explore') || 
        pathname.includes('/search')) {
      return 'wide';
    }
    
    return 'feed';
  };

  const getContainerMaxWidth = (layoutType) => {
    switch (layoutType) {
      case 'feed':
        return '614px';
      case 'profile':
        return '935px';
      case 'wide':
        return '1200px';
      default:
        return '614px';
    }
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    windowSize,
    getLayoutType,
    getContainerMaxWidth,
    // Utility functions
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isDesktop && windowSize.width >= 1440,
    orientation: windowSize.width > windowSize.height ? 'landscape' : 'portrait'
  };
};

export default useLayout;
