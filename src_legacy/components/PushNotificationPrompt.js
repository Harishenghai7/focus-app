import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import pushNotifications from '../utils/pushNotifications';
import './PushNotificationPrompt.css';

/**
 * PushNotificationPrompt Component
 * Prompts user to enable push notifications
 */
export default function PushNotificationPrompt({ user }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if we should show the prompt
    const checkPermission = async () => {
      const permission = pushNotifications.getPermissionStatus();
      
      // Don't show if already granted or denied
      if (permission === 'granted' || permission === 'denied') {
        return;
      }

      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('push_notification_prompt_dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        
        // Show again after 7 days
        if (daysSinceDismissed < 7) {
          return;
        }
      }

      // Show prompt after a short delay (3 seconds)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    checkPermission();
  }, [user]);

  const handleEnable = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await pushNotifications.requestPermission();
      
      if (granted) {
        setShowPrompt(false);
      } else {
        setShowPrompt(false);
        // Store dismissal time
        localStorage.setItem('push_notification_prompt_dismissed', Date.now().toString());
      }
    } catch (error) {
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time
    localStorage.setItem('push_notification_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="push-notification-prompt-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
      >
        <motion.div
          className="push-notification-prompt"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="prompt-icon">🔔</div>
          <h3 className="prompt-title">Stay Updated</h3>
          <p className="prompt-message">
            Enable notifications to get instant updates when someone likes, comments, or messages you.
          </p>
          <div className="prompt-actions">
            <button
              className="prompt-btn prompt-btn-primary"
              onClick={handleEnable}
              disabled={isRequesting}
            >
              {isRequesting ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              className="prompt-btn prompt-btn-secondary"
              onClick={handleDismiss}
              disabled={isRequesting}
            >
              Not Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
