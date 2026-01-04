import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

const NotificationSettings = ({ user, settings, onUpdate, onSuccess }) => {
  const { t } = useLanguage();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  }, []);

  const handleToggle = async (setting, value) => {
    // Special handling for push notifications
    if (setting === 'push_notifications' && value) {
      if (!pushSupported) {
        alert('Push notifications are not supported in your browser');
        return;
      }

      if (pushPermission === 'denied') {
        alert('Push notifications are blocked. Please enable them in your browser settings.');
        return;
      }

      if (pushPermission === 'default') {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        
        if (permission !== 'granted') {
          alert('Push notifications permission was not granted');
          return;
        }
      }

      // Subscribe to push notifications
      try {
        await subscribeToPush();
      } catch (error) {
        console.error('Error subscribing to push:', error);
        alert('Failed to enable push notifications');
        return;
      }
    }

    if (setting === 'push_notifications' && !value) {
      // Unsubscribe from push notifications
      try {
        await unsubscribeFromPush();
      } catch (error) {
        console.error('Error unsubscribing from push:', error);
      }
    }

    const success = await onUpdate({ [setting]: value });
    if (success) {
      onSuccess('Notification settings updated');
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        
        if (vapidPublicKey) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });

          // Send subscription to backend
          // await sendSubscriptionToBackend(subscription);
        }
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // Remove subscription from backend
        // await removeSubscriptionFromBackend(subscription);
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleTestNotification = async () => {
    if (!pushSupported) {
      alert('Push notifications are not supported');
      return;
    }

    if (pushPermission !== 'granted') {
      alert('Please enable push notifications first');
      return;
    }

    setTestingNotification(true);

    try {
      // Show a test notification
      new Notification('Test Notification from Focus', {
        body: 'This is a test notification. Your notifications are working!',
        icon: '/focus-logo.png',
        badge: '/focus-badge.png',
        tag: 'test-notification',
        requireInteraction: false
      });

      onSuccess('Test notification sent!');
    } catch (error) {
      console.error('Error showing test notification:', error);
      alert('Failed to show test notification');
    } finally {
      setTimeout(() => setTestingNotification(false), 2000);
    }
  };

  return (
    <div className="notification-settings">
      <h2 className="section-title">{t('notifications.title')}</h2>

      {/* Push Notifications */}
      <div className="settings-group">
        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">{t('notifications.push')}</label>
            <p className="field-description">
              Enable browser push notifications
            </p>
            {!pushSupported && (
              <p className="field-warning">Not supported in your browser</p>
            )}
            {pushPermission === 'denied' && (
              <p className="field-warning">Blocked - enable in browser settings</p>
            )}
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.push_notifications ?? true}
              onChange={(e) => handleToggle('push_notifications', e.target.checked)}
              disabled={!pushSupported}
              role="switch"
              aria-checked={settings?.push_notifications ?? true}
            />
            <span className="switch-slider"></span>
          </label>
        </div>

        {settings?.push_notifications && pushSupported && pushPermission === 'granted' && (
          <button
            className="test-notification-button"
            onClick={handleTestNotification}
            disabled={testingNotification}
          >
            {testingNotification ? 'Sending...' : '🔔 Send Test Notification'}
          </button>
        )}
      </div>

      {/* Email Notifications */}
      <div className="settings-group">
        <div className="settings-field toggle-field">
          <div className="toggle-info">
            <label className="field-label">Email Notifications</label>
            <p className="field-description">
              Receive notifications via email
            </p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={settings?.email_notifications ?? false}
              onChange={(e) => handleToggle('email_notifications', e.target.checked)}
              role="switch"
              aria-checked={settings?.email_notifications ?? false}
            />
            <span className="switch-slider"></span>
          </label>
        </div>
      </div>

      {/* Notification Types */}
      <div className="settings-group">
        <h3 className="group-title">Notification Types</h3>

        <div className="notification-types-grid">
          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.likes')}</label>
              <p className="field-description">
                When someone likes your post
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_likes ?? true}
                onChange={(e) => handleToggle('notify_likes', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_likes ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.comments')}</label>
              <p className="field-description">
                When someone comments on your post
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_comments ?? true}
                onChange={(e) => handleToggle('notify_comments', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_comments ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.messages')}</label>
              <p className="field-description">
                New direct messages
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_messages ?? true}
                onChange={(e) => handleToggle('notify_messages', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_messages ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.tags')}</label>
              <p className="field-description">
                When someone tags you
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_tags ?? true}
                onChange={(e) => handleToggle('notify_tags', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_tags ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.followers')}</label>
              <p className="field-description">
                New followers
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_followers ?? true}
                onChange={(e) => handleToggle('notify_followers', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_followers ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.calls')}</label>
              <p className="field-description">
                Voice and video call invites
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_call_invites ?? true}
                onChange={(e) => handleToggle('notify_call_invites', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_call_invites ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.stories')}</label>
              <p className="field-description">
                New stories from people you follow
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_stories ?? true}
                onChange={(e) => handleToggle('notify_stories', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_stories ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.boltz')}</label>
              <p className="field-description">
                New Boltz from people you follow
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_boltz ?? true}
                onChange={(e) => handleToggle('notify_boltz', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_boltz ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>

          <div className="settings-field toggle-field">
            <div className="toggle-info">
              <label className="field-label">{t('notifications.flash')}</label>
              <p className="field-description">
                New Flash messages
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings?.notify_flash ?? true}
                onChange={(e) => handleToggle('notify_flash', e.target.checked)}
                role="switch"
                aria-checked={settings?.notify_flash ?? true}
              />
              <span className="switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
