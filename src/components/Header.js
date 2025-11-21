/**
 * Header Component
 * 
 * Application header with navigation, notifications, theme toggle, and settings access.
 * Displays contextual page title, notification badge with unread count, and
 * provides quick access to messages, calls, and settings.
 * 
 * Features:
 * - Real-time notification updates via Supabase
 * - Dark/light mode toggle with persistence
 * - Responsive navigation buttons
 * - Full accessibility support (ARIA labels, keyboard nav)
 * - Smooth animations and transitions
 * 
 * @component
 * @example
 * <Header user={currentUser} />
 * 
 * @param {Object} user - Current user object
 * @param {string} user.id - User ID
 * @returns {React.ReactElement} Header component
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useTheme } from '../context/ThemeContext';
import focusLogo from '../assets/focus-logo.png';
import { generateAriaLabel } from '../utils/accessibility';
import styles from './Header.module.css';
import './Header.css';

/**
 * Page title mapping for different routes
 */
const PAGE_TITLES = {
  '/': 'Focus',
  '/home': 'Focus',
  '/explore': 'Explore',
  '/create': 'Create',
  '/boltz': 'Boltz',
  '/profile': 'Profile',
  '/messages': 'Messages',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/call': 'Call',
  '/flash': 'Stories',
  'default': 'Focus'
};

/**
 * Header - Main application header component
 */
const Header = React.memo(function Header({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef(null);

  /**
   * Fetch unread notifications count
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      if (isMountedRef.current) {
        setUnreadCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (isMountedRef.current) {
        setUnreadCount(0);
      }
    }
  }, [user?.id]);

  /**
   * Setup real-time subscription for notifications
   */
  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id) return;

    try {
      subscriptionRef.current = supabase
        .channel(`header_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            if (isMountedRef.current) {
              fetchNotifications();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            if (isMountedRef.current) {
              fetchNotifications();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.debug('Header realtime subscription active');
          }
        });
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user?.id, fetchNotifications]);

  /**
   * Initialize notifications on mount
   */
  useEffect(() => {
    isMountedRef.current = true;

    if (user?.id) {
      fetchNotifications();
      const unsubscribe = setupRealtimeSubscription();

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id, fetchNotifications, setupRealtimeSubscription]);

  /**
   * Get page title based on current route
   */
  const getPageTitle = useCallback(() => {
    const path = location.pathname;
    if (path in PAGE_TITLES) {
      return PAGE_TITLES[path];
    }
    if (path.startsWith('/flash')) {
      return PAGE_TITLES['/flash'];
    }
    return PAGE_TITLES['default'];
  }, [location.pathname]);

  /**
   * Navigation handlers
   */
  const handleNotificationsClick = useCallback(() => {
    navigate('/notifications');
  }, [navigate]);

  const handleCallClick = useCallback(() => {
    navigate('/calls');
  }, [navigate]);

  const handleMessagesClick = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <motion.header
      className={styles.header}
      role="banner"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Application header"
    >
      <div className={styles.headerContent}>
        {/* Logo/Title */}
        <div className={styles.headerLeft}>
          <motion.button
            className={styles.appLogo}
            onClick={handleLogoClick}
            aria-label="Go to home page"
            whileTap={{ scale: 0.95 }}
            type="button"
          >
            <img
              src={focusLogo}
              alt="Focus logo"
              className={styles.logoImage}
              loading="eager"
            />
            <span className={styles.logoText}>{getPageTitle()}</span>
          </motion.button>
        </div>

        {/* Search Bar - Desktop Only */}
        <div className={styles.headerSearch}>
          <div className={styles.searchIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21L16.65 16.65" />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search Focus..."
            className={styles.searchInput}
            aria-label="Search"
          />
        </div>

        {/* Header Actions Navigation */}
        <nav className={styles.headerActions} aria-label="Header navigation">
          {/* Messages Button */}
          <motion.button
            className={styles.headerBtn}
            onClick={handleMessagesClick}
            aria-label="Messages"
            title="Go to messages"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </motion.button>

          {/* Call Button */}
          <motion.button
            className={styles.headerBtn}
            onClick={handleCallClick}
            aria-label="Calls"
            title="Go to calls"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </motion.button>

          {/* Notifications Button */}
          <motion.button
            className={styles.notificationBtn}
            onClick={handleNotificationsClick}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            title="Go to notifications"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notificationBadge} aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Dark Mode Toggle */}
          <motion.button
            className={styles.headerBtn}
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={darkMode}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            type="button"
          >
            {darkMode ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </motion.button>

          {/* Settings Button */}
          <motion.button
            className={styles.headerBtn}
            onClick={handleSettingsClick}
            aria-label="Settings"
            title="Go to settings"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            type="button"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </motion.button>
        </nav>
      </div>
    </motion.header>
  );
});

/**
 * PropTypes validation
 */
Header.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired
};

Header.displayName = 'Header';

export default Header;