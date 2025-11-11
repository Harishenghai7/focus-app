import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveSessions, logoutAllDevices, logoutSession } from '../utils/sessionManager';
import './SessionManagement.css';

export default function SessionManagement({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const activeSessions = await getActiveSessions(user.id);
      setSessions(activeSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setMessage('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? You will need to sign in again.')) {
      return;
    }

    try {
      setActionLoading('all');
      await logoutAllDevices(user.id);
      // User will be redirected to login by App.js
    } catch (error) {
      console.error('Error logging out from all devices:', error);
      setMessage('Failed to log out from all devices');
      setActionLoading(null);
    }
  };

  const handleLogoutSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to log out this device?')) {
      return;
    }

    try {
      setActionLoading(sessionId);
      await logoutSession(sessionId);
      setMessage('Device logged out successfully');
      await loadSessions();
    } catch (error) {
      console.error('Error logging out session:', error);
      setMessage('Failed to log out device');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'Mobile':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'Tablet':
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="session-management">
      <div className="section-header">
        <div>
          <h3>Active Sessions</h3>
          <p>Manage devices where you're currently signed in</p>
        </div>
        <button
          className="logout-all-button"
          onClick={handleLogoutAll}
          disabled={loading || actionLoading === 'all' || sessions.length === 0}
        >
          {actionLoading === 'all' ? 'Logging out...' : 'Log Out All Devices'}
        </button>
      </div>

      {message && (
        <motion.div
          className="session-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {message}
        </motion.div>
      )}

      {loading ? (
        <div className="sessions-loading">
          <div className="spinner" />
          <p>Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="no-sessions">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p>No active sessions found</p>
        </div>
      ) : (
        <div className="sessions-list">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                className="session-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="session-icon">
                  {getDeviceIcon(session.device_type)}
                </div>
                <div className="session-info">
                  <div className="session-device">
                    <span className="device-name">
                      {session.device_type} • {session.browser}
                    </span>
                    <span className="current-badge">Current</span>
                  </div>
                  <div className="session-details">
                    <span>{session.os}</span>
                    <span>•</span>
                    <span>Last active {formatDate(session.last_active_at)}</span>
                  </div>
                </div>
                <button
                  className="logout-session-button"
                  onClick={() => handleLogoutSession(session.id)}
                  disabled={actionLoading === session.id}
                >
                  {actionLoading === session.id ? (
                    <div className="spinner-small" />
                  ) : (
                    'Log Out'
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
