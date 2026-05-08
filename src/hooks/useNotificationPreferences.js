/**
 * ═══════════════════════════════════════════════════════════════════════════
 * useNotificationPreferences — Focus Sovereign Ecosystem
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Manages user notification preferences with Supabase persistence.
 * Local-first with background sync for instant UI response.
 *
 * Preferences:
 *   - quietMode, focusMode
 *   - quietHours (scheduled auto-quiet)
 *   - mutedTypes (per-type muting)
 *   - digestFrequency
 *   - soundEnabled, vibrationEnabled
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isWithinQuietHours } from '../services/notificationService';

const STORAGE_KEY = 'focus_notification_prefs';
const SYNC_DEBOUNCE = 1500;

const DEFAULT_PREFS = {
  quietMode: false,
  focusMode: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
  mutedTypes: [],
  digestFrequency: 'realtime', // 'realtime' | 'hourly' | 'daily'
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Read cached prefs from localStorage (instant).
 */
const readCache = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

/**
 * Write to localStorage cache.
 */
const writeCache = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Silent fail — localStorage might be full
  }
};

export const useNotificationPreferences = (userId) => {
  const [prefs, setPrefs] = useState(readCache);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const syncTimer = useRef(null);
  const mounted = useRef(true);

  // Derived state: is quiet hours currently active?
  const isQuietHoursActive = isWithinQuietHours(prefs.quietHours);
  const effectiveQuietMode = prefs.quietMode || isQuietHoursActive;

  // ── Fetch from Supabase on mount ────────────────────────
  useEffect(() => {
    mounted.current = true;

    const fetchPrefs = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('notification_preferences')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('[NotifPrefs] Fetch error:', error);
        }

        if (data?.notification_preferences && mounted.current) {
          const merged = { ...DEFAULT_PREFS, ...data.notification_preferences };
          setPrefs(merged);
          writeCache(merged);
        }
      } catch (err) {
        console.error('[NotifPrefs] Unexpected error:', err);
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    fetchPrefs();

    return () => {
      mounted.current = false;
    };
  }, [userId]);

  // ── Sync to Supabase (debounced) ────────────────────────
  const syncToServer = useCallback(
    async (newPrefs) => {
      if (!userId) return;
      setSyncing(true);

      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: userId,
              notification_preferences: newPrefs,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error('[NotifPrefs] Sync error:', error);
        }
      } catch (err) {
        console.error('[NotifPrefs] Sync failed:', err);
      } finally {
        if (mounted.current) setSyncing(false);
      }
    },
    [userId]
  );

  /**
   * Update preferences — local-first, then background sync.
   */
  const updatePrefs = useCallback(
    (updates) => {
      setPrefs((prev) => {
        const next = { ...prev, ...updates };
        writeCache(next);

        // Debounced server sync
        clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => syncToServer(next), SYNC_DEBOUNCE);

        return next;
      });
    },
    [syncToServer]
  );

  // ── Convenience setters ─────────────────────────────────

  const toggleQuietMode = useCallback(() => {
    updatePrefs({ quietMode: !prefs.quietMode });
  }, [prefs.quietMode, updatePrefs]);

  const toggleFocusMode = useCallback(() => {
    updatePrefs({ focusMode: !prefs.focusMode });
  }, [prefs.focusMode, updatePrefs]);

  const setQuietHours = useCallback(
    (quietHours) => {
      updatePrefs({ quietHours: { ...prefs.quietHours, ...quietHours } });
    },
    [prefs.quietHours, updatePrefs]
  );

  const muteType = useCallback(
    (type) => {
      if (!prefs.mutedTypes.includes(type)) {
        updatePrefs({ mutedTypes: [...prefs.mutedTypes, type] });
      }
    },
    [prefs.mutedTypes, updatePrefs]
  );

  const unmuteType = useCallback(
    (type) => {
      updatePrefs({ mutedTypes: prefs.mutedTypes.filter((t) => t !== type) });
    },
    [prefs.mutedTypes, updatePrefs]
  );

  const toggleSound = useCallback(() => {
    updatePrefs({ soundEnabled: !prefs.soundEnabled });
  }, [prefs.soundEnabled, updatePrefs]);

  const setDigestFrequency = useCallback(
    (freq) => {
      updatePrefs({ digestFrequency: freq });
    },
    [updatePrefs]
  );

  // ── Cleanup ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(syncTimer.current);
    };
  }, []);

  return {
    // State
    prefs,
    loading,
    syncing,

    // Derived
    effectiveQuietMode,
    isQuietHoursActive,

    // Actions
    updatePrefs,
    toggleQuietMode,
    toggleFocusMode,
    setQuietHours,
    muteType,
    unmuteType,
    toggleSound,
    setDigestFrequency,
  };
};
