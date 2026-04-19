/**
 * useFocuslyPresence.js
 * =====================
 * Tracks user inactivity and triggers Focusly's "Concerned" mode
 * If user hasn't posted or interacted in 2+ days → Focusly appears worried
 * Generates motivational voice note and sends push notification
 *
 * H2 Innovative — Focusly AI: The Living Soul
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const INACTIVITY_THRESHOLD_HOURS = 48; // 2 days
const PRESENCE_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // Every 5 mins

export const useFocuslyPresence = () => {
  const { user } = useAuth();
  const [isInactive, setIsInactive] = useState(false);
  const [inactivityHours, setInactivityHours] = useState(0);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [focuslyMood, setFocuslyMood] = useState('neutral'); // reactive Focusly emotion
  const intervalRef = useRef(null);

  // ── Record user interaction (call this on any meaningful action) ───────────
  const recordInteraction = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('focusly_presence')
        .upsert({
          user_id: user.id,
          last_interaction_at: new Date().toISOString(),
          inactivity_nudge_sent: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      setIsInactive(false);
      setFocuslyMood('neutral');
    } catch (err) {
      // Non-blocking
    }
  }, [user?.id]);

  // ── Record when user makes a post ─────────────────────────────────────────
  const recordPost = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('focusly_presence')
        .upsert({
          user_id: user.id,
          last_post_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          inactivity_nudge_sent: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (err) { /* non-blocking */ }
  }, [user?.id]);

  // ── Check inactivity status ────────────────────────────────────────────────
  const checkInactivity = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('focusly_presence')
        .select('last_interaction_at, last_post_at, inactivity_nudge_sent, nudge_sent_at')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // No presence record — user is new, create one
        await recordInteraction();
        return;
      }

      const lastInteraction = new Date(data.last_interaction_at || data.last_post_at || Date.now());
      const hoursSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);

      setInactivityHours(Math.round(hoursSince));

      if (hoursSince >= INACTIVITY_THRESHOLD_HOURS) {
        setIsInactive(true);

        // Determine Focusly emotion based on how long they've been away
        if (hoursSince >= 72) {
          setFocuslyMood('idle_nervous'); // 3+ days
        } else {
          setFocuslyMood('sad'); // 2 days — concerned
        }

        // Send nudge notification if not already sent
        if (!data.inactivity_nudge_sent) {
          await sendInactivityNudge(hoursSince);

          // Mark nudge as sent
          await supabase
            .from('focusly_presence')
            .update({
              inactivity_nudge_sent: true,
              nudge_sent_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          setNudgeSent(true);
        }
      } else {
        setIsInactive(false);
        // Graduated mood — slightly concerned if > 24h
        if (hoursSince >= 24) {
          setFocuslyMood('thinking_focus');
        } else {
          setFocuslyMood('neutral');
        }
      }
    } catch (err) {
      // Non-blocking
    }
  }, [user?.id, recordInteraction]);

  // ── Send inactivity nudge notification ─────────────────────────────────────
  const sendInactivityNudge = useCallback(async (hoursSince) => {
    if (!user?.id) return;
    try {
      const days = Math.floor(hoursSince / 24);
      const message = days >= 3
        ? `Macha, ${days} days? Focusly has been searching for you 🦁 Your story isn't finished yet.`
        : `Hey! Focusly misses you. It's been ${days > 1 ? `${days} days` : 'over a day'} — come share something real. 💜`;

      // Insert notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'focusly_nudge',
        title: 'Focusly misses you 🦁',
        message,
        actor_id: null,
        read: false,
      });
    } catch (err) { /* non-blocking */ }
  }, [user?.id]);

  // ── Get motivational message based on inactivity duration ─────────────────
  const getMotivationalMessage = useCallback(() => {
    if (inactivityHours >= 72) {
      return {
        title: "Focusly has been worried about you 🦁",
        message: `It's been ${Math.floor(inactivityHours / 24)} days. Your transformation doesn't pause — but we do pause for you. How are you doing today?`,
        cta: "Tell Focusly how you're doing",
        emotion: 'idle_nervous',
      };
    }
    if (inactivityHours >= 48) {
      return {
        title: "Focusly is thinking of you 💜",
        message: "2 days away... that's okay. Growth happens offline too. But your Focus family is waiting. What's on your mind?",
        cta: "Share something real",
        emotion: 'sad',
      };
    }
    return null;
  }, [inactivityHours]);

  // ── Start presence tracking on mount ───────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // Initial check
    checkInactivity();

    // Record this session as an interaction
    recordInteraction();

    // Periodic check every 5 minutes
    intervalRef.current = setInterval(checkInactivity, PRESENCE_UPDATE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.id, checkInactivity, recordInteraction]);

  return {
    isInactive,
    inactivityHours,
    nudgeSent,
    focuslyMood,    // Use this to set Focusly's emotion state reactively
    recordInteraction,
    recordPost,
    checkInactivity,
    getMotivationalMessage,
  };
};

export default useFocuslyPresence;
