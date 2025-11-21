import React from 'react';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import './MobileLayout.css';

const MobileLayout = ({ children, pageTitle, showBackButton }) => {
  return (
    <div className="mobile-layout">
      <MobileHeader 
        pageTitle={pageTitle}
        showBackButton={showBackButton}
      />
      
      <main className="mobile-content">
        <div className="mobile-content-inner">
          {children}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
