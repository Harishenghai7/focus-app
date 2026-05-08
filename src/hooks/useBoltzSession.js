/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useBoltzSession — Mindful Consumption Session Tracking
 * Tracks watch time, video count, and suggests healthy break points
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { shouldInsertBreakPoint } from '../services/boltzRecommendationEngine';

const SESSION_STORAGE_KEY = 'boltz_session_state';

const loadSessionState = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire sessions older than 1 hour
    if (Date.now() - parsed.lastActive > 3600000) return null;
    return parsed;
  } catch { return null; }
};

const saveSessionState = (state) => {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...state, lastActive: Date.now() }));
  } catch {}
};

export const useBoltzSession = () => {
  const saved = loadSessionState();
  const [sessionMinutes, setSessionMinutes] = useState(saved?.sessionMinutes || 0);
  const [videosWatched, setVideosWatched] = useState(saved?.videosWatched || 0);
  const [lastBreakAt, setLastBreakAt] = useState(saved?.lastBreakAt || 0);
  const [breakSuggestion, setBreakSuggestion] = useState(null);
  const [showBreak, setShowBreak] = useState(false);
  const [sessionStartTime] = useState(saved?.startTime || Date.now());
  const intervalRef = useRef(null);

  // Track session duration
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const mins = (Date.now() - sessionStartTime) / 60000;
      setSessionMinutes(mins);
    }, 10000); // Update every 10 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionStartTime]);

  // Persist session state
  useEffect(() => {
    saveSessionState({
      sessionMinutes,
      videosWatched,
      lastBreakAt,
      startTime: sessionStartTime,
    });
  }, [sessionMinutes, videosWatched, lastBreakAt, sessionStartTime]);

  // Check for break points
  useEffect(() => {
    const suggestion = shouldInsertBreakPoint({
      sessionMinutes,
      videosWatched,
      lastBreakAt,
    });

    if (suggestion && !breakSuggestion) {
      setBreakSuggestion(suggestion);
      setShowBreak(true);
    }
  }, [sessionMinutes, videosWatched, lastBreakAt, breakSuggestion]);

  // Increment video count
  const trackVideoWatched = useCallback(() => {
    setVideosWatched(prev => prev + 1);
  }, []);

  // Dismiss break suggestion
  const dismissBreak = useCallback(() => {
    setShowBreak(false);
    setLastBreakAt(sessionMinutes);
    setBreakSuggestion(null);
  }, [sessionMinutes]);

  // Take a break (could navigate away or show calm screen)
  const takeBreak = useCallback(() => {
    setShowBreak(false);
    setLastBreakAt(sessionMinutes);
    setBreakSuggestion(null);
  }, [sessionMinutes]);

  // Reset session
  const resetSession = useCallback(() => {
    setSessionMinutes(0);
    setVideosWatched(0);
    setLastBreakAt(0);
    setBreakSuggestion(null);
    setShowBreak(false);
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch {}
  }, []);

  // Format time for display
  const formattedTime = `${Math.floor(sessionMinutes)}m`;

  return {
    sessionMinutes,
    videosWatched,
    formattedTime,
    breakSuggestion,
    showBreak,
    trackVideoWatched,
    dismissBreak,
    takeBreak,
    resetSession,
    sessionContext: { sessionMinutes, videosWatched, lastBreakAt },
  };
};

export default useBoltzSession;
