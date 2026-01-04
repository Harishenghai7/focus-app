import React, { useState, useEffect } from 'react';
import styles from './OfflineIndicator.module.css';

/**
 * OfflineIndicator Component
 * Shows a banner when user goes offline
 */
const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Show "back online" message briefly
            setShowBanner(true);
            setTimeout(() => setShowBanner(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Don't show anything if online and banner not triggered
    if (isOnline && !showBanner) return null;

    return (
        <div
            className={`${styles.banner} ${isOnline ? styles.online : styles.offline}`}
            role="alert"
            aria-live="polite"
        >
            <span className={styles.icon}>
                {isOnline ? '✅' : '📡'}
            </span>
            <span className={styles.message}>
                {isOnline
                    ? "You're back online!"
                    : "You're offline. Some features may not work."}
            </span>
        </div>
    );
};

export default OfflineIndicator;
