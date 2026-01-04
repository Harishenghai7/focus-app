import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationToast.module.css';

/**
 * NotificationToast - Toast notification for user events.
 * @component
 * @param {Object} notification - Notification object
 * @param {function} onClose - Handler to close toast
 * @returns {React.ReactElement}
 */
const NotificationToast = React.memo(function NotificationToast({ notification, onClose }) {
  const navigate = useNavigate();

  if (!notification) return null;

  const handleClick = () => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.content_type === 'post') {
          navigate(`/post/${notification.content_id}`);
        } else if (notification.content_type === 'boltz') {
          navigate(`/boltz/${notification.content_id}`);
        }
        break;
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
        navigate(`/profile/${notification.actor?.username}`);
        break;
      case 'mention':
        if (notification.content_type === 'post') {
          navigate(`/post/${notification.content_id}`);
        } else if (notification.content_type === 'comment') {
          navigate(`/post/${notification.content_id}`);
        }
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'call':
      case 'call_missed':
        navigate('/calls');
        break;
      default:
        navigate('/notifications');
    }
    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
        return '👤';
      case 'mention':
        return '@';
      case 'message':
        return '✉️';
      case 'call':
        return '📞';
      case 'call_missed':
        return '📵';
      default:
        return '🔔';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles['notification-toast']}
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={handleClick}
      >
        <div className={styles['toast-icon']}>{getIcon()}</div>
        <div className={styles['toast-content']}>
          <div className={styles['toast-header']}>
            <img
              src={notification.actor?.avatar_url || `https://ui-avatars.com/api/?name=${notification.actor?.username}`}
              alt={notification.actor?.username}
              className={styles['toast-avatar']}
            />
            <span className={styles['toast-username']}>
              {notification.actor?.full_name || notification.actor?.username}
            </span>
            {notification.actor?.is_verified && (
              <svg className={styles['toast-verified']} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
          <p className={styles['toast-message']}>{notification.text}</p>
        </div>
        <button className={styles['toast-close']} onClick={(e) => { e.stopPropagation(); onClose(); }}>
          ×
        </button>
      </motion.div>
    </AnimatePresence>
  );
});

NotificationToast.displayName = 'NotificationToast';
NotificationToast.propTypes = {
  notification: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default NotificationToast;
