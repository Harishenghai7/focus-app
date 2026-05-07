/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * H2 UNIVERSAL: useResponsiveLayout Hook
 * Adaptive layout detection for Trinity Feed system
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import { useState, useEffect, useCallback } from 'react';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

export const useResponsiveLayout = () => {
  const [layout, setLayout] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isWide: false,
    columns: 1,
    sidebarCollapsed: false,
  });

  const updateLayout = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const isMobile = width < BREAKPOINTS.tablet;
    const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isDesktop = width >= BREAKPOINTS.desktop && width < BREAKPOINTS.wide;
    const isWide = width >= BREAKPOINTS.wide;
    
    // Column configuration for masonry/grid layouts
    let columns = 1;
    if (isWide) columns = 3;
    else if (isDesktop) columns = 2;
    else if (isTablet) columns = 2;
    
    setLayout({
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      isWide,
      columns,
      sidebarCollapsed: width < BREAKPOINTS.desktop,
    });
  }, []);

  useEffect(() => {
    // Initial calculation
    updateLayout();
    
    // Throttled resize handler
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayout, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateLayout]);

  return layout;
};

export default useResponsiveLayout;
