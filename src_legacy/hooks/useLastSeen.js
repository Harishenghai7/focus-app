import { useState, useEffect } from 'react';

/**
 * useLastSeen
 * User last seen timestamp (mocked for demo).
 * @param {string} userId - User ID to track
 * @returns {string} lastSeen
 * @example
 * const lastSeen = useLastSeen(userId);
 */
export default function useLastSeen(userId) {
  const [lastSeen, setLastSeen] = useState('just now');
  useEffect(() => {
    // Replace with real-time logic (e.g., WebSocket)
    const timer = setTimeout(() => setLastSeen('2 minutes ago'), 4000);
    return () => clearTimeout(timer);
  }, [userId]);
  return lastSeen;
}
