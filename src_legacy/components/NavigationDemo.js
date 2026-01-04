/**
 * NavigationDemo Component
 * 
 * Demonstrates the three navigation components working together:
 * - Header (fixed top with logo, search, icons)
 * - Sidebar (desktop left navigation)  
 * - BottomNav (mobile bottom navigation)
 * 
 * @component
 */

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './NavigationDemo.css';

const mockUser = {
  id: '1',
  username: 'johndoe',
  display_name: 'John Doe',
  profile_picture: null
};

const NavigationDemo = () => {
  return (
    <div className="navigation-demo">
      {/* Fixed Header */}
      <Header user={mockUser} />
      
      {/* Desktop Sidebar */}
      <Sidebar user={mockUser} />
      
      {/* Main Content Area */}
      <main className="demo-content">
        <div className="content-inner">
          <h1>Navigation Components Demo</h1>
          
          <div className="demo-section">
            <h2>Header Features</h2>
            <ul>
              <li>✅ Fixed top position</li>
              <li>✅ Logo and dynamic page title</li>
              <li>✅ Search bar (desktop only)</li>
              <li>✅ Action icons (messages, notifications, settings)</li>
              <li>✅ Responsive design</li>
              <li>✅ Uses design system tokens</li>
            </ul>
          </div>
          
          <div className="demo-section">
            <h2>Sidebar Features (Desktop)</h2>
            <ul>
              <li>✅ Fixed left position</li>
              <li>✅ Navigation links with icons</li>
              <li>✅ Active state highlighting</li>
              <li>✅ User profile preview at bottom</li>
              <li>✅ Hidden on mobile</li>
              <li>✅ Uses design system tokens</li>
            </ul>
          </div>
          
          <div className="demo-section">
            <h2>Bottom Navigation Features (Mobile)</h2>
            <ul>
              <li>✅ Fixed bottom position</li>
              <li>✅ 5 main navigation icons</li>
              <li>✅ Active state highlighting</li>
              <li>✅ Special styling for Create button</li>
              <li>✅ Hidden on desktop</li>
              <li>✅ Uses design system tokens</li>
            </ul>
          </div>
          
          <div className="demo-section">
            <h2>Responsive Behavior</h2>
            <p>
              <strong>Desktop (≥768px):</strong> Header + Sidebar visible, BottomNav hidden<br/>
              <strong>Mobile (&lt;768px):</strong> Header + BottomNav visible, Sidebar hidden
            </p>
          </div>
          
          <div className="demo-section">
            <h2>Design System Integration</h2>
            <p>All components use design system tokens for:</p>
            <ul>
              <li>Colors (surface, text, interactive, borders)</li>
              <li>Spacing (consistent padding, margins, gaps)</li>
              <li>Typography (font sizes, weights)</li>
              <li>Border radius and shadows</li>
              <li>Z-index layering</li>
              <li>Transitions and animations</li>
            </ul>
          </div>
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav user={mockUser} />
    </div>
  );
};

export default NavigationDemo;
