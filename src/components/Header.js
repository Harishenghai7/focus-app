import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useTheme } from "../context/ThemeContext";
import focusLogo from "../assets/focus-logo.png";
import { generateAriaLabel } from "../utils/accessibility";
import "./Header.css";

export default function Header({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      setupRealtimeSubscription();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('header_notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/" || path === "/home") return "Focus";
    if (path === "/explore") return "Explore";
    if (path === "/create") return "Create";
    if (path === "/boltz") return "Boltz";
    if (path === "/profile") return "Profile";
    if (path === "/messages") return "Messages";
    if (path === "/notifications") return "Notifications";
    if (path === "/settings") return "Settings";
    if (path === "/call") return "Call";
    if (path.startsWith("/flash")) return "Stories";
    return "Focus";
  };

  const handleNotificationsClick = () => {
    navigate("/notifications");
  };

  const handleCallClick = () => {
    navigate("/calls");
  };

  const handleMessagesClick = () => {
    navigate("/messages");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  return (
    <motion.header 
      className="app-header"
      role="banner"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="header-content">
        {/* Logo/Title */}
        <div className="header-left">
          <motion.button 
            className="app-logo"
            onClick={() => navigate("/")}
            aria-label="Go to home page"
            whileTap={{ scale: 0.95 }}
          >
            <img src={focusLogo} alt="Focus logo" className="logo-image" />
            <span className="logo-text">{getPageTitle()}</span>
          </motion.button>
        </div>

        {/* Header Actions */}
        <nav className="header-actions" aria-label="Main navigation">
          {/* Messages */}
          <motion.button 
            className="header-btn"
            onClick={handleMessagesClick}
            aria-label={generateAriaLabel('message', {})}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </motion.button>

          {/* Call */}
          <motion.button 
            className="header-btn"
            onClick={handleCallClick}
            aria-label={generateAriaLabel('call', {})}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </motion.button>

          {/* Notifications */}
          <motion.button 
            className="header-btn notification-btn"
            onClick={handleNotificationsClick}
            aria-label={generateAriaLabel('notification', { unreadCount })}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge" aria-hidden="true">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Dark Mode Toggle */}
          <motion.button 
            className="header-btn"
            onClick={toggleDarkMode}
            aria-label={generateAriaLabel('darkMode', { darkMode })}
            aria-pressed={darkMode}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </motion.button>

          {/* Settings */}
          <motion.button 
            className="header-btn"
            onClick={handleSettingsClick}
            aria-label={generateAriaLabel('settings', {})}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
}