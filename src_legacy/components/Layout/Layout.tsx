import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLayout } from './useLayout';
import styles from './Layout.module.css';

export type LayoutType = 'feed' | 'profile' | 'wide';

export interface LayoutProps {
  children: ReactNode;
  className?: string;
  layoutType?: LayoutType;
  'data-testid'?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  className, 
  layoutType: forcedLayoutType,
  'data-testid': testId = 'layout'
}) => {
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
    <div className={layoutClasses} data-testid={testId}>
      <div className={styles.container}>
        <main className={styles.main} role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
