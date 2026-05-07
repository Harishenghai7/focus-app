/**
 * useProactiveInteractions.js
 * ==========================
 * 🦁 Proactive Event-Driven Interactions for Focusly
 * 
 * Features:
 * - Idle detection (triggers after 60 seconds of inactivity)
 * - Delete confirmation (concerned state when user tries to delete)
 * - Create screen assistance (creative spark suggestions)
 * - Milestone triggers (celebrations)
 * - Toxic content warnings
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for proactive interactions
 * Monitors user behavior and triggers Focusly responses
 */
export const useProactiveInteractions = (user, userProfile, onTriggerInteraction) => {
  const [isIdle, setIsIdle] = useState(false);
  const [idleTime, setIdleTime] = useState(0);
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const { pathname } = useLocation();

  // Idle detection threshold (60 seconds)
  const IDLE_THRESHOLD = 60000;

  /**
   * Reset idle timer on user activity
   */
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setIdleTime(0);
  }, []);

  /**
   * Monitor user activity
   */
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetIdleTimer]);

  /**
   * Check for idle state periodically
   */
  useEffect(() => {
    const checkIdle = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      
      if (timeSinceActivity >= IDLE_THRESHOLD && !isIdle) {
        setIsIdle(true);
        
        // Trigger proactive message based on current screen
        const screen = pathname;
        let message = null;

        if (screen.includes('/create')) {
          message = "Macha, need a creative spark? I've got a Sovereign Idea for you.";
        } else if (screen.includes('/home')) {
          message = "Hey Macha! Want to explore what the community is up to?";
        } else if (screen.includes('/explore')) {
          message = "Finding something interesting, Macha?";
        } else if (screen.includes('/profile')) {
          message = "Your legacy is growing, Macha! Keep building it.";
        } else if (screen.includes('/settings')) {
          message = "Customizing your experience, Macha? Good choice!";
        }

        if (message && onTriggerInteraction) {
          onTriggerInteraction({
            type: 'idle',
            message,
            severity: 'info'
          });
        }
      }
    };

    idleTimerRef.current = setInterval(checkIdle, 5000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [isIdle, pathname, onTriggerInteraction]);

  /**
   * Trigger delete confirmation interaction
   */
  const triggerDeleteConfirmation = useCallback((itemType = 'post') => {
    const messages = {
      post: "You sure, Macha? That vision was powerful.",
      message: "Think carefully, Macha. This conversation matters.",
      comment: "Are you certain, Macha? Your words have impact.",
      default: "You sure, Macha? This can't be undone."
    };

    const message = messages[itemType] || messages.default;

    if (onTriggerInteraction) {
      onTriggerInteraction({
        type: 'delete_confirmation',
        message,
        severity: 'warning',
        itemType
      });
    }
  }, [onTriggerInteraction]);

  /**
   * Trigger creative spark suggestion
   */
  const triggerCreativeSpark = useCallback(() => {
    const sparks = [
      "How about sharing a moment of gratitude, Macha?",
      "What's something that made you smile today?",
      "Share a tip that helped you stay focused!",
      "What's a goal you're working toward?",
      "Share something that inspires you!"
    ];

    const message = sparks[Math.floor(Math.random() * sparks.length)];

    if (onTriggerInteraction) {
      onTriggerInteraction({
        type: 'creative_spark',
        message,
        severity: 'info'
      });
    }
  }, [onTriggerInteraction]);

  /**
   * Trigger milestone celebration
   */
  const triggerMilestone = useCallback((milestone) => {
    if (onTriggerInteraction) {
      onTriggerInteraction({
        type: 'milestone',
        message: `Macha, ${milestone}! You're building an amazing legacy! 🎉`,
        severity: 'celebration',
        milestone
      });
    }
  }, [onTriggerInteraction]);

  /**
   * Trigger toxic content warning
   */
  const triggerToxicWarning = useCallback(() => {
    const warnings = [
      "Don't let that frequency disturb your Focus, Buddy. I've already alerted the Guard. 🛡️",
      "Macha, I detected something toxic. Stay focused on the positive! I've got your back.",
      "Negative energy detected, Macha. Don't worry - I'm handling it. You stay focused!",
      "Toxic content blocked, Macha. Your peace of mind is protected. Keep shining! ✨"
    ];

    const message = warnings[Math.floor(Math.random() * warnings.length)];

    if (onTriggerInteraction) {
      onTriggerInteraction({
        type: 'toxic_warning',
        message,
        severity: 'warning'
      });
    }
  }, [onTriggerInteraction]);

  /**
   * Trigger welcome message on screen change
   */
  const triggerScreenWelcome = useCallback((screen) => {
    const welcomes = {
      home: "Welcome home, Macha! Ready to share your vision?",
      explore: "Explore the community, Macha! Discover new inspirations!",
      create: "Time to create, Macha! What's on your mind?",
      boltz: "Boltz mode activated, Macha! Let your creativity flow!",
      profile: "Your legacy, Macha! Look how far you've come!",
      messages: "Connecting with your tribe, Macha! 💬",
      settings: "Customize your experience, Macha!",
      notifications: "Stay in the loop, Macha!"
    };

    const message = welcomes[screen?.toLowerCase()] || "I'm here, Macha! What can I help with?";

    if (onTriggerInteraction) {
      onTriggerInteraction({
        type: 'screen_welcome',
        message,
        severity: 'info',
        screen
      });
    }
  }, [onTriggerInteraction]);

  return {
    isIdle,
    idleTime,
    resetIdleTimer,
    triggerDeleteConfirmation,
    triggerCreativeSpark,
    triggerMilestone,
    triggerToxicWarning,
    triggerScreenWelcome
  };
};

export default useProactiveInteractions;
