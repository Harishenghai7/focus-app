import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

export interface LayoutHook {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  windowSize: WindowSize;
  getLayoutType: (pathname?: string) => 'feed' | 'profile' | 'wide';
  getContainerMaxWidth: (layoutType: 'feed' | 'profile' | 'wide') => string;
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  orientation: 'landscape' | 'portrait';
}

/**
 * Hook for layout-related functionality
 * Provides mobile detection, layout type detection, and responsive utilities
 */
export const useLayout = (): LayoutHook => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = (): void => {
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

  const getLayoutType = (pathname?: string): 'feed' | 'profile' | 'wide' => {
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

  const getContainerMaxWidth = (layoutType: 'feed' | 'profile' | 'wide'): string => {
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
