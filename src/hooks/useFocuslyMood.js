/**
 * useFocuslyMood.js
 * ==================
 * 🦁 The Emotion Engine - Contextual Mood Detection
 * 
 * Features:
 * - Screen Awareness: Different moods for different screens
 * - Interaction Awareness: Reacts to user interactions (likes, scrolls)
 * - Time Awareness: Night mode after 10 PM
 * - Micro-Interaction State Machine: Cloud gazing, wind-blown, roar
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook for Focusly's emotional state
 * Determines mood based on screen, interactions, and time
 */
export const useFocuslyMood = (user, userProfile) => {
  const [mood, setMood] = useState('idle');
  const [isNightMode, setIsNightMode] = useState(false);
  const [microState, setMicroState] = useState('idle'); // cloud_gazing, wind_blown, roar
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  
  const { pathname } = useLocation();

  // ============================================================================
  // TIME AWARENESS - Night Mode after 10 PM
  // ============================================================================
  
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      const isNight = hour >= 22 || hour < 6; // 10 PM to 6 AM
      setIsNightMode(isNight);
      
      // Change mood to sleepy if night mode
      if (isNight && mood === 'idle') {
        setMood('sleepy');
      } else if (!isNight && mood === 'sleepy') {
        setMood('idle');
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [mood]);

  // ============================================================================
  // SCREEN AWARENESS - Different moods for different screens
  // ============================================================================
  
  useEffect(() => {
    let screenMood = 'idle';
    
    if (pathname.includes('/settings')) {
      screenMood = 'guide'; // Helpful guide on settings
    } else if (pathname.includes('/guardian') || pathname.includes('/security')) {
      screenMood = 'guardian'; // Protective on guardian screens
    } else if (pathname.includes('/create')) {
      screenMood = 'creative'; // Inspiring on create screen
    } else if (pathname.includes('/explore')) {
      screenMood = 'curious'; // Curious on explore
    } else if (pathname.includes('/messages')) {
      screenMood = 'social'; // Social on messages
    } else if (pathname.includes('/profile')) {
      screenMood = 'proud'; // Proud on profile
    }
    
    // Only override if not in a strong emotional state
    if (!['concerned', 'worried', 'celebrating'].includes(mood)) {
      setMood(screenMood);
    }
  }, [pathname, mood]);

  // ============================================================================
  // INTERACTION AWARENESS - React to user interactions
  // ============================================================================
  
  const handleInteraction = useCallback((type) => {
    setLastInteraction(Date.now());
    
    switch (type) {
      case 'like':
      case 'pulse':
        // Wink or happy reaction
        setMicroState('wink');
        setTimeout(() => setMicroState('idle'), 1000);
        break;
      case 'scroll_fast':
        // Wind-blown state
        setMicroState('wind_blown');
        setTimeout(() => setMicroState('idle'), 2000);
        break;
      case 'goal_reached':
        // Roar with celebration
        setMicroState('roar');
        setMood('celebrating');
        setTimeout(() => {
          setMicroState('idle');
          setMood('idle');
        }, 3000);
        break;
      case 'idle_start':
        // Cloud gazing when idle
        setMicroState('cloud_gazing');
        break;
      case 'idle_end':
        // Return to normal when activity resumes
        setMicroState('idle');
        break;
      default:
        break;
    }
  }, []);

  // ============================================================================
  // MICRO-INTERACTION STATE MACHINE
  // ============================================================================
  
  useEffect(() => {
    // Detect idle state (60 seconds of inactivity)
    const idleTimer = setTimeout(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;
      if (timeSinceInteraction >= 60000 && microState === 'idle') {
        handleInteraction('idle_start');
      }
    }, 60000);
    
    return () => clearTimeout(idleTimer);
  }, [lastInteraction, microState, handleInteraction]);

  // ============================================================================
  // GET CONTEXTUAL MESSAGE
  // ============================================================================
  
  const getContextualMessage = useCallback(() => {
    if (isNightMode) {
      return "Macha, rest is growth. The Nation will be here when you wake up.";
    }
    
    if (mood === 'guide') {
      return "I'm here to help you customize your experience, Macha.";
    }
    
    if (mood === 'guardian') {
      return "Macha, I'm standing guard here. Your ward is safe.";
    }
    
    if (mood === 'creative') {
      return "Let your creativity flow, Macha! What vision will you share?";
    }
    
    if (mood === 'curious') {
      return "Discovering something interesting, Macha?";
    }
    
    if (mood === 'social') {
      return "Connecting with your tribe, Macha! 💬";
    }
    
    if (mood === 'proud') {
      return "Your legacy is growing, Macha! Look how far you've come.";
    }
    
    return "I'm here with you, Macha!";
  }, [mood, isNightMode]);

  // ============================================================================
  // GET RIVE STATE
  // ============================================================================
  
  const getRiveState = useCallback(() => {
    // Micro-interactions take priority
    if (microState === 'cloud_gazing') return 'cloud_gazing';
    if (microState === 'wind_blown') return 'wind_blown';
    if (microState === 'roar') return 'roar';
    if (microState === 'wink') return 'wink';
    
    // Mood-based states
    if (isNightMode) return 'sleepy';
    if (mood === 'concerned' || mood === 'worried') return 'concerned';
    if (mood === 'celebrating') return 'celebrating';
    if (mood === 'guide') return 'guide';
    if (mood === 'guardian') return 'guardian';
    if (mood === 'creative') return 'creative';
    
    return 'idle';
  }, [microState, isNightMode, mood]);

  return {
    mood,
    isNightMode,
    microState,
    handleInteraction,
    getContextualMessage,
    getRiveState,
    setMood
  };
};

export default useFocuslyMood;
