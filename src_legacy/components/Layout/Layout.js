import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLayout } from './useLayout';
import styles from './Layout.module.css';

const Layout = ({ children, className, layoutType: forcedLayoutType }) => {
  const location = useLocation();
  const { isMobile, isTablet, isDesktop, getLayoutType } = useLayout();

  // Use forced layout type or determine from route
  const layoutType = forcedLayoutType || getLayoutType(location.pathname);

  const layoutClasses = [
    styles.layout,
    styles[layoutType],
    isMobile && styles.mobile,
    isTablet && styles.tablet,
    isDesktop && styles.desktop,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      <div className={styles.container}>
        <main className={styles.main} role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
