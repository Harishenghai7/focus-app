import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import './DesktopSidebar.css';

// Icons (Lucide-like SVGs for consistent pro look)
const Icons = {
  Home: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Explore: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  Create: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Boltz: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Messages: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Calls: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Notifications: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Settings: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
};

const DesktopSidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safe access to notification hooks with default values
  const notifications = useNotifications?.() || {};
  const { 
    unreadMessages = 0, 
    missedCalls = 0, 
    unreadNotifications = 0 
  } = notifications;

  // Helper to determine active state
  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/') return true;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/home', icon: <Icons.Home />, label: 'Home' },
    { path: '/explore', icon: <Icons.Explore />, label: 'Explore' },
    { path: '/boltz', icon: <Icons.Boltz />, label: 'Boltz' },
    { path: '/messages', icon: <Icons.Messages />, label: 'Messages', badge: unreadMessages },
    { path: '/calls', icon: <Icons.Calls />, label: 'Calls', badge: missedCalls },
    { path: '/notifications', icon: <Icons.Notifications />, label: 'Notifications', badge: unreadNotifications },
    { path: '/settings', icon: <Icons.Settings />, label: 'Settings' },
  ];

  return (
    <aside className={`desktop-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* 🦁 Logo Header */}
      <div className="sidebar-header" onClick={() => navigate('/home')}>
        <div className="logo-icon-container">
          <span className="logo-emoji">✨</span>
        </div>
        {!collapsed && <h1 className="sidebar-logo-text text-gradient">Focus</h1>}
      </div>

      {/* 🧭 Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon-wrapper">
              {item.icon}
              {item.badge > 0 && <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
            </span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}

        {/* ➕ Special Create Button (Separated) */}
        <button 
          className="create-button" 
          onClick={() => navigate('/create')}
          aria-label="Create New Post"
          title={collapsed ? 'Create' : ''}
        >
          <span className="nav-icon-wrapper">
            <Icons.Create />
          </span>
          {!collapsed && <span className="nav-label">Create</span>}
        </button>
      </nav>

      {/* 👤 User Profile Footer */}
      <div className="sidebar-footer">
        <button 
          className={`profile-button ${isActive(`/profile/${user?.username}`) ? 'active' : ''}`}
          onClick={() => navigate(`/profile/${user?.username || 'me'}`)}
        >
          <div className="profile-avatar-container">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {!collapsed && (
            <div className="profile-info">
              <span className="profile-username">{user?.username || 'Guest'}</span>
              <span className="profile-handle">@{user?.username || 'guest'}</span>
            </div>
          )}
        </button>

        <button 
          className="logout-button" 
          onClick={logout}
          title="Logout"
        >
          <Icons.Logout />
        </button>
      </div>
    </aside>
  );
};

export default DesktopSidebar;