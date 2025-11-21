import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './ScreenReaderAnnouncer.module.css';

/**
 * ScreenReaderAnnouncer
 * Provides a live region for announcing dynamic content changes to screen readers.
 * This component does not accept props and should be placed at the root of your app.
 *
 * @component
 * @example
 * <ScreenReaderAnnouncer />
 */
const ScreenReaderAnnouncer = React.memo(function ScreenReaderAnnouncer() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    /**
     * Handles custom 'announce' events and updates announcements state.
     * @param {CustomEvent} event - The custom event containing announcement details.
     */
    const handleAnnouncement = (event) => {
      const { message, priority = 'polite', id } = event.detail;
      setAnnouncements(prev => [...prev, { id, message, priority }]);
      // Remove announcement after it's been read
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }, 1000);
    };
    window.addEventListener('announce', handleAnnouncement);
    return () => {
      window.removeEventListener('announce', handleAnnouncement);
    };
  }, []);

  return (
    <>
      {/* Polite announcements - don't interrupt */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {announcements
          .filter(a => a.priority === 'polite')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))
        }
      </div>
      {/* Assertive announcements - interrupt immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {announcements
          .filter(a => a.priority === 'assertive')
          .map(a => (
            <div key={a.id}>{a.message}</div>
          ))
        }
      </div>
    </>
  );
});

ScreenReaderAnnouncer.displayName = 'ScreenReaderAnnouncer';
ScreenReaderAnnouncer.propTypes = {};

/**
 * Triggers a screen reader announcement via a custom event.
 *
 * @param {string} message - The message to announce.
 * @param {'polite'|'assertive'} [priority='polite'] - The priority of the announcement.
 */
export const announce = (message, priority = 'polite') => {
  const event = new CustomEvent('announce', {
    detail: { id: Date.now(), message, priority }
  });
  window.dispatchEvent(event);
};

export default ScreenReaderAnnouncer;
