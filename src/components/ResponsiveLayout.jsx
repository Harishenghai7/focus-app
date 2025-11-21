import React from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import MobileLayout from './mobile/MobileLayout';
import DesktopLayout from './desktop/DesktopLayout';

/**
 * ResponsiveLayout - Automatically switches between mobile and desktop layouts
 * Based on screen size (768px breakpoint)
 */
const ResponsiveLayout = ({ children, pageTitle, showBackButton }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <MobileLayout pageTitle={pageTitle} showBackButton={showBackButton}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout>
      {children}
    </DesktopLayout>
  );
};

export default ResponsiveLayout;
