import React, { useState } from 'react';
import DesktopSidebar from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';
import './DesktopLayout.css';

const DesktopLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="desktop-layout">
      <DesktopSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DesktopLayout;
