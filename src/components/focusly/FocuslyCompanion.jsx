/**
 * FocuslyCompanion.jsx
 * ===================
 * 🦁 The Global Draggable Companion Widget - "ALIVE" Edition
 * 
 * Features:
 * - Tri-Layer Brain integration (Local SLM + Gemini)
 * - Rive State Machine animations (blinking, breathing, thinking)
 * - Enhanced framer-motion physics with spring animations
 * - Portal-based rendering (global singleton)
 * - Context awareness (knows current screen)
 * - Emotional pulse sync with user restriction status
 * - Web Speech API for voice output with Sovereign Whisper
 * - Event-driven proactive interactions (idle detection, delete confirmation)
 * - Long-press shrink animation with shy behavior
 * - Eye-following cursor/touch
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import FocuslyMascot from './FocuslyMascot';
import { processMessage, getContextGreeting, detectEmotionalState, getRecentMemories, celebrateMilestone, generateToxicWarning, checkInactivity } from '../../utils/FocuslyBrain';
import { useFocuslyVoice } from '../../hooks/useFocuslyVoice';
import { useProactiveInteractions } from '../../hooks/useProactiveInteractions';
import { useFocuslyMood } from '../../hooks/useFocuslyMood';
import styles from './FocuslyCompanion.module.css';

// Royal Lavender color palette
const COLORS = {
  lavender: '#9B7EBD',
  lavenderGlow: 'rgba(155, 126, 189, 0.6)',
  lavenderDark: '#7A5FA0',
  warningRed: 'rgba(255, 82, 82, 0.6)',
  successGreen: 'rgba(76, 175, 80, 0.6)',
  neutral: 'rgba(156, 163, 175, 0.6)'
};

const FocuslyCompanion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [emotionalState, setEmotionalState] = useState({ mood: 'neutral', confidence: 0.5 });
  const [recentMemories, setRecentMemories] = useState([]);
  const [riveState, setRiveState] = useState('idle'); // Rive state machine state
  const [isShrinking, setIsShrinking] = useState(false);
  const [eyeX, setEyeX] = useState(0);
  const [eyeY, setEyeY] = useState(0);
  const [showNightcap, setShowNightcap] = useState(false);
  const [lastPostTime, setLastPostTime] = useState(null);
  
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Voice and proactive interaction hooks
  const { speak, isSpeaking } = useFocuslyVoice();
  // ============================================================================
  // PROACTIVE INTERACTION HANDLER
  // ============================================================================
  
  const handleProactiveInteraction = useCallback((interaction) => {
    const { type, message, severity } = interaction;
    
    setResponse(message);
    setIsOpen(true);
    
    // Speak the message with Sovereign Whisper effect
    if (message) {
      speak(message, { rate: 1.1, pitch: 1.2 });
    }
    
    // Set emotional state based on severity
    if (severity === 'warning') {
      setEmotionalState({ mood: 'worried', confidence: 0.9 });
      setRiveState('concerned');
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 3000);
    } else if (severity === 'celebration') {
      setEmotionalState({ mood: 'celebratory', confidence: 0.9 });
      setRiveState('celebrating');
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 2000);
    } else {
      setRiveState('idle');
    }
  }, [speak]);

  const { isIdle, triggerDeleteConfirmation, triggerCreativeSpark, triggerMilestone, triggerToxicWarning, triggerScreenWelcome } = useProactiveInteractions(
    user,
    userProfile,
    handleProactiveInteraction
  );
  
  // Mood hook for screen/interaction/time awareness
  const { 
    mood: focuslyMood, 
    isNightMode, 
    microState, 
    handleInteraction: handleMoodInteraction, 
    getContextualMessage, 
    getRiveState: getMoodRiveState 
  } = useFocuslyMood(user, userProfile);
  
  // Rive animation with state machine
  const { rive, RiveComponent } = useRive({
    src: '/assets/focusly/focusly.riv',
    stateMachines: 'SovereignState',
    autoplay: true,
    antialiasing: false // Performance optimization for 8GB hardware
  });
  
  // State machine input for mood control
  const moodInput = useStateMachineInput(rive, 'SovereignState', 'MoodLevel');
  
  const longPressTimer = useRef(null);
  const containerRef = useRef(null);
  
  // Motion values for dragging with spring physics
  const x = useMotionValue(window.innerWidth - 100);
  const y = useMotionValue(window.innerHeight - 200);
  
  // Spring physics for natural movement
  const springX = useSpring(x, { stiffness: 600, damping: 20 });
  const springY = useSpring(y, { stiffness: 600, damping: 20 });
  
  // Transform values for visual feedback
  const scale = useTransform(x, [-100, 0, 100], [0.9, 1, 0.9]);
  const rotate = useTransform(y, [-100, 0, 100], [-5, 0, 5]);
  
  // ============================================================================
  // CONTEXT AWARENESS - Screen Detection
  // ============================================================================
  
  useEffect(() => {
    const pathname = location.pathname;
    let screen = 'home';
    
    if (pathname === '/') screen = 'home';
    else if (pathname.includes('/explore')) screen = 'explore';
    else if (pathname.includes('/create')) screen = 'create';
    else if (pathname.includes('/boltz')) screen = 'boltz';
    else if (pathname.includes('/profile')) screen = 'profile';
    else if (pathname.includes('/messages')) screen = 'messages';
    else if (pathname.includes('/settings')) screen = 'settings';
    else if (pathname.includes('/notifications')) screen = 'notifications';
    else if (pathname.includes('/guardian')) screen = 'guardian';
    else if (pathname.includes('/security')) screen = 'security';
    
    setCurrentScreen(screen);
    
    // Contextual whisper for specific screens
    if (screen === 'guardian' || screen === 'security') {
      const contextualMessage = getContextualMessage();
      if (!isOpen) {
        setResponse(contextualMessage);
        setIsOpen(true);
        speak(contextualMessage, { rate: 1.0, pitch: 1.1 });
      }
    }
  }, [location, isOpen, getContextualMessage, speak]);
  
  // ============================================================================
  // EMOTIONAL PULSE SYNC - User Restriction Status
  // ============================================================================
  
  useEffect(() => {
    if (!user) return;
    
    const loadMemories = async () => {
      try {
        const memories = await getRecentMemories(user.id, 10);
        setRecentMemories(memories);
        
        const state = detectEmotionalState(userProfile, memories);
        setEmotionalState(state);
        
        // Pulse if user is restricted
        if (userProfile?.is_restricted) {
          setIsPulsing(true);
          setTimeout(() => setIsPulsing(false), 3000);
        }
      } catch (error) {
        console.error('Error loading memories:', error);
      }
    };
    
    loadMemories();
  }, [user, userProfile]);
  
  // ============================================================================
  // NIGHT MODE - Nightcap after 10 PM
  // ============================================================================
  
  useEffect(() => {
    setShowNightcap(isNightMode);
    
    if (isNightMode && !isOpen) {
      // Show rest message when entering night mode
      const restMessage = getContextualMessage();
      setResponse(restMessage);
      setIsOpen(true);
      speak(restMessage, { rate: 0.8, pitch: 0.9 });
    }
  }, [isNightMode, isOpen, getContextualMessage, speak]);
  
  // ============================================================================
  // RIVE STATE MACHINE WIRING - Visual Handshake
  // ============================================================================
  
  useEffect(() => {
    if (moodInput) {
      // Logic: 0=Idle, 1=Happy, 2=Celebration, 3=Warning, 4=Sleepy
      if (focuslyMood === 'celebrating' || emotionalState.mood === 'celebratory') {
        moodInput.value = 2;
      } else if (focuslyMood === 'concerned' || focuslyMood === 'worried' || userProfile?.is_restricted) {
        moodInput.value = 3;
      } else if (isNightMode) {
        moodInput.value = 4;
      } else if (focuslyMood === 'proud' || focuslyMood === 'happy') {
        moodInput.value = 1;
      } else if (microState === 'cloud_gazing') {
        moodInput.value = 0;
      } else if (microState === 'wind_blown') {
        moodInput.value = 0; // Keep idle but animation handles wind
      } else if (microState === 'roar') {
        moodInput.value = 2;
      } else {
        moodInput.value = 0; // Default idle
      }
    }
  }, [focuslyMood, isNightMode, microState, emotionalState, userProfile, moodInput]);
  
  // ============================================================================
  // INACTIVITY CHECK - 24-hour nudge
  // ============================================================================
  
  useEffect(() => {
    if (!user) return;
    
    const checkUserInactivity = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const inactivityStatus = await checkInactivity(user.id, supabase);
        
        if (inactivityStatus.isInactive && !isOpen) {
          setResponse(inactivityStatus.message);
          setIsOpen(true);
          setIsPulsing(true);
          speak(inactivityStatus.message, { rate: 1.0, pitch: 1.1 });
          setTimeout(() => setIsPulsing(false), 3000);
        }
        
        setLastPostTime(inactivityStatus.hoursSinceLastPost);
      } catch (error) {
        console.error('Error checking inactivity:', error);
      }
    };
    
    checkUserInactivity();
  }, [user, isOpen, speak]);
  
  
  // ============================================================================
  // EMPATHY LOOP - Milestone Celebrations
  // ============================================================================
  
  const triggerMilestoneCelebration = useCallback((milestone) => {
    const celebration = celebrateMilestone(milestone);
    setResponse(celebration);
    setIsOpen(true);
    setIsPulsing(true);
    setRiveState('celebrating');
    
    // Speak with celebration
    speak(celebration, { rate: 1.2, pitch: 1.3 });
    
    // Play celebration sound or animation
    setTimeout(() => {
      setIsPulsing(false);
      setRiveState('idle');
    }, 2000);
  }, [speak]);
  
  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================
  
  const handleTap = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (isHidden) {
      setIsHidden(false);
      return;
    }
    
    setIsOpen(!isOpen);
    
    if (!isOpen && !response) {
      // Show context-aware greeting when opening
      const greeting = getContextGreeting(currentScreen);
      setResponse(greeting);
    }
  }, [isOpen, isHidden, response, currentScreen]);
  
  const handleLongPressStart = useCallback(() => {
    // Shrink animation with shy behavior
    setIsShrinking(true);
    setRiveState('shy');
    
    longPressTimer.current = setTimeout(() => {
      setIsHidden(true);
      setIsOpen(false);
      setIsShrinking(false);
      setRiveState('idle');
    }, 800); // Longer duration for shrink animation
  }, []);
  
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);
  
  const handleDragEnd = useCallback((event, info) => {
    const { x: dragX, y: dragY } = info;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Snap to edges with spring physics
    const snapX = dragX > screenWidth / 2 ? screenWidth - 80 : 20;
    const snapY = Math.max(100, Math.min(screenHeight - 150, dragY));
    
    // Spring animation to snap position
    springX.set(snapX);
    springY.set(snapY);
    
    // Trigger thinking state after drag
    setRiveState('thinking');
    setTimeout(() => setRiveState('idle'), 500);
  }, [springX, springY]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    const userMessage = message;
    setMessage('');
    setIsTyping(true);
    
    try {
      setRiveState('thinking');
      
      const result = await processMessage(userMessage, {
        screen: currentScreen,
        userProfile,
        recentMemories
      });
      
      setResponse(result.response);
      setIsTyping(false);
      setRiveState('idle');
      
      // Speak the response
      speak(result.response, { rate: 1.1, pitch: 1.2 });
    } catch (error) {
      console.error('Error processing message:', error);
      setResponse("I'm having trouble thinking right now, Macha. Let's try again!");
      setIsTyping(false);
      setRiveState('idle');
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  // ============================================================================
  // EMOTIONAL STATE VISUALS
  // ============================================================================
  
  const getGlowColor = () => {
    if (emotionalState.mood === 'concerned' || emotionalState.mood === 'worried') {
      return COLORS.warningRed;
    }
    if (emotionalState.mood === 'celebratory') {
      return COLORS.successGreen;
    }
    return COLORS.lavenderGlow;
  };
  
  const getMascotState = () => {
    // Use mood hook's Rive state first, then fallback to manual state
    const moodRiveState = getMoodRiveState();
    
    return moodRiveState || riveState || (() => {
      if (emotionalState.mood === 'concerned' || emotionalState.mood === 'worried') {
        return 'disappointed';
      }
      if (emotionalState.mood === 'celebratory') {
        return 'celebrating';
      }
      if (isTyping) {
        return 'thinking';
      }
      return 'idle';
    })();
  };
  
  // ============================================================================
  // EYE FOLLOWING - Track cursor/touch
  // ============================================================================
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate eye offset (clamped to prevent extreme movement)
      const maxOffset = 5;
      const offsetX = Math.max(-maxOffset, Math.min(maxOffset, (e.clientX - centerX) / 20));
      const offsetY = Math.max(-maxOffset, Math.min(maxOffset, (e.clientY - centerY) / 20));
      
      setEyeX(offsetX);
      setEyeY(offsetY);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!user) return null;
  
  const companionContent = (
    <>
      {/* Draggable Focusly Orb */}
      <motion.div
        ref={containerRef}
        className={styles.companionContainer}
        style={{
          position: 'fixed',
          x,
          y,
          scale,
          rotate,
          zIndex: 9999
        }}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        onTapStart={handleLongPressStart}
        onTapCancel={handleLongPressEnd}
        whileDrag={{ scale: 1.2, rotate: 10 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: isShrinking ? 0.3 : 1,
          opacity: isShrinking ? 0.5 : 1,
          boxShadow: isPulsing 
            ? `0 0 30px ${getGlowColor()}, 0 0 60px ${getGlowColor()}`
            : `0 0 15px ${getGlowColor()}, 0 0 30px ${getGlowColor()}`
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 20 },
          opacity: { duration: 0.3 },
          boxShadow: {
            duration: isPulsing ? 0.5 : 0.3,
            repeat: isPulsing ? Infinity : 0,
            repeatType: "reverse"
          }
        }}
      >
        <div className={styles.orb}>
          <motion.div
            className={styles.pulseRing}
            animate={{
              scale: isPulsing ? [1, 1.3, 1] : 1,
              opacity: isPulsing ? [0.6, 0.3, 0.6] : 0.6
            }}
            transition={{
              duration: 1.5,
              repeat: isPulsing ? Infinity : 0
            }}
          />
          
          {/* Rive Animation with State Machine */}
          <div className={styles.riveContainer} style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}>
            <RiveComponent
              className={styles.riveAnimation}
              onError={() => {
                // Fallback to CSS mascot if Rive fails
                console.error('Rive animation failed, using fallback');
              }}
            />
          </div>
          
          {/* Fallback to CSS mascot if Rive not available */}
          <FocuslyMascot 
            state={getMascotState()} 
            size={60}
            className={styles.fallbackMascot}
          />
          
          {/* Nightcap visual after 10 PM */}
          {showNightcap && (
            <motion.div
              className={styles.nightcap}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              🌙
            </motion.div>
          )}
          
          {isHidden && (
            <motion.div
              className={styles.hiddenIndicator}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          )}
        </div>
      </motion.div>
      
      {/* Dialogue Box */}
      {isOpen && !isHidden && (
        <motion.div
          className={styles.dialogueBox}
          style={{
            position: 'fixed',
            left: Math.min(parseFloat(x.get()) + 80, window.innerWidth - 320),
            top: Math.min(parseFloat(y.get()), window.innerHeight - 400),
            zIndex: 9998
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.dialogueHeader}>
            <span className={styles.dialogueTitle}>Focusly</span>
            <button 
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          
          <div className={styles.dialogueContent}>
            {response && (
              <motion.div
                className={styles.response}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {response}
              </motion.div>
            )}
            
            {isTyping && (
              <div className={styles.typingIndicator}>
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          
          <form className={styles.dialogueInput} onSubmit={handleSendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Talk to Focusly, Macha!"
              className={styles.input}
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={isTyping || !message.trim()}
            >
              {isTyping ? '...' : '→'}
            </button>
          </form>
        </motion.div>
      )}
    </>
  );
  
  return createPortal(companionContent, document.body);
};

export default FocuslyCompanion;
