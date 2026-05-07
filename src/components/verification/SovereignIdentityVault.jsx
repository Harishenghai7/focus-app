/**
 * SovereignIdentityVault.jsx
 * ==========================
 * 🏛️ THE SOVEREIGN IDENTITY VAULT - God-Level Glassmorphism Verification Flow
 * 
 * PILLAR 1: Edge-Only Identity DNA with HMAC SHA-256
 * PILLAR 2: Finite State Machine (Idle → Scanning → Extracting → Verified)
 * PILLAR 3: Satin-finish borders with Sovereign Pulse animation
 * PILLAR 4: Focusly AI intervention for duplicate identities
 * 
 * H2 Innovative — The Fortress of Digital Identity
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusly } from '../../context/FocuslyContext';
import styles from './SovereignIdentityVault.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// FINITE STATE MACHINE - The Sovereign Workflow
// ═══════════════════════════════════════════════════════════════════════════════
export const VERIFICATION_STATES = Object.freeze({
  IDLE: 'idle',
  PRE_FLIGHT: 'pre_flight',
  SCANNING: 'scanning',
  EXTRACTING: 'extracting',
  SYNTHESIZING: 'synthesizing', // DNA synthesis
  CHECKING: 'checking', // Deduplication check
  VERIFIED: 'verified',
  DUPLICATE: 'duplicate', // Identity already exists
  ERROR: 'error',
});

// State transition validation
const VALID_TRANSITIONS = {
  [VERIFICATION_STATES.IDLE]: [VERIFICATION_STATES.PRE_FLIGHT],
  [VERIFICATION_STATES.PRE_FLIGHT]: [VERIFICATION_STATES.SCANNING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.SCANNING]: [VERIFICATION_STATES.EXTRACTING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.EXTRACTING]: [VERIFICATION_STATES.SYNTHESIZING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.SYNTHESIZING]: [VERIFICATION_STATES.CHECKING, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.CHECKING]: [VERIFICATION_STATES.VERIFIED, VERIFICATION_STATES.DUPLICATE, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.DUPLICATE]: [VERIFICATION_STATES.IDLE, VERIFICATION_STATES.ERROR],
  [VERIFICATION_STATES.ERROR]: [VERIFICATION_STATES.IDLE, VERIFICATION_STATES.PRE_FLIGHT],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN PULSE ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════════
const vaultContainerVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    rotateY: -15,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotateY: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom bezier for "vault door" feel
      staggerChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    rotateY: 10,
    transition: { duration: 0.3 }
  }
};

const sovereignPulseVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const statusGlowVariants = {
  ready: { 
    boxShadow: '0 0 20px rgba(0, 255, 170, 0.3), 0 0 40px rgba(0, 255, 170, 0.1)',
    borderColor: 'rgba(0, 255, 170, 0.5)'
  },
  processing: {
    boxShadow: '0 0 30px rgba(150, 120, 255, 0.4), 0 0 60px rgba(150, 120, 255, 0.2)',
    borderColor: 'rgba(150, 120, 255, 0.6)'
  },
  verified: {
    boxShadow: '0 0 40px rgba(0, 255, 170, 0.6), 0 0 80px rgba(0, 255, 170, 0.3)',
    borderColor: 'rgba(0, 255, 170, 0.8)'
  },
  error: {
    boxShadow: '0 0 30px rgba(255, 80, 80, 0.4), 0 0 60px rgba(255, 80, 80, 0.2)',
    borderColor: 'rgba(255, 80, 80, 0.6)'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Sovereign Status Indicator
// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function SovereignStatusGlow({ status, message }) {
  const getStatusConfig = () => {
    switch (status) {
      case VERIFICATION_STATES.VERIFIED:
        return { color: '#00ffaa', icon: '✓', label: 'System Verified' };
      case VERIFICATION_STATES.PROCESSING:
      case VERIFICATION_STATES.SCANNING:
      case VERIFICATION_STATES.EXTRACTING:
      case VERIFICATION_STATES.SYNTHESIZING:
      case VERIFICATION_STATES.CHECKING:
        return { color: '#9678ff', icon: '◉', label: 'Processing' };
      case VERIFICATION_STATES.ERROR:
      case VERIFICATION_STATES.DUPLICATE:
        return { color: '#ff5050', icon: '⚠', label: 'Attention Required' };
      default:
        return { color: '#00ffaa', icon: '●', label: 'System Ready' };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div 
      className={styles.statusIndicator}
      animate={statusGlowVariants[status === VERIFICATION_STATES.VERIFIED ? 'verified' : 
                                   status === VERIFICATION_STATES.ERROR || status === VERIFICATION_STATES.DUPLICATE ? 'error' :
                                   status !== VERIFICATION_STATES.IDLE && status !== VERIFICATION_STATES.PRE_FLIGHT ? 'processing' : 'ready']}
      transition={{ duration: 0.3 }}
    >
      <span className={styles.statusIcon} style={{ color: config.color }}>
        {config.icon}
      </span>
      <span className={styles.statusLabel}>{message || config.label}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: DNA Extraction Visualizer
// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function DnaExtractionVisualizer({ progress, phase }) {
  const phases = [
    { label: 'Purifying Image', icon: '🔬' },
    { label: 'Extracting DNA', icon: '🧬' },
    { label: 'Synthesizing Hash', icon: '⚡' },
    { label: 'Global Check', icon: '🔒' },
  ];

  return (
    <div className={styles.dnaVisualizer}>
      <div className={styles.dnaHelix}>
        <motion.div 
          className={styles.helixCore}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.helixRung}
              style={{ 
                transform: `rotate(${i * 45}deg) translateY(${Math.sin(i * 0.8) * 20}px)`,
                opacity: progress > (i / 8) * 100 ? 1 : 0.3
              }}
            />
          ))}
        </motion.div>
      </div>
      
      <div className={styles.phaseIndicators}>
        {phases.map((p, idx) => (
          <motion.div
            key={idx}
            className={`${styles.phase} ${idx <= phase ? styles.phaseActive : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <span className={styles.phaseIcon}>{p.icon}</span>
            <span className={styles.phaseLabel}>{p.label}</span>
            {idx <= phase && (
              <motion.div 
                className={styles.phaseProgress}
                layoutId="phaseProgress"
              />
            )}
          </motion.div>
        ))}
      </div>

      <div className={styles.progressBar}>
        <motion.div 
          className={styles.progressFill}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Focusly AI Intervention (Duplicate Identity)
// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function FocuslyIntervention({ onRetry, onContactSupport }) {
  const focusly = useFocusly();

  useEffect(() => {
    focusly.disappoint("Macha, this Identity is already protecting a citizen in our nation.");
  }, [focusly]);

  return (
    <motion.div 
      className={styles.focuslyIntervention}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.focuslyAvatarLarge}>🦁</div>
      <h3 className={styles.interventionTitle}>Identity Already Linked</h3>
      <p className={styles.interventionMessage}>
        This government ID is already bound to a verified Focus citizen. 
        Our Sovereign Trust Shield ensures <strong>One Human, One Nation</strong>.
      </p>
      <div className={styles.interventionActions}>
        <button onClick={onRetry} className={styles.retryButton}>
          Try Different ID
        </button>
        <button onClick={onContactSupport} className={styles.supportButton}>
          Contact Sovereign Support
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: Sovereign Identity Vault
// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function SovereignIdentityVault({ 
  onVerify, 
  onError, 
  userId, 
  supabase,
  children 
}) {
  const [state, setState] = useState(VERIFICATION_STATES.IDLE);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [identityHash, setIdentityHash] = useState(null);
  
  const focusly = useFocusly();
  const abortController = useRef(null);

  // ═════════════════════════════════════════════════════════════════════════════
  // STATE MACHINE: Validated Transitions
  // ═════════════════════════════════════════════════════════════════════════════
  const transitionTo = useCallback((newState, data = {}) => {
    setState(prev => {
      const validTransitions = VALID_TRANSITIONS[prev] || [];
      if (!validTransitions.includes(newState) && prev !== newState) {
        console.warn(`[SovereignVault] Invalid transition: ${prev} → ${newState}`);
        return prev;
      }
      

      return newState;
    });
    
    if (data.message) setStatusMessage(data.message);
    if (data.progress !== undefined) setProgress(data.progress);
    if (data.phase !== undefined) setPhase(data.phase);
    if (data.error) setError(data.error);
    if (data.identityHash) setIdentityHash(data.identityHash);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 1: Pre-Flight Check - Session & Permissions
  // ═════════════════════════════════════════════════════════════════════════════
  const performPreFlightCheck = useCallback(async () => {
    transitionTo(VERIFICATION_STATES.PRE_FLIGHT, { 
      message: 'Initializing Sovereign Systems...',
      progress: 5,
      phase: 0
    });

    try {
      // Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('SESSION_INVALID');
      }

      // Check camera permissions
      const permissions = await navigator.permissions.query({ name: 'camera' });
      
      if (permissions.state === 'denied') {
        throw new Error('CAMERA_PERMISSION_DENIED');
      }

      transitionTo(VERIFICATION_STATES.SCANNING, {
        message: 'System Ready - Awaiting Identity Capture',
        progress: 10,
        phase: 0
      });

      return true;
    } catch (err) {
      const errorMessages = {
        'SESSION_INVALID': 'Your session has expired. Please sign in again.',
        'CAMERA_PERMISSION_DENIED': 'Camera access is required for identity verification.',
      };
      
      transitionTo(VERIFICATION_STATES.ERROR, {
        error: errorMessages[err.message] || err.message,
        message: 'Pre-flight Check Failed'
      });
      
      return false;
    }
  }, [supabase, transitionTo]);

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 2: Identity DNA Extraction - Edge Function Call
  // ═════════════════════════════════════════════════════════════════════════════
  const extractIdentityDna = useCallback(async (idNumber, idType, institutionName = null) => {
    transitionTo(VERIFICATION_STATES.EXTRACTING, {
      message: 'Extracting Identity DNA...',
      progress: 25,
      phase: 1
    });

    abortController.current = new AbortController();

    try {
      // Simulate processing steps for UX
      await new Promise(r => setTimeout(r, 400));
      
      transitionTo(VERIFICATION_STATES.SYNTHESIZING, {
        message: 'Synthesizing HMAC-SHA256 Hash...',
        progress: 50,
        phase: 2
      });

      // Call the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/trust-shield-dna`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            idNumber,
            idType,
            institutionName,
            userId,
            commit: false // Check only, don't commit yet
          }),
          signal: abortController.current.signal
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'DNA_EXTRACTION_FAILED');
      }

      return result.identity_dna_hash;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('EXTRACTION_ABORTED');
      }
      throw err;
    }
  }, [supabase, userId, transitionTo]);

  // ═════════════════════════════════════════════════════════════════════════════
  // PILLAR 3: Deduplication Check - One Human, One Nation
  // ═════════════════════════════════════════════════════════════════════════════
  const checkDuplicateIdentity = useCallback(async (idNumber, idType, institutionName = null) => {
    transitionTo(VERIFICATION_STATES.CHECKING, {
      message: 'Checking Global Uniqueness...',
      progress: 75,
      phase: 3
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/trust-shield-dna`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            idNumber,
            idType,
            institutionName,
            userId,
            commit: true // Now commit if unique
          })
        }
      );

      const result = await response.json();

      if (response.status === 409 || result.exists) {
        transitionTo(VERIFICATION_STATES.DUPLICATE, {
          message: 'Identity Already Registered',
          progress: 100,
          phase: 3
        });
        return { unique: false, exists: true };
      }

      if (!result.success) {
        throw new Error(result.error || 'DEDUPLICATION_CHECK_FAILED');
      }

      transitionTo(VERIFICATION_STATES.VERIFIED, {
        message: 'Identity Verified & Secured',
        progress: 100,
        phase: 3,
        identityHash: result.identity_dna_hash
      });

      focusly.celebrate("Welcome to the Sovereign Nation, Macha! Your identity is now protected.");

      return { unique: true, identityHash: result.identity_dna_hash };
    } catch (err) {
      transitionTo(VERIFICATION_STATES.ERROR, {
        error: err.message,
        message: 'Verification Failed'
      });
      return { unique: false, error: err.message };
    }
  }, [supabase, userId, transitionTo, focusly]);

  // ═════════════════════════════════════════════════════════════════════════════
  // PUBLIC API: Complete Verification Flow
  // ═════════════════════════════════════════════════════════════════════════════
  const verifyIdentity = useCallback(async (idNumber, idType, institutionName = null) => {
    setError(null);
    
    // Step 1: Pre-flight check
    const preflight = await performPreFlightCheck();
    if (!preflight) return { success: false };

    try {
      // Step 2: Extract DNA hash (via Edge Function)
      const dnaHash = await extractIdentityDna(idNumber, idType, institutionName);
      
      // Step 3: Check for duplicates & commit
      const result = await checkDuplicateIdentity(idNumber, idType, institutionName);
      
      if (result.unique) {
        onVerify?.({ identityHash: result.identityHash, idType });
        return { success: true, identityHash: result.identityHash };
      } else if (result.exists) {
        return { success: false, duplicate: true };
      }
      
      return { success: false, error: result.error };
    } catch (err) {
      transitionTo(VERIFICATION_STATES.ERROR, {
        error: err.message,
        message: 'Verification Failed'
      });
      onError?.(err);
      return { success: false, error: err.message };
    }
  }, [performPreFlightCheck, extractIdentityDna, checkDuplicateIdentity, onVerify, onError, transitionTo]);

  // ═════════════════════════════════════════════════════════════════════════════
  // PUBLIC API: Reset State
  // ═════════════════════════════════════════════════════════════════════════════
  const reset = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    setState(VERIFICATION_STATES.IDLE);
    setProgress(0);
    setPhase(0);
    setStatusMessage('');
    setError(null);
    setIdentityHash(null);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER: The Sovereign Vault UI
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.sovereignVault}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          variants={vaultContainerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={styles.vaultContainer}
        >
          {/* Status Glow Indicator */}
          <SovereignStatusGlow status={state} message={statusMessage} />

          {/* DNA Extraction Visualizer (shown during processing) */}
          {(state === VERIFICATION_STATES.EXTRACTING || 
            state === VERIFICATION_STATES.SYNTHESIZING || 
            state === VERIFICATION_STATES.CHECKING) && (
            <DnaExtractionVisualizer progress={progress} phase={phase} />
          )}

          {/* Duplicate Identity Intervention */}
          {state === VERIFICATION_STATES.DUPLICATE && (
            <FocuslyIntervention 
              onRetry={reset}
              onContactSupport={() => window.location.href = '/support'}
            />
          )}

          {/* Error State */}
          {state === VERIFICATION_STATES.ERROR && error && (
            <motion.div 
              className={styles.errorState}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.errorIcon}>⚠</div>
              <h3>Verification Failed</h3>
              <p>{error}</p>
              <button onClick={reset} className={styles.retryButton}>
                Try Again
              </button>
            </motion.div>
          )}

          {/* Verified State */}
          {state === VERIFICATION_STATES.VERIFIED && (
            <motion.div 
              className={styles.verifiedState}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div 
                className={styles.verifiedSeal}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                ✓
              </motion.div>
              <h3>Sovereign Identity Verified</h3>
              <p>Your identity DNA has been secured in the Focus Nation.</p>
              <div className={styles.hashDisplay}>
                <code>{identityHash?.slice(0, 16)}...{identityHash?.slice(-16)}</code>
              </div>
            </motion.div>
          )}

          {/* Render children with context */}
          {children && (
            <div className={styles.childrenContainer}>
              {children({
                state,
                verifyIdentity,
                reset,
                progress,
                phase,
                isProcessing: [
                  VERIFICATION_STATES.PRE_FLIGHT,
                  VERIFICATION_STATES.SCANNING,
                  VERIFICATION_STATES.EXTRACTING,
                  VERIFICATION_STATES.SYNTHESIZING,
                  VERIFICATION_STATES.CHECKING
                ].includes(state)
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sovereign Pulse Background Effect */}
      <motion.div 
        className={styles.sovereignPulse}
        variants={sovereignPulseVariants}
        initial="initial"
        animate={state !== VERIFICATION_STATES.IDLE && state !== VERIFICATION_STATES.VERIFIED ? "animate" : "initial"}
      />
    </div>
  );
}

export default SovereignIdentityVault;
export { VERIFICATION_STATES };
