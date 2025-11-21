import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import './MobileHeader.css';

const MobileHeader = ({ pageTitle, showBackButton = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadMessages = 0, missedCalls = 0, unreadNotifications = 0 } = useNotifications?.() || {};

  return (
    <header className="mobile-header">
      {/* Left Section */}
      <div className="header-left">
        {showBackButton ? (
          <button className="header-back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18L9 12L15 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <h1 className="logo-text">Focus</h1>
        )}
      </div>

      {/* Center Section (Page Title - Optional) */}
      {pageTitle && (
        <div className="header-center">
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      )}

      {/* Right Section */}
      <div className="header-right">
        <button 
          className="header-icon-btn"
          onClick={() => navigate('/messages')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {unreadMessages > 0 && (
            <span className="notification-badge">{unreadMessages}</span>
          )}
        </button>

        <button 
          className="header-icon-btn"
          onClick={() => navigate('/notifications')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadNotifications > 0 && (
            <span className="notification-badge">{unreadNotifications}</span>
          )}
        </button>

        <button 
          className="header-icon-btn"
          onClick={() => navigate('/settings')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6m9.22-3.78l-4.24-4.24m-6-6l-4.24-4.24m14.49 14.49l-4.24-4.24m-6-6l-4.24-4.24"/>
          </svg>
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
