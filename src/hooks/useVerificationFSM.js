/**
 * useVerificationFSM.js
 * =====================
 * 🏛️ SOVEREIGN VERIFICATION STATE MACHINE HOOK
 * 
 * Finite State Machine for Identity DNA verification flow:
 * Idle → PreFlight → Scanning → Extracting → Synthesizing → Checking → Verified|Duplicate|Error
 * 
 * H2 Innovative — Deterministic State Management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// STATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const VERIFICATION_STATES = {
  IDLE: 'idle',
  PRE_FLIGHT: 'pre_flight',
  SCANNING: 'scanning',
  EXTRACTING: 'extracting',
  SYNTHESIZING: 'synthesizing',
  CHECKING: 'checking',
  VERIFIED: 'verified',
  DUPLICATE: 'duplicate',
  ERROR: 'error',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VALID STATE TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const VALID_TRANSITIONS = {
  [VERIFICATION_STATES.IDLE]: [VERIFICATION_STATES.PRE_FLIGHT],
  [VERIFICATION_STATES.PRE_FLIGHT]: [VERIFICATION_STATES.SCANNING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.SCANNING]: [VERIFICATION_STATES.EXTRACTING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.EXTRACTING]: [VERIFICATION_STATES.SYNTHESIZING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.SYNTHESIZING]: [VERIFICATION_STATES.CHECKING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.CHECKING]: [VERIFICATION_STATES.VERIFIED, VERIFICATION_STATES.DUPLICATE, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.DUPLICATE]: [VERIFICATION_STATES.IDLE, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.ERROR]: [VERIFICATION_STATES.IDLE, VERIFICATION_STATES.PRE_FLIGHT],
  [VERIFICATION_STATES.VERIFIED]: [VERIFICATION_STATES.IDLE], // Allow reset after verification
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT STATE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK: useVerificationFSM
// ═══════════════════════════════════════════════════════════════════════════════
const useVerificationFSM = (options = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  
  // ═════════════════════════════════════════════════════════════════════════════
  // STATE
  // ═════════════════════════════════════════════════════════════════════════════
  const [state, setState] = useState(VERIFICATION_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [identityHash, setIdentityHash] = useState(null);
  const [metadata, setMetadata] = useState({});
  
  // Refs for aborting operations
  const abortControllerRef = useRef(null);
  const retryTimerRef = useRef(null);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // STATE TRANSITION
  // ═════════════════════════════════════════════════════════════════════════════
  const transition = useCallback((newState, data = {}) => {
    setState(currentState => {
      const validTransitions = VALID_TRANSITIONS[currentState] || [];
      
      // Allow same-state transitions for updates
      if (newState === currentState) {
        console.log(`[FSM] State update: ${currentState}`, data);
        return currentState;
      }
      
      // Validate transition
      if (!validTransitions.includes(newState)) {
        console.warn(`[FSM] Invalid transition: ${currentState} → ${newState}`);
        console.warn(`[FSM] Valid transitions from ${currentState}:`, validTransitions);
        return currentState;
      }
      
      console.log(`[FSM] Transition: ${currentState} → ${newState}`, data);
      return newState;
    });
    
    // Update related state
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.phase !== undefined) setPhase(data.phase);
    if (data.message !== undefined) setMessage(data.message);
    if (data.error !== undefined) setError(data.error);
    if (data.identityHash !== undefined) setIdentityHash(data.identityHash);
    if (data.metadata) {
      setMetadata(prev => ({ ...prev, ...data.metadata }));
    }
    
    // Update processing state
    const processingStates = [
      VERIFICATION_STATES.PRE_FLIGHT,
      VERIFICATION_STATES.SCANNING,
      VERIFICATION_STATES.EXTRACTING,
      VERIFICATION_STATES.SYNTHESIZING,
      VERIFICATION_STATES.CHECKING,
    ];
    setIsProcessing(processingStates.includes(newState));
    
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // RESET
  // ═════════════════════════════════════════════════════════════════════════════
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }
    
    setState(VERIFICATION_STATES.IDLE);
    setProgress(0);
    setPhase(0);
    setMessage('');
    setError(null);
    setRetryCount(0);
    setIsProcessing(false);
    setIdentityHash(null);
    setMetadata({});
    
    abortControllerRef.current = null;
    retryTimerRef.current = null;
    
    console.log('[FSM] Reset to initial state');
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // RETRY WITH EXPONENTIAL BACKOFF
  // ═════════════════════════════════════════════════════════════════════════════
  const retry = useCallback(() => {
    if (retryCount >= config.maxRetries) {
      console.warn('[FSM] Max retries reached');
      return false;
    }
    
    const delay = config.exponentialBackoff 
      ? Math.pow(2, retryCount) * config.retryDelay 
      : config.retryDelay;
    
    setRetryCount(prev => prev + 1);
    
    transition(VERIFICATION_STATES.ERROR, {
      message: `Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/${config.maxRetries})`
    });
    
    retryTimerRef.current = setTimeout(() => {
      transition(VERIFICATION_STATES.PRE_FLIGHT, {
        message: 'Retrying verification...',
        progress: 0,
        phase: 0,
        error: null
      });
    }, delay);
    
    return true;
  }, [retryCount, config, transition]);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // CREATE ABORT CONTROLLER
  // ═════════════════════════════════════════════════════════════════════════════
  const createAbortController = useCallback(() => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  }, []);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // GET STATE CONFIG
  // ═════════════════════════════════════════════════════════════════════════════
  const getStateConfig = useCallback(() => {
    const stateConfigs = {
      [VERIFICATION_STATES.IDLE]: {
        icon: '●',
        label: 'Ready',
        color: '#00ffaa',
        canStart: true,
      },
      [VERIFICATION_STATES.PRE_FLIGHT]: {
        icon: '◉',
        label: 'Initializing',
        color: '#9678ff',
        canStart: false,
      },
      [VERIFICATION_STATES.SCANNING]: {
        icon: '📷',
        label: 'Scanning ID',
        color: '#9678ff',
        canStart: false,
      },
      [VERIFICATION_STATES.EXTRACTING]: {
        icon: '🔬',
        label: 'Extracting DNA',
        color: '#00c3ff',
        canStart: false,
      },
      [VERIFICATION_STATES.SYNTHESIZING]: {
        icon: '🧬',
        label: 'Synthesizing Hash',
        color: '#00c3ff',
        canStart: false,
      },
      [VERIFICATION_STATES.CHECKING]: {
        icon: '🔒',
        label: 'Checking Uniqueness',
        color: '#ffdc00',
        canStart: false,
      },
      [VERIFICATION_STATES.VERIFIED]: {
        icon: '✓',
        label: 'Verified',
        color: '#00ffaa',
        canStart: false,
      },
      [VERIFICATION_STATES.DUPLICATE]: {
        icon: '⚠',
        label: 'Duplicate Found',
        color: '#ff5050',
        canStart: false,
      },
      [VERIFICATION_STATES.ERROR]: {
        icon: '✕',
        label: 'Error',
        color: '#ff5050',
        canStart: true, // Can retry from error
      },
    };
    
    return stateConfigs[state] || stateConfigs[VERIFICATION_STATES.IDLE];
  }, [state]);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // VALIDATE TRANSITION
  // ═════════════════════════════════════════════════════════════════════════════
  const canTransition = useCallback((targetState) => {
    const validTransitions = VALID_TRANSITIONS[state] || [];
    return validTransitions.includes(targetState) || targetState === state;
  }, [state]);
  
  // ═════════════════════════════════════════════════════════════════════════════
  // RETURN API
  // ═════════════════════════════════════════════════════════════════════════════
  return {
    // Current state
    state,
    progress,
    phase,
    message,
    error,
    retryCount,
    isProcessing,
    identityHash,
    metadata,
    stateConfig: getStateConfig(),
    
    // Actions
    transition,
    reset,
    retry,
    createAbortController,
    canTransition,
    
    // Constants
    STATES: VERIFICATION_STATES,
    
    // Utilities
    isIdle: state === VERIFICATION_STATES.IDLE,
    isPreFlight: state === VERIFICATION_STATES.PRE_FLIGHT,
    isScanning: state === VERIFICATION_STATES.SCANNING,
    isExtracting: state === VERIFICATION_STATES.EXTRACTING,
    isSynthesizing: state === VERIFICATION_STATES.SYNTHESIZING,
    isChecking: state === VERIFICATION_STATES.CHECKING,
    isVerified: state === VERIFICATION_STATES.VERIFIED,
    isDuplicate: state === VERIFICATION_STATES.DUPLICATE,
    isError: state === VERIFICATION_STATES.ERROR,
  };
};

export default useVerificationFSM;
