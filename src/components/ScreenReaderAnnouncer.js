import React, { useEffect, useState } from 'react';

/**
 * Screen Reader Announcer Component
 * Provides live region for announcing dynamic content changes to screen readers
 */
export default function ScreenReaderAnnouncer() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Listen for custom announcement events
    const handleAnnouncement = (event) => {
      const { message, priority = 'polite' } = event.detail;
      
      setAnnouncements(prev => [...prev, { 
        id: Date.now(), 
        message, 
        priority 
      }]);

      // Remove announcement after it's been read
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== event.detail.id));
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
        className="sr-only"
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
        className="sr-only"
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
}

/**
 * Helper function to trigger announcements
 */
export const announce = (message, priority = 'polite') => {
  const event = new CustomEvent('announce', {
    detail: { id: Date.now(), message, priority }
  });
  window.dispatchEvent(event);
};
