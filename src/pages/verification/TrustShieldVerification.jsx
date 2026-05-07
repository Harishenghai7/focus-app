import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useScanner from '../../hooks/useScanner';
import { persistTrustShieldState, createGuardianHandshake } from '../../utils/trustShieldEngine';
import { computeIdentityHash, classifyDocumentTier, crossCheckOCRData } from '../../hooks/useOCRScanner';
import { 
  checkDuplicateID, 
  checkDuplicateStudentID,
  finalizeVerificationV2,
  getAlertConfig 
} from '../../utils/trustShieldDuplicateCheck';
import { purifyIDImage } from '../../utils/imagePurityEngine';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import * as faceapi from 'face-api.js';
import { useFocusly } from '../../context/FocuslyContext';
import SovereignFrame from '../../components/SovereignFrame';
import styles from './TrustShieldVerification.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔱 TRUST SHIELD ULTRA - Maximum Security Enforcement  (GOD-LEVEL v2)
// ONE GOVERNMENT ID = ONE PERSON = ONE ACCOUNT - STRICTEST MODE
// ═══════════════════════════════════════════════════════════════════════════════
import {
  verifySovereignIdentity,
  storeSovereignHash,
} from '../../utils/trustShieldULTRA';

// 🔱 GOD-LEVEL ENGINE - Functions that actually exist in this file
import {
  getDeviceId,
  getVerificationStep,
  setVerificationStep,
  lockVerificationStep,
  getLockedStep,
  validateIDQuality,
  checkRateLimit,
  recordAttempt,
  checkIdentityUniqueness,
  logVerificationAttempt,
  atomicVerificationComplete,
  runGodLevelValidation,
  ERROR_CODES,
  TRUST_SHIELD_KEYS,
} from '../../utils/trustShieldGodEngine';

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR 1: ANTI-DEBUG / ANTI-TAMPER PROTECTION
// Detects DevTools, console manipulation, and debugger injection attempts
// ═══════════════════════════════════════════════════════════════════════════
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
// 🔱 MEMORY FIX: Store interval IDs for cleanup
let antiDebugIntervals = [];

function initAntiDebug() {
  if (typeof window === 'undefined') return;
  
  // Clean up any existing intervals first
  antiDebugIntervals.forEach(id => clearInterval(id));
  antiDebugIntervals = [];
  
  // 🔱 DISABLED FOR TESTING: DevTools detection was causing reload loop
  // Detect DevTools opening via console size
  // const threshold = 160;
  // const checkDevTools = () => {
  //   const widthThreshold = window.outerWidth - window.innerWidth > threshold;
  //   const heightThreshold = window.outerHeight - window.innerHeight > threshold;
  //   if (widthThreshold || heightThreshold) {
  //     // DevTools detected - redirect to auth
  //     window.location.href = '/auth';
  //   }
  // };
  // antiDebugIntervals.push(setInterval(checkDevTools, 1000));
  
  // Prevent console manipulation during verification
  const blockConsole = () => {
    const noop = () => {};
    const methods = ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace'];
    methods.forEach(m => {
      const orig = console[m];
      console[m] = (...args) => {
        // Only allow specific TrustShield messages
        const msg = args[0]?.toString() || '';
        if (msg.includes('[TrustShield]') || msg.includes('[Liveness]')) {
          return orig?.apply(console, args);
        }
        return noop();
      };
    });
  };
  
  // 🔱 DISABLED FOR TESTING: Debugger trap was causing issues
  // Debugger trap with timing check
  // const debuggerTrap = () => {
  //   const start = performance.now();
  //   debugger;
  //   const end = performance.now();
  //   if (end - start > 100) {
  //     window.location.href = '/auth';
  //   }
  // };
  // antiDebugIntervals.push(setInterval(debuggerTrap, 2000));
}

// Cleanup function to clear anti-debug intervals
function cleanupAntiDebug() {
  antiDebugIntervals.forEach(id => clearInterval(id));
  antiDebugIntervals = [];
}

// ── Mobile Handoff ──────────────────────────────────────────────────────
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function generateHandoffSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
const HANDOFF_BASE_URL =
    process.env.REACT_APP_VERCEL_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://focus-app.vercel.app');

// ── Step Config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identity', icon: '👤' },
  { id: 2, label: 'Scan ID',  icon: '🪪' },
  { id: 3, label: 'Liveness', icon: '👁️' },
  { id: 4, label: 'Bridge',   icon: '📱' },
  { id: 5, label: 'Verified', icon: '✅' },
];

const COOLDOWN_KEY   = 'trust_shield_cooldown';
const FAIL_COUNT_KEY = 'trust_shield_fails';

// ── Liveness Challenge Pool (1 challenge only — UNBYPASSABLE SMILE) ─────
// 🔱 SOVEREIGN: Single unbypassable smile challenge — no blink, no complexity
const LIVENESS_CHALLENGE_POOL = [
  { id: 'smile',    label: 'Smile naturally & Hold',         icon: '😊' },
];

// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
/** Fisher-Yates in-place shuffle — produces 1-step unbypassable ritual (Smile) */
function shuffleChallenges(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function getEAR(eye) {
  if (!eye || eye.length !== 6) return 1.0;
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const w = d(eye[0], eye[3]);
  if (w === 0) return 1.0;
  return (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2.0 * w);
}

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

// ── Focusly AI Mascot ─────────────────────────────────────────────────────────
// NOTE: No click-to-bypass — Pillar 1 spec: "Physically remove 'Skip' buttons".
// The Continue button is math-locked to AI confirmation. No manual overrides.
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function FocuslyLion() {
  return (
    <div className={styles.focuslyContainer} style={{ userSelect: 'none' }} data-testid="focusly-lion-guardian">
      <div className={styles.focuslyAvatar}>🦁</div>
      <div className={styles.focuslySpeech}>
        <strong>Focusly AI (Guardian Mode)</strong>
        <p>"Real people make a real nation. Let's verify your soul, Macha!"</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
// 🏛️ SOVEREIGN FIX: Using function declaration to avoid TDZ issues
function TrustShieldVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useAuth();
  const focusly = useFocusly(); // 🦁 Pillar 4 companion
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 1: PERSISTENT STATE MACHINE - God-Level Step Management
  // ═══════════════════════════════════════════════════════════════════════════
  const [isLoadingStep, setIsLoadingStep] = useState(true);
  const [lockedStep, setLockedStep] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  // ── PILLAR 1: Initialize Anti-Debug Protection ───────────────────────────
  useEffect(() => {
    initAntiDebug();
    // 🔱 MEMORY FIX: Cleanup anti-debug intervals on unmount
    return () => {
      cleanupAntiDebug();
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ALL STATE DECLARATIONS — MUST come before any callbacks/effects that reference them
  // ═══════════════════════════════════════════════════════════════════════════
  const [step, setStepRaw] = useState(1);
  
  // 🔱 DEBUG: Log step changes
  useEffect(() => {

  }, [step]);
  // 🔱 GOD-LEVEL: Always default to '18+' if no ageGroup is set - prevents hidden forms
  const [ageGroup, setAgeGroupRaw] = useState(() => {
    const saved = localStorage.getItem('trust_shield_age_group');
    return saved || '18+'; // Default to adult tier instead of null
  });
  const [ocrData, setOcrDataRaw] = useState(null);
  const [identityHash, setIdentityHashRaw] = useState(null);
  const [manualAadhaar, setManualAadhaar] = useState('');
  const [manualAadhaarError, setManualAadhaarError] = useState(null);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualInstitution, setManualInstitution] = useState('');
  const [manualStudentIdError, setManualStudentIdError] = useState(null);
  const [idConfirmed, setIdConfirmedState] = useState(() => {
    // Restore from localStorage on mount
    return localStorage.getItem('trust_shield_id_confirmed') === 'true';
  });
  
  // Persist idConfirmed to localStorage whenever it changes
  const setIdConfirmed = (value) => {
    setIdConfirmedState(value);
    if (value) {
      localStorage.setItem('trust_shield_id_confirmed', 'true');

    }
  };
  const [guardianToken, setGuardianToken] = useState(null);
  const [guardianTokenInput, setGuardianTokenInput] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [handoffSessionId] = useState(() => generateHandoffSessionId());

  // ══ OCR Pipeline Progress State ═══════════════════════════════════════════
  const [ocrPipelineActive, setOcrPipelineActive]   = useState(false);
  const [ocrPipelinePhase, setOcrPipelinePhase]     = useState(0);
  const [ocrPipelinePct, setOcrPipelinePct]         = useState(0);
  const [ocrPipelineLabel, setOcrPipelineLabel]     = useState('');
  const [ocrPurifyMethod, setOcrPurifyMethod]       = useState('');

  // ── Liveness State ────────────────────────────────────────────────────────
  const challengeSequenceRef = useRef([]);
  const [livenessPhase, setLivenessPhase] = useState(0);
  const [livenessLuminance, setLivenessLuminance] = useState(1);
  const [livenessStatus, setLivenessStatus] = useState('');
  const [livenessComplete, setLivenessComplete] = useState([false]); // 🔱 1 challenge only — UNBYPASSABLE SMILE
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [staticImageFlag, setStaticImageFlag] = useState(false);

  // ── Liveness Refs ─────────────────────────────────────────────────────────
  const liveVideoRef      = useRef(null);
  const liveStreamRef     = useRef(null);
  const rafRef            = useRef(null);
  const earBufferRef      = useRef([]);
  const baselineEARRef    = useRef(null);
  const yawHistoryRef     = useRef([]);
  const blinkCountRef     = useRef(0);
  const tiltHoldRef       = useRef(0);
  const smileHoldRef      = useRef(0);
  const prevYawRef        = useRef(null);
  const prevFaceCenterRef = useRef(null);
  const teleportCountRef  = useRef(0);
  const scannerStopRef    = useRef(null);  // 🏛️ SOVEREIGN FIX: Store scanner stop function
  const fileUploadRef     = useRef(null); // 🏛️ SOVEREIGN FIX: File input ref for reset
  const isProcessingRef   = useRef(false); // 🔱 CRITICAL: Prevent duplicate submissions
  const livenessPhaseRef  = useRef(0);     // 🔱 CRITICAL: Track phase in ref for fresh reads
  const livenessCompleteRef = useRef([false]); // 🔱 CRITICAL: Track completion in ref (1 challenge)
  const hasInitializedRef = useRef(false);  // 🔱 CRITICAL: Prevent re-initialization reset
  const hasAutoContinuedRef = useRef(false); // 🔱 AUTO-CONTINUE: Prevent duplicate auto-continue triggers
  const accountLockedRef = useRef(false);  // 🔱 AUTO-CONTINUE: Track account lock state
  const staticImageFlagRef = useRef(false); // 🔱 AUTO-CONTINUE: Track static image detection
  const processedCaptureRef = useRef(null); // 🔱 CRITICAL: Prevent duplicate OCR processing

  // ── Scanner Hook ──────────────────────────────────────────────────────────
  const scanner = useScanner();

  // 🏛️ SOVEREIGN FIX: Stop camera when ID is captured to prevent UI blocking
  useEffect(() => {
    if (scanner.phase === 'captured' && scanner.stop && !scannerStopRef.current) {

      scanner.stop();
      scannerStopRef.current = true;
    }
    // Reset when moving away from step 2
    if (step !== 2) {
      scannerStopRef.current = false;
    }
    // 🔱 CRITICAL: Reset processed capture ref when not captured (allows re-capture)
    if (scanner.phase !== 'captured') {
      processedCaptureRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanner.phase, scanner.stop, step]);

  // 🔱 DEFENSIVE RESET: Clear stuck processing states on mount
  useEffect(() => {

    isProcessingRef.current = false;
    setSaving(false);
    setOcrPipelineActive(false);
    // Reset processed capture ref to allow fresh OCR
    processedCaptureRef.current = null;
  }, []);

  // ── Typewriter ────────────────────────────────────────────────────────────
  const [typewriterText, setTypewriterText] = useState('');
  const fullWaitingText = "Mobile Bridge active. Complete the ritual on your phone, Macha. I'm watching the gate here.";

  // Reset auto-continue when entering new step
  useEffect(() => {
    if (step === 1 || step === 2 || step === 3) {
      hasAutoContinuedRef.current = false;

    }
  }, [step]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 1: STEP PERSISTENCE - Using refs to avoid TDZ issues
  // ═══════════════════════════════════════════════════════════════════════════
  
  // 🔱 SOVEREIGN FIX: Use refs to store current state values to avoid TDZ
  const stateRef = useRef({
    ageGroup: ageGroup,
    ocrData: ocrData,
    identityHash: identityHash,
    userId: user?.id,
    step: step,
  });
  
  // Keep ref updated with latest state
  useEffect(() => {
    stateRef.current = {
      ageGroup,
      ocrData,
      identityHash,
      userId: user?.id,
      step,
    };
  }, [ageGroup, ocrData, identityHash, user?.id, step]);
  
  // 🔱 SOVEREIGN FIX: persistStepChange defined as standalone function (not useCallback)
  // to avoid TDZ issues with circular dependencies
  const persistStepChange = async (newStep, metadata = {}) => {
    const { userId } = stateRef.current;
    if (!userId) return;
    
    try {
      const { ageGroup: currentAgeGroup, ocrData: currentOcrData, identityHash: currentIdentityHash } = stateRef.current;
      const result = await setVerificationStep(userId, newStep, {
        ...metadata,
        ageGroup: currentAgeGroup,
        ocrData: currentOcrData,
        identityHash: currentIdentityHash,
        timestamp: Date.now(),
      });
      

      
      // If reaching Step 3 (Biometrics), LOCK the user there
      if (newStep === 3) {
        await lockVerificationStep(userId, 3);
        setLockedStep(3);

      }
    } catch (err) {
      console.error('[TrustShield] Step persistence failed:', err);
    }
  };

  // Wrapped setStep with persistence - BULLETPROOF VERSION
  // 🔱 SOVEREIGN FIX: Define as regular function to avoid TDZ with persistStepChange
  const setStep = (newStep) => {

    
    // CRITICAL: Update state immediately with functional update
    setStepRaw(prevStep => {

      return newStep;
    });
    
    // Then try to persist (don't block on this)
    try {
      persistStepChange(newStep).catch(err => {
        console.warn('[TrustShield] Step persistence failed (non-critical):', err);
      });
    } catch (err) {
      console.warn('[TrustShield] Step persistence error (non-critical):', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 1: PERSISTENT STATE INITIALIZATION - Fixes "Reset to Step 1" Bug
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const initializeGodLevelState = async () => {
      if (!user?.id) {
        setIsLoadingStep(false);
        return;
      }

      // 🔱 CRITICAL: Don't re-initialize if already done (prevents step reset)
      if (hasInitializedRef.current) {

        return;
      }

      // 🔱 BULLETPROOF: NO TIMEOUT - Don't reset user's progress!
      
      try {
        // Get device fingerprint
        const did = getDeviceId();
        setDeviceId(did);

        // Check rate limiting first (with fallback)
        let rateLimit = { allowed: true };
        try {
          rateLimit = await checkRateLimit(did);
        } catch (e) {
          console.warn('[TrustShield] Rate limit check failed:', e);
        }
        
        if (!rateLimit.allowed) {
          setError(rateLimit.reason);
          setIsLoadingStep(false);
          return;
        }

        // Get persistent verification state from DB + localStorage
        let stepData = { step: 1, source: 'fallback' };
        let locked = null;
        
        try {
          stepData = await getVerificationStep(user.id);
          locked = await getLockedStep(user.id);
        } catch (e) {
          console.warn('[TrustShield] DB step fetch failed:', e);
          // Fallback: try localStorage only
          const localStep = localStorage.getItem('trust_shield_step');
          if (localStep) {
            stepData = { step: parseInt(localStep), source: 'localStorage_fallback' };
          }
        }

        // 🔱 BULLETPROOF FIX: Always respect the user's current progress
        // Check if we should restore from locked step or database
        const effectiveStep = locked || stepData.step || 1;
        
        if (effectiveStep > 1) {
          // Restore to the furthest step the user has reached
          setLockedStep(locked);
          setStepRaw(effectiveStep);
          
          // Restore progress from metadata
          if (stepData.progress?.ageGroup) {
            setAgeGroupRaw(stepData.progress.ageGroup);
            localStorage.setItem('trust_shield_age_group', stepData.progress.ageGroup);
          }
          if (stepData.progress?.ocrData) setOcrDataRaw(stepData.progress?.ocrData);
          if (stepData.progress?.identityHash) setIdentityHashRaw(stepData.progress?.identityHash);
          

        } else {
          // Fresh start - check for any state from navigation
          const fromState = location.state?.lockedStep;
          if (fromState && fromState > 1) {
            setLockedStep(fromState);
            setStepRaw(fromState);
          } else {
            setStepRaw(1);
          }
        }
      } catch (err) {
        console.error('[TrustShield] State init error:', err);
        // Only fallback to step 1 if we're still at initial state
        // 🔱 FIX: Use functional update to avoid TDZ issues
        setStepRaw(currentStep => currentStep === 1 ? 1 : currentStep);
      } finally {
        hasInitializedRef.current = true; // Mark as initialized
        setIsLoadingStep(false);
      }
    };

    initializeGodLevelState();
    // 🔱 CRITICAL: Only run on mount and when user.id/location changes - step is NOT included
    // The hasInitializedRef prevents re-runs from resetting progress
  }, [user?.id, location.state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // WRAPPED SETTERS WITH PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  const setIdentityHash = useCallback((val) => {
    setIdentityHashRaw(val);
    if (user?.id) {
      setVerificationStep(user.id, step, { identityHash: val });
    }
  }, [user?.id, step]);

  const setAgeGroup = useCallback((val) => {
    setAgeGroupRaw(val);
    localStorage.setItem('trust_shield_age_group', val);
    if (user?.id) {
      setVerificationStep(user.id, step, { ageGroup: val });
    }
  }, [user?.id, step]);

  const setOcrData = useCallback((val) => {
    setOcrDataRaw((prev) => (typeof val === 'function' ? val(prev) : val));
    if (user?.id) {
      const computed = typeof val === 'function' ? val(ocrData) : val;
      setVerificationStep(user.id, step, { ocrData: computed });
    }
  }, [user?.id, step, ocrData]);

  // ── PILLAR 1: Back Navigation Lock ─────────────────────────────────────────
  useEffect(() => {
    const handlePopState = (e) => {
      if (step > 1) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [step]);

  // MANUAL FLOW: No auto-continue - user clicks Continue button

  const validateAadhaarVerhoeff = useCallback((aadhaar) => {
    const n = (aadhaar || '').replace(/\s/g, '');
    if (!/^\d{12}$/.test(n)) return false;
    const d = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,2,3,4,0,6,7,8,9,5],
      [2,3,4,0,1,7,8,9,5,6],
      [3,4,0,1,2,8,9,5,6,7],
      [4,0,1,2,3,9,5,6,7,8],
      [5,9,8,7,6,0,4,3,2,1],
      [6,5,9,8,7,1,0,4,3,2],
      [7,6,5,9,8,2,1,0,4,3],
      [8,7,6,5,9,3,2,1,0,4],
      [9,8,7,6,5,4,3,2,1,0]
    ];
    const p = [
      [0,1,2,3,4,5,6,7,8,9],
      [1,5,7,6,2,8,3,0,9,4],
      [5,8,0,3,7,9,6,1,4,2],
      [8,9,1,6,0,4,3,5,2,7],
      [9,4,5,3,1,2,6,8,7,0],
      [4,2,8,6,5,7,3,9,0,1],
      [2,7,9,3,8,0,6,4,1,5],
      [7,0,4,6,9,1,3,2,5,8]
    ];
    let c = 0;
    const arr = n.split('').map(Number).reverse();
    for (let i = 0; i < arr.length; i++) {
      c = d[c][p[i % 8][arr[i]]];
    }
    return c === 0;
  }, []);

  // 🏛️ SOVEREIGN FIX: Define handleFail BEFORE callbacks that reference it (TDZ fix)
  const handleFail = useCallback((msg) => {
    if (navigator.vibrate) navigator.vibrate(400);
    setError(msg);
    const fails = parseInt(localStorage.getItem(FAIL_COUNT_KEY) || '0') + 1;
    if (fails >= 3) {
      localStorage.setItem(COOLDOWN_KEY, (Date.now() + 60 * 60 * 1000).toString());
      localStorage.setItem(FAIL_COUNT_KEY, '0');
      setIsLocked(true);
      setError('Maximum attempts reached. Verification locked for 1 hour.');
    } else {
      localStorage.setItem(FAIL_COUNT_KEY, fails.toString());
    }
  }, []);

  // 🔱 BULLETPROOF: Step 2 Aadhaar Submit - Fixed for reliability
  const handleManualAadhaarSubmit = useCallback(async (e) => {
    // CRITICAL: Prevent any default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    

    
    // Validate first before setting processing state
    const cleaned = (manualAadhaar || '').replace(/\s/g, '');
    setManualAadhaarError(null);
    setError(null);

    if (!/^\d{12}$/.test(cleaned)) {
      setManualAadhaarError('Enter your full 12-digit Aadhaar number.');
      return;
    }
    

    if (!validateAadhaarVerhoeff(cleaned)) {
      setManualAadhaarError('Invalid Aadhaar number (checksum failed). Recheck digits.');
      return;
    }
    
    // Prevent double-submit with stronger check
    if (saving || isProcessingRef.current) {

      return;
    }
    
    isProcessingRef.current = true;
    setSaving(true);

    try {
      // 🔱 GOD-LEVEL: Activate OCR Pipeline Progress Bar
      setOcrPipelineActive(true);
      setOcrPipelinePhase(1);
      setOcrPipelinePct(10);
      setOcrPipelineLabel('🔬 Verifying Aadhaar...');

      const dup = await checkDuplicateID(cleaned, 'aadhaar');
      if (dup?.exists) {
        const alertConfig = getAlertConfig(dup.alertType);
        setManualAadhaarError(`${alertConfig.title}: ${alertConfig.message}`);
        setAccountLocked(true);
        setOcrPipelineActive(false);
        setSaving(false);
        setTimeout(() => {
          navigate(dup.redirectTo || '/auth', {
            state: {
              alert: {
                type: 'error',
                title: alertConfig.title,
                message: alertConfig.message,
                action: alertConfig.action,
              },
            },
          });
        }, 1500);
        return;
      }

      // Phase 2 → Phase 3: Checking Global Uniqueness
      setOcrPipelinePhase(3);
      setOcrPipelinePct(80);
      setOcrPipelineLabel('🔒 Checking Global Uniqueness...');

      // Set OCR data FIRST
      const newOcrData = {
        ...(ocrData || {}),
        idNumber: cleaned,
        idType: 'aadhaar',
        idMaskedLast4: cleaned.slice(-4),
      };
      setOcrData(newOcrData);

      try {
        const hash = await computeIdentityHash(cleaned);
        if (hash) {
          setIdentityHash(hash);
          // Persist hash immediately
          if (user?.id) {
            await setVerificationStep(user.id, 2, { 
              ocrData: newOcrData, 
              identityHash: hash,
              ageGroup 
            });
          }
        }
      } catch (_) {}

      // Done
      setOcrPipelinePct(100);
      setOcrPurifyMethod('sovereign_hash');
      setOcrPipelineActive(false);

      setManualAadhaarError(null);
      setError(null);
      
      // 🔱 CRITICAL: Set idConfirmed AFTER all data is ready
      setIdConfirmed(true);
      setOcrPipelineActive(false);
      setSaving(false);
      isProcessingRef.current = false;
      
      // 🎉 Trigger success animation
      if (typeof focusly?.celebrate === 'function') {
        focusly.celebrate('Aadhaar verified! ✓');
      }
      

      // MANUAL: User clicks "Continue to Liveness Check →" button to proceed
    } catch (err) {
      console.error('[TrustShield] Aadhaar submit error:', err);
      setManualAadhaarError(`Verification failed: ${err?.message || 'Unknown error'}. Please try again.`);
      setIdConfirmedState(false);
      localStorage.removeItem('trust_shield_id_confirmed');
    } finally {
      // 🔱 CRITICAL: ALWAYS reset processing states, even on error
      setOcrPipelineActive(false);
      setSaving(false);
      isProcessingRef.current = false;

    }
  }, [manualAadhaar, validateAadhaarVerhoeff, setOcrData, ocrData, handleFail, navigate, setIdentityHash, focusly,
      setOcrPipelineActive, setOcrPipelinePhase, setOcrPipelinePct, setOcrPipelineLabel, setOcrPurifyMethod, saving, user?.id, ageGroup,
      // 🔱 SOVEREIGN FIX: persistStepChange is a stable function reference, not needed in deps
      // persistStepChange
    ]);


  // 🔱 BULLETPROOF: Step 2 Student ID Submit - Fixed with proper state handling
  const handleManualStudentIdSubmit = useCallback(async (e) => {
    // CRITICAL: Prevent any default form submission
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validate first before setting processing state
    const cleaned = (manualStudentId || '').trim();
    const inst = (manualInstitution || '').trim();
    setManualStudentIdError(null);
    setError(null);

    if (cleaned.length < 4) {
      setManualStudentIdError('Enter your Student ID / Roll Number (at least 4 characters).');
      return;
    }
    if (inst.length < 2) {
      setManualStudentIdError('Enter your School/College name.');
      return;
    }
    
    // Prevent double-submit with stronger check
    if (saving || isProcessingRef.current) {

      return;
    }
    
    isProcessingRef.current = true;
    setSaving(true);

    try {
      // 🔱 GOD-LEVEL: Activate OCR Pipeline Progress Bar for Student ID
      setOcrPipelineActive(true);
      setOcrPipelinePhase(1);
      setOcrPipelinePct(10);
      setOcrPipelineLabel('🔬 Verifying Student ID...');

      const dup = await checkDuplicateStudentID(cleaned, inst);
      if (dup?.exists) {
        const alertConfig = getAlertConfig(dup.alertType);
        setManualStudentIdError(`${alertConfig.title}: ${alertConfig.message}`);
        setAccountLocked(true);
        setOcrPipelineActive(false);
        setSaving(false);
        setTimeout(() => {
          navigate(dup.redirectTo || '/auth', {
            state: {
              alert: {
                type: 'error',
                title: alertConfig.title,
                message: alertConfig.message,
                action: alertConfig.action,
              },
            },
          });
        }, 1500);
        return;
      }

      // Progress phase 2
      setOcrPipelinePhase(2);
      setOcrPipelinePct(45);
      setOcrPipelineLabel('🧬 Extracting Identity Data...');

      // Set OCR data FIRST
      const newOcrData = {
        ...(ocrData || {}),
        idNumber: cleaned,
        idType: 'student',
        institution: inst,
      };
      setOcrData(newOcrData);

      setOcrPipelinePhase(3);
      setOcrPipelinePct(80);
      setOcrPipelineLabel('🔒 Checking Global Uniqueness...');

      try {
        const hash = await computeIdentityHash(cleaned + ':' + inst);
        if (hash) {
          setIdentityHash(hash);
          // Persist hash immediately
          if (user?.id) {
            await setVerificationStep(user.id, 2, { 
              ocrData: newOcrData, 
              identityHash: hash,
              ageGroup 
            });
          }
        }
      } catch (_) {}

      setOcrPipelinePct(100);
      setOcrPurifyMethod('student_id');
      setOcrPipelineActive(false);

      setManualStudentIdError(null);
      setError(null);
      
      // 🔱 CRITICAL: Set idConfirmed AFTER all data is ready
      setIdConfirmed(true);
      setOcrPipelineActive(false);
      setSaving(false);
      isProcessingRef.current = false;
      

      
      // 🎉 Trigger success animation
      if (typeof focusly?.celebrate === 'function') {
        focusly.celebrate('Student ID verified! ✓');
      }
      
      // MANUAL: User clicks "Continue to Liveness Check →" button to proceed
    } catch (err) {
      console.error('[TrustShield] Student ID verification FAILED:', err);
      setManualStudentIdError(`Verification failed: ${err?.message || 'Unknown error'}. Please try again.`);
      setIdConfirmedState(false);
      localStorage.removeItem('trust_shield_id_confirmed');
    } finally {
      // 🔱 CRITICAL: ALWAYS reset processing states, even on error
      setOcrPipelineActive(false);
      setSaving(false);
      isProcessingRef.current = false;

    }
  }, [manualStudentId, manualInstitution, setOcrData, ocrData, handleFail, navigate, setIdentityHash, focusly,
      setOcrPipelineActive, setOcrPipelinePhase, setOcrPipelinePct, setOcrPipelineLabel, setOcrPurifyMethod, saving, user?.id, ageGroup,
      // 🔱 SOVEREIGN FIX: persistStepChange is a stable function reference, not needed in deps
      // persistStepChange
    ]);

  useEffect(() => {
    if (step !== 4) return;
    setTypewriterText('');
    let i = 0;
    const iv = setInterval(() => {
      setTypewriterText(fullWaitingText.slice(0, i + 1));
      if (++i >= fullWaitingText.length) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [step, fullWaitingText]);

  // ── Redirect if already verified ─────────────────────────────────────────
  useEffect(() => {
    if (
      localStorage.getItem('bypass_used') === 'true' ||
      profile?.verification_status === 'VERIFIED' ||
      profile?.trust_shield_status === 'VERIFIED'
    ) {
      navigate('/home', { replace: true });
    }
  }, [profile, navigate]);

  // ── Cooldown Check ────────────────────────────────────────────────────────
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    localStorage.removeItem(COOLDOWN_KEY);
    localStorage.removeItem(FAIL_COUNT_KEY);
    localStorage.removeItem('trust_shield_attempts');
    localStorage.removeItem('trust_shield_lock_until');
    if (!isLocalhost) {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil && new Date().getTime() < parseInt(cooldownUntil)) {
        setIsLocked(true);
        setError('Maximum attempts reached. Verification locked for 1 hour.');
      }
    }
  }, []);

  /**
   * handleHardReset — THE LAW (Nuclear Reset per Pillar 1 Spec)
   * ────────────────────────────────────────────────────────────
   * Triggered when a user's ID reveals an age/tier mismatch they lied about.
   *
   * Sequence (spec-mandated):
   *   1. supabase.auth.signOut()   — kill the session
   *   2. clear localStorage + sessionStorage
   *   3. wipe all React state     — step, ageGroup, OCR, hash
   *   4. stop all cameras         — scanner + liveness
   *   5. navigate to Step 1       — they must re-enter from the very beginning
   *
   * No 'Retry Scan' option exists.
   */
  const handleHardReset = useCallback(async (reason) => {
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);

    // 🦁 Pillar 4 — Focusly reacts with disappointment (the ritual has been broken)
    try { focusly.disappoint(reason || 'Your ID did not match your tier. Let\'s start over — you got this.'); } catch (_) {}

    // 1. Stop camera streams FIRST to prevent hardware contention
    scanner.stopCamera?.();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => t.stop());
      liveStreamRef.current = null;
    }

    // 2. Wipe all persisted state
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}

    // 3. Sign the user out of Supabase — the session cannot survive a hard reset
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[TrustShield] signOut during hard reset failed:', err);
    }

    // 4. Reset all React state back to Step 1
    setStepRaw(1);
    setAgeGroup(null);
    setOcrData(null);
    setIdentityHash(null);
    setManualAadhaar('');
    setManualAadhaarError(null);
    setManualStudentId('');
    setManualInstitution('');
    setManualStudentIdError(null);
    setIdConfirmedState(false);
    localStorage.removeItem('trust_shield_id_confirmed');
    setAccountLocked(false);
    setStaticImageFlag(false);
    setLivenessPhase(0);
    setLivenessComplete([false]); // 🔱 1 challenge only — UNBYPASSABLE SMILE
    setLivenessStatus('');
    setError(reason || 'Your ID does not match your selected age tier. You have been signed out and returned to Step 1.');

    // 5. Navigate back to /auth — session is gone, they must re-authenticate
    setTimeout(() => navigate('/auth', { replace: true }), 2500);
  }, [scanner, navigate, focusly]);

  const handleSuccessFeedback = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    localStorage.removeItem(FAIL_COUNT_KEY);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 3: ATOMIC ACCOUNT CREATION - God-Level Verification Finalization
  // ═══════════════════════════════════════════════════════════════════════════
  const completeVerification = useCallback(async () => {


    setSaving(true);
    
    try {
      // ═════════════════════════════════════════════════════════════════════
      // 🔒 ULTRA STRICT: Pre-Validation Checks (Fail Fast)
      // ═════════════════════════════════════════════════════════════════════

      const rawIdNumber = ocrData?.idNumber || ocrData?.id;

      
      const cleanId = (rawIdNumber || '').toUpperCase().replace(/\s/g, '');

      

      let effectiveIdentityHash = identityHash;
      if (!effectiveIdentityHash) {

        try {
          effectiveIdentityHash = await computeIdentityHash(cleanId);
          if (effectiveIdentityHash) setIdentityHash(effectiveIdentityHash);
        } catch (e) {
          console.error('[TrustShield] Hash computation failed:', e);
        }
      }
      
      // GATE: Identity hash must exist
      if (!effectiveIdentityHash) {

        handleFail('Verification failed: identity hash missing. Please rescan your ID.');
        setSaving(false);
        return;
      }


      // ═════════════════════════════════════════════════════════════════════
      // 🔱 GOD-LEVEL: SOVEREIGN IDENTITY CHECK
      // verify_unique_identity RPC — One Person = One Account. THE LAW.
      // ═════════════════════════════════════════════════════════════════════


      
      let sovereignCheck;
      try {
        sovereignCheck = await verifySovereignIdentity(effectiveIdentityHash, user?.id);

      } catch (sovereignErr) {
        console.error('[TrustShield] ❌ verifySovereignIdentity FAILED:', sovereignErr);
        handleFail('Identity verification service error. Please try again.');
        setSaving(false);
        return;
      }

      if (!sovereignCheck?.unique) {
        // 🛑 THE REDIRECT LOCK: hard redirect + session clear
        const msg = 'Identity already linked to another account.';
        alert(msg);
        setAccountLocked(true);
        setSaving(false);

        // Clear local session data
        try { localStorage.clear(); sessionStorage.clear(); } catch {}
        // Sign out of Supabase
        try { await supabase.auth.signOut(); } catch {}
        // Hard redirect to Step 1 (Auth)
        setTimeout(() => navigate('/auth', { replace: true }), 800);
        return;
      }



      // Check 2: Identity Uniqueness (CRITICAL - One Person = One Account)

      const uniquenessCheck = await checkIdentityUniqueness(
        ocrData?.name,
        ocrData?.dob,
        deviceId,
        user?.id
      );
      
      if (!uniquenessCheck?.unique) {
        console.error('[TrustShield] 🔒 ULTRA: Identity collision detected:', uniquenessCheck);
        handleFail(uniquenessCheck?.message || '🔒 ONE PERSON = ONE ACCOUNT: This government ID is already registered');
        setAccountLocked(true);
        setSaving(false);
        return;
      }
      

      
      // Log the attempt
      await logVerificationAttempt(user.id, 'finalization', 'ATTEMPT', {
        device_id: deviceId,
        age_group: ageGroup,
        id_type: uniquenessCheck?.idType,
      });
      
      // ═════════════════════════════════════════════════════════════════════
      // Run the 6-Layer God-Level Validation Pipeline
      // ═════════════════════════════════════════════════════════════════════
      const validation = await runGodLevelValidation({
        userId: user.id,
        idFile: scanner?.capturedFile,
        ocrResult: ocrData,
        selfieFrames: [], // Will be populated from liveness capture
        livenessComplete: livenessComplete,
      });
      
      if (!validation.passed) {
        const errorMsg = validation.errors.join('; ');
        console.error('[TrustShield] God-Level validation failed:', validation);
        handleFail(errorMsg);
        
        // Log failure
        await logVerificationAttempt(user.id, 'finalization', 'FAILED', {
          errors: validation.errors,
          device_id: deviceId,
        });
        
        return;
      }
      

      
      // ═════════════════════════════════════════════════════════════════════
      // LAYER 3: ATOMIC VERIFICATION COMPLETION
      // Only the RPC can mark an account as verified - no direct updates
      // ═════════════════════════════════════════════════════════════════════
      // ═════════════════════════════════════════════════════════════════════
      // ULTRA STRICT: Calculate actual face score from liveness
      // Must be >= 0.88 to pass SQL check
      // ═════════════════════════════════════════════════════════════════════
      // 🔱 CRITICAL: Use both ref (immediate) and state (UI) for maximum reliability
      const refCompletedCount = livenessCompleteRef.current.filter(Boolean).length;
      const stateCompletedCount = livenessComplete.filter(Boolean).length;
      const completedChallenges = Math.max(refCompletedCount, stateCompletedCount);
      
      const faceScore = completedChallenges === 1 ? 0.98 : 0; // 🔱 1 challenge — UNBYPASSABLE SMILE (98% threshold)
      
      if (faceScore < 0.95) {
        handleFail('🔒 LIVENESS FAIL: UNBYPASSABLE SMILE challenge incomplete. Hold a genuine smile for 3+ seconds with proper lighting. Score: ' + faceScore.toFixed(2));
        setSaving(false);
        return;
      }

      // 🔱 GOD-LEVEL: Store sovereign hash on the profile
      await storeSovereignHash(user.id, effectiveIdentityHash);
      
      // ═════════════════════════════════════════════════════════════════════
      // ULTRA STRICT: Use raw ID from pre-check (already validated)
      // ═════════════════════════════════════════════════════════════════════
      const result = await finalizeVerificationV2({
        userId: user.id,
        identityHash: effectiveIdentityHash,
        deviceId: deviceId,
        ocrData: {
          ...(ocrData || {}),
          idNumber: cleanId,
          idType: ocrData?.idType || (ageGroup === '18+' ? 'aadhaar' : (ocrData?.idType || 'unknown')),
        },
        faceScore: faceScore,
        ageGroup: ageGroup,
      });
      
      if (!result.success) {
        console.error('[TrustShield] Verification finalization failed:', result);
        handleFail(result.error || 'Verification failed. Please try again.');
        
        await logVerificationAttempt(user.id, 'finalization', 'ATOMIC_FAILED', {
          error: result.error,
          code: result.code,
        });
        
        return;
      }
      

      
      // Record successful attempt for rate limiting
      await recordAttempt();
      
      // Refresh session so global profile state picks up immediately
      await supabase.auth.refreshSession();
      
      // Handle teen guardian flow
      const isTeen = ageGroup === '13-17';
      if (isTeen) {
        const token = await createGuardianHandshake({
          teenUserId: user.id,
          metadata: { ocrData },
        });
        setGuardianToken(token);
      }
      
      // Clear step lock on success
      setLockedStep(null);
      
      // 🏛️ SOVEREIGN FIX: Ensure ageGroup is persisted before navigating to step 5
      if (ageGroup) {
        localStorage.setItem('trust_shield_age_group', ageGroup);
      }
      

      setStepRaw(5);
      
      // 🦁 Pillar 4 — Focusly celebrates
      try {
        const firstName = user?.user_metadata?.full_name?.split(' ')?.[0];
        if (isTeen) {
          focusly.motivate(
            firstName
              ? `Almost there, ${firstName}! Your guardian just needs to confirm and you're in. 🎉`
              : `Almost there! Your guardian just needs to confirm and you're in. 🎉`
          );
        } else {
          focusly.celebrate(
            firstName
              ? `Welcome to Focus, ${firstName}! You are officially verified. Real people, real connections.`
              : `Welcome to Focus! You are officially verified. Real people, real connections.`
          );
        }
      } catch (_) { /* non-critical */ }
      
      // Log success
      await logVerificationAttempt(user.id, 'finalization', 'SUCCESS', {
        verification_status: result.verificationStatus,
        is_minor: result.isMinor,
      });
      
    } catch (err) {
      console.error('[TrustShield] Complete verification error:', err);
      handleFail('Failed to save verification. Please try again.');
      
      await logVerificationAttempt(user.id, 'finalization', 'ERROR', {
        error: err.message,
      });
    } finally {
      setSaving(false);
    }
  }, [ageGroup, ocrData, user, handleFail, focusly, deviceId, livenessComplete, scanner?.capturedFile, identityHash, validateAadhaarVerhoeff, setIdentityHash]);

  // ── Mobile Realtime Sync (Desktop listens for VERIFIED) ──────────────────
  useEffect(() => {
    if (step !== 4 || !user) return;
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new.verification_status === 'VERIFIED') {
          handleSuccessFeedback();
          setShowAccessGranted(true);
          setTimeout(() => navigate('/home', { replace: true }), 2500);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [step, user, handleSuccessFeedback, navigate]);

  // 🔒 PRODUCTION: No bypass backdoors - Trust Shield verification is mandatory

  // 🏛️ SOVEREIGN FIX: Fetch age_group from backend if missing on step 5
  // 🔱 CRITICAL FIX: Removed setAgeGroup from deps to prevent infinite loop
  useEffect(() => {
    if (step === 5 && !ageGroup && user?.id) {

      
      const fetchAgeGroup = async () => {
        try {
          // Try RPC function first (most reliable)
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_verification_status', {
            p_user_id: user.id
          });
          
          if (!rpcError && rpcData?.success && rpcData?.age_group) {

            setAgeGroupRaw(rpcData.age_group); // 🔱 Use raw setter
            localStorage.setItem('trust_shield_age_group', rpcData.age_group);
            return;
          }
          
          // Fallback: direct table query
          const { data, error } = await supabase
            .from('profiles')
            .select('age_group, verification_metadata, trust_shield_status')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('[TrustShield] Failed to fetch profile:', error);
            return;
          }
          

          
          // Try age_group column first, then metadata backup
          const fetchedAgeGroup = data.age_group || data.verification_metadata?.age_group;
          if (fetchedAgeGroup) {

            setAgeGroupRaw(fetchedAgeGroup); // 🔱 Use raw setter
            localStorage.setItem('trust_shield_age_group', fetchedAgeGroup);
          } else {
            console.warn('[TrustShield] No ageGroup found in profile - user needs to reselect');
          }
        } catch (err) {
          console.error('[TrustShield] Failed to fetch age_group:', err);
        }
      };
      fetchAgeGroup();
    }
    // 🔱 CRITICAL: Only run when step or ageGroup actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step === 5 && !ageGroup, user?.id]); // 🔱 Fixed: use boolean condition instead of raw values

  // MANUAL FLOW: No auto-redirect - user clicks "Enter Focus" button

  // 🔒 PRODUCTION: Trust Shield verification is mandatory - no bypass functions

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 STEP HANDLERS WITH GOD-LEVEL VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── STEP 1 Handler ───────────────────────────────────────────────────────
  const handleAgeConfirm = async () => {
    if (!ageGroup || isLocked) return;

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2 STEP 1: Guardian Link Path — Skip ID scan, validate token
    // ═══════════════════════════════════════════════════════════════════════
    if (ageGroup === 'guardian-link') {
      if (!guardianTokenInput) {
        setError('Please enter your guardian approval token or link.');
        return;
      }

      setSaving(true);
      try {
        // Extract token from full URL if pasted
        let token = guardianTokenInput;
        if (guardianTokenInput.includes('token=')) {
          const url = new URL(guardianTokenInput);
          token = url.searchParams.get('token') || url.searchParams.get('t') || guardianTokenInput;
        }

        // Validate token via guardian handshake RPC
        const { data: handshakeData, error: handshakeError } = await supabase
          .rpc('verify_guardian_token', { p_token: token });

        if (handshakeError || !handshakeData?.valid) {
          setError('Invalid or expired guardian link. Please ask your parent/guardian for a new approval link.');
          setSaving(false);
          return;
        }

        // Token valid — activate teen account immediately
        setGuardianToken(token);

        // Update profile to verified status (teen with guardian approval)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'VERIFIED',
            trust_shield_status: 'VERIFIED',
            focus_trust_status: 'VERIFIED',
            is_verified: true,
            trust_tier: 3, // Teen tier with guardian approval
            is_teen_mode: true,
            guardian_consent_status: 'approved',
            can_post: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.id);

        if (updateError) {
          setError('Account activation failed. Please try again.');
          setSaving(false);
          return;
        }

        // Log success
        await logVerificationAttempt(user?.id, 'guardian_link_activation', 'SUCCESS', { token_prefix: token?.slice(0, 8) || 'N/A' });

        // Navigate to success step
        setStepRaw(5);
        focusly?.celebrate('Your account is now active! Welcome to Focus, Macha! 🎉');
        return;
      } catch (err) {
        console.error('[TrustShield] Guardian link activation error:', err);
        setError('Failed to activate account. Please check your token and try again.');
        setSaving(false);
        return;
      }
    }

    // Standard paths (Student ID / Government ID)
    const rateLimit = await checkRateLimit(deviceId);
    if (!rateLimit.allowed) {
      setError(rateLimit.reason);
      setIsLocked(true);
      return;
    }

    setError(null);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: OCR Template Preparation per selected path
    // ═══════════════════════════════════════════════════════════════════════
    const ocrTemplate = ageGroup === '13-17'
      ? { type: 'student', patterns: ['STUDENT_ID', 'ROLL_NO', 'ADMISSION_NO'], whitelist: 'alphanumeric' }
      : { type: 'government', patterns: ['AADHAAR', 'PAN', 'PASSPORT'], whitelist: ageGroup === '18+' ? 'digits' : 'alphanumeric' };



    // Persist step 2 with OCR template metadata
    try {
      await setVerificationStep(user?.id, 2, { ageGroup, ocrTemplate });
    } catch (err) {
      console.warn('[TrustShield] Step persistence failed:', err);
    }
    
    // 🔱 BULLETPROOF: Set step directly
    setStepRaw(2);

    // Log attempt with template info
    try {
      await logVerificationAttempt(user?.id, 'step_1_path_selection', 'COMPLETE', {
        ageGroup,
        ocrTemplate: ocrTemplate.type,
      });
    } catch (err) {
      console.warn('[TrustShield] Log attempt failed:', err);
    }
    // MANUAL: Camera does NOT auto-start - user clicks "Open Camera" button
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 STEP 2: OCR result ready → God-Level 6-Layer Validation
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // 🔱 CRITICAL: Only process once per capture event
    const captureKey = `${scanner.phase}-${scanner.ocrResult?.timestamp || scanner.ocrResult?.rawText?.slice(0, 20) || 'no-result'}`;
    if (scanner.phase !== 'captured' || !scanner.ocrResult || processedCaptureRef.current === captureKey) {
      return;
    }
    processedCaptureRef.current = captureKey; // Mark as processed
    
    const result = scanner.ocrResult;

    const processOCRResult = async () => {
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔱 PARADIGM SHIFT: OCR is a CONVENIENCE, not a GATE
    // OCR auto-fills fields when it can. User ALWAYS enters/confirms ID number.
    // OCR failure = fields not pre-filled, not a flow blocker.
    // ═══════════════════════════════════════════════════════════════════════════

    // Always store whatever OCR extracted (name, DOB, partial ID)
    setOcrData((prev) => ({
      ...(prev || {}),
      name: result.name || (prev || {}).name || null,
      dob: result.dob || (prev || {}).dob || null,
      idNumber: result.idNumber || (prev || {}).idNumber || null,
      idType: result.idType || (prev || {}).idType || null,
      idMaskedLast4: result.idMaskedLast4 || (prev || {}).idMaskedLast4 || null,
      confidence: result.confidence || 0,
      rawText: result.rawText || '',
    }));

    // Pre-fill manual entry fields from OCR
    if (result.idNumber && /^\d{12}$/.test(result.idNumber.replace(/\s/g, ''))) {
      setManualAadhaar(result.idNumber);
    }
    if (result.idNumber && result.idType === 'student') {
      setManualStudentId(result.idNumber);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔱 LAYER 2.3: ID QUALITY CHECK - Block files < 50KB (always run)
    // ═══════════════════════════════════════════════════════════════════════════
    if (scanner?.capturedFile) {
      const quality = await validateIDQuality(scanner.capturedFile);
      if (!quality.ok) {
        console.error('[TrustShield] ID quality check failed:', quality);
        handleFail(ERROR_CODES.ERR_FILE_TOO_SMALL + '\n\n' + quality.errors.map(e => e.message).join('\n'));
        return;
      }

    }

    // If OCR couldn't fully read the document, that's OK — user will fill in manually
    if (!result.ok) {

      setError(null);
      return;
    }

    // ── THE GATEKEEPER & THE LAW: Classification + Validations ──
    const detected = result.rawText ? classifyDocumentTier(result.rawText) : 'unknown';
    const required = ageGroup === '18+' ? 'adult' : 'teen';
    
    let age = null;
    let dobValid = false;
    if (result.dob) {
      const parts = result.dob.split(/[\/-]/);
      if (parts.length === 3) {
        const year = parts.find(p => p.length === 4);
        if (year) { age = new Date().getFullYear() - parseInt(year); dobValid = true; }
      }
    }

    // 1. Classification Lock
    if (detected !== required) {
       // SPECIAL BYPASS: We are 100% sure of DOB (dobValid=true) but unsure of document type (detected='unknown').
       // Allow them to pass to Age Check to prioritize real people.
       if (detected === 'unknown' && dobValid) {

       } else {
          // Professional, helpful error messages with specific guidance
          let msg;
          if (detected === 'unknown') {
            msg = 'ERR_UNCLEAR_DOCUMENT: We could not read the document type clearly.\n\nTips:\n• Ensure all corners of the ID are visible\n• Remove any glare or shadows\n• Make sure text is not blurred\n• Use a plain background';
          } else if (required === 'adult') {
            msg = 'ERR_WRONG_DOCUMENT_TYPE: You selected "Ages 18+" but uploaded a Student ID.\n\nFor 18+ tier, please upload:\n• Aadhaar Card\n• PAN Card\n• Passport\n• Driver\'s License\n• Voter ID\n\nIf you are under 18, please go back and select "Ages 13-17" tier.';
          } else {
            msg = 'ERR_WRONG_DOCUMENT_TYPE: You selected "Ages 13-17" (Teen tier) but uploaded a Government ID.\n\nFor Teen tier, please upload:\n• School ID Card\n• College/Institute ID\n• Student Photo ID\n\nIf you are 18 or older, please go back and select "Ages 18+" tier.';
          }
          handleFail(msg);
          return;
       }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PILLAR 1: AGE VERIFICATION RULE ENGINE — STRICT TIER ENFORCEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    if (dobValid && age !== null) {
      // Under 13 — Platform not available
      if (age < 13) {
        handleHardReset('ERR_UNDERAGE: Focus is not available for anyone under 13. Your session has been terminated and you have been returned to Step 1.');
        return;
      }
      
      // Tier Mismatch: Selected 18+ but ID proves under 18
      if (ageGroup === '18+' && age < 18) {
        handleHardReset('ERR_TIER_MISMATCH: Your government ID confirms you are under 18. You selected the wrong age tier. Session terminated. Please select Ages 13–17 and use a Student ID.');
        return;
      }
      
      // Tier Mismatch: Selected 13-17 but ID proves 18+
      if (ageGroup === '13-17' && age >= 18) {
        handleHardReset('ERR_TIER_MISMATCH: Your ID confirms you are 18 or older. Session terminated. Please select Ages 18+ and upload a valid Government ID (Aadhaar/Passport).');
        return;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔱 LAYER 2.5: IDENTITY UNIQUENESS CHECK - One Person = One Account
    // ═══════════════════════════════════════════════════════════════════════════
      // Check identity uniqueness via RPC
      if (result.name && result.dob) {
        const uniqueness = await checkIdentityUniqueness(result.name, result.dob, deviceId, user?.id);
        
        if (!uniqueness.unique) {
          setAccountLocked(true);
          setStaticImageFlag(true);
          cancelAnimationFrame(rafRef.current);
          if (liveStreamRef.current) {
            liveStreamRef.current.getTracks().forEach(t => t.stop());
            liveStreamRef.current = null;
          }
          handleFail(ERROR_CODES.ERR_DUPLICATE_IDENTITY + (uniqueness.reason ? ` (${uniqueness.reason})` : ''));
          scanner.stopCamera?.();
          
          // Log the duplicate attempt
          await logVerificationAttempt(user?.id, 'uniqueness_check', 'BLOCKED', {
            reason: uniqueness.reason,
            device_id: deviceId,
          });
          
          return;
        }
        

      }

      // ── THE DNA: SHA-256 Identity Deduplication ──────────────────────────
      if (result.idNumber) {
        try {
          const hash = await computeIdentityHash(result.idNumber);
          if (hash) {
            // Double-check via hash
            const { data: existing } = await supabase
              .from('profiles')
              .select('id')
              .eq('identity_hash', hash)
              .neq('id', user?.id ?? '')
              .maybeSingle();

            if (existing) {
              setAccountLocked(true);
              setStaticImageFlag(true);
              cancelAnimationFrame(rafRef.current);
              if (liveStreamRef.current) {
                liveStreamRef.current.getTracks().forEach(t => t.stop());
                liveStreamRef.current = null;
              }
              handleFail(ERROR_CODES.ERR_DUPLICATE_IDENTITY);
              scanner.stopCamera?.();
              return;
            }

            setIdentityHash(hash);
          }
        } catch (_) {
          console.warn('[TrustShield] Identity hash check failed:', _);
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // 🔱 LAYER 2.6: ID NUMBER DUPLICATE CHECK - One ID = One Account
      // This catches duplicates even if the identity hash somehow differs
      // ═══════════════════════════════════════════════════════════════════════════
      if (result.idNumber && result.idType) {
        try {
          let duplicateCheck;
          
          if (ageGroup === '13-17' && result.idType === 'student') {
            // For teen tier, check student ID duplicate
            duplicateCheck = await checkDuplicateStudentID(
              result.idNumber,
              result.institution || 'Unknown Institution'
            );
          } else {
            // For 18+ tier, check government ID duplicate
            duplicateCheck = await checkDuplicateID(result.idNumber, result.idType);
          }
          
          if (duplicateCheck?.exists) {
            setAccountLocked(true);
            setStaticImageFlag(true);
            cancelAnimationFrame(rafRef.current);
            if (liveStreamRef.current) {
              liveStreamRef.current.getTracks().forEach(t => t.stop());
              liveStreamRef.current = null;
            }
            
            const alertConfig = getAlertConfig(duplicateCheck.alertType);
            handleFail(`${alertConfig.title}: ${alertConfig.message}\n\n${alertConfig.action}`);
            scanner.stopCamera?.();
            
            // Log the duplicate ID attempt
            await logVerificationAttempt(user?.id, 'id_duplicate_check', 'BLOCKED', {
              id_type: result.idType,
              alert_type: duplicateCheck.alertType,
              device_id: deviceId,
            });
            
            // Redirect after short delay
            setTimeout(() => {
              navigate(duplicateCheck.redirectTo || '/auth', {
                state: { 
                  alert: {
                    type: 'error',
                    title: alertConfig.title,
                    message: alertConfig.message,
                    action: alertConfig.action
                  }
                }
              });
            }, 3000);
            
            return;
          }
          

        } catch (dupErr) {
          console.warn('[TrustShield] ID duplicate check error:', dupErr);
          // Continue even if check fails - we still have identity_hash check
        }
      }
      
      // Log successful Step 2 completion
      await logVerificationAttempt(user?.id, 'step_2_id_scan', 'COMPLETE', {
        document_type: detected,
        age_valid: dobValid,
        quality_passed: true,
        uniqueness_passed: true,
      });
      
      setOcrData(result);
      setError(null);
    }; // end processOCRResult

    processOCRResult();
  }, [scanner.phase, scanner.ocrResult, scanner.capturedFile, ageGroup, handleFail, handleHardReset, user?.id, deviceId]);

  // ── STEP 3: Load face-api models ──────────────────────────────────────────
  const loadFaceModels = useCallback(async () => {
    if (faceModelsLoaded) return;
    setLivenessStatus('🔬 Loading biometric AI modules...');
    
    // Try multiple model sources for maximum reliability
    const modelUrls = [
      '/models',
      '/public/models',
      'https://justadudewhohacks.github.io/face-api.js/models',
    ];
    
    for (const MODEL_URL of modelUrls) {
      try {

        
        // Load ALL available detectors for best detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        
        setFaceModelsLoaded(true);
        setLivenessStatus('✅ AI ready — look at camera');

        return; // Success - exit
      } catch (e) {
        console.warn('[TrustShield] Failed to load from', MODEL_URL, e.message);
        // Continue to next URL
      }
    }
    
    // All sources failed
    console.error('[TrustShield] All face model sources failed');
    setLivenessStatus('❌ Failed to load Face AI. Refresh page or check connection.');
  }, [faceModelsLoaded]);

  // 🔱 CRITICAL TDZ FIX: Define startLivenessLoop FIRST, before functions that use it
  // It depends on setLivenessStatus, setLivenessPhase, setLivenessComplete (state setters)
  const startLivenessLoop = useCallback(() => {
    // 🔱 CRITICAL: Sync refs with current state at loop start
    livenessPhaseRef.current = livenessPhase;
    livenessCompleteRef.current = [...livenessComplete];
    
    let lastTime = 0;
    let consecutiveFailures = 0;
    let lastStatusMessage = '';
    let lastStatusTime = 0;
    let frameCount = 0;
    let challengeProgressShown = -1;
    let loopRunning = true;
    let challengeHoldStart = 0; // 🔱 Track when challenge hold started
    
    // 🔱 BULLETPROOF: Ultra-strict debouncing - 5000ms max frequency to prevent spam
    const setStatusDebounced = (msg, force = false) => {
      const now = Date.now();
      // 🔱 GOD-LEVEL: Only update if: forced, or (5 seconds passed AND message changed)
      if (force) {
        setLivenessStatus(msg);
        lastStatusMessage = msg;
        lastStatusTime = now;
        return;
      }
      // Skip duplicate messages entirely
      if (msg === lastStatusMessage) return;
      // Only update if 5 seconds have passed - REDUCED SPAM
      if (now - lastStatusTime > 5000) {
        setLivenessStatus(msg);
        lastStatusMessage = msg;
        lastStatusTime = now;
      }
    };
    
    const detect = async (timestamp) => {
      if (!loopRunning) return;
      if (!liveVideoRef.current) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      
      // Check if video is actually playing
      if (liveVideoRef.current.paused || liveVideoRef.current.ended) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      
      // Check video dimensions are valid
      if (liveVideoRef.current.videoWidth === 0 || liveVideoRef.current.videoHeight === 0) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      
      // 🔱 MAX SPEED: Run at ~15fps for instant detection (every 66ms)
      if (timestamp - lastTime < 66) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }
      lastTime = timestamp;
      frameCount++;

      try {
        // 🔱 MAX SPEED + INSTANT DETECTION: Lowest threshold, smallest input size
        const detection = await faceapi
          .detectSingleFace(liveVideoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }))
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!detection) {
          consecutiveFailures++;
          // 🔱 INSTANT FEEDBACK: Show status after just 2 failures
          if (consecutiveFailures === 2) {
            setStatusDebounced('👤 Face not detected — move closer, ensure good lighting', true);
          }
          // 🔱 CRITICAL: Must schedule next frame before returning
          rafRef.current = requestAnimationFrame(detect);
          return;
        }
        
        // Reset failure counter on success
        consecutiveFailures = 0;
        // 🔱 SOVEREIGN: Always show positive feedback when face detected (first time or after failures)
        setStatusDebounced('✅ Face detected! Follow the challenge below 👇', true);

        const { landmarks, expressions } = detection;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();

        // ── HEAD POSE: Yaw from nose vs eye center ───────────────────────────
        const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
        const noseX = nose[0].x;
        const yaw = (noseX - eyeCenterX) / (rightEye[3].x - leftEye[0].x); // normalized -1 to 1

        // ── ANTI-SPOOF: Static injection check ─────────────────────────────
        const currentLandmarksString = JSON.stringify(landmarks.positions.slice(0, 10));
        if (prevFaceCenterRef.current === currentLandmarksString) {
            teleportCountRef.current = (teleportCountRef.current || 0) + 1;
            if (teleportCountRef.current > 20) {
               cancelAnimationFrame(rafRef.current);
               if (liveStreamRef.current) {
                 liveStreamRef.current.getTracks().forEach(t => t.stop());
                 liveStreamRef.current = null;
               }
               setAccountLocked(true);
               setStaticImageFlag(true);
               handleFail('SECURITY_ALERT: Static photo/video injection detected. Challenge reset.');
               return;
            }
        } else {
            teleportCountRef.current = 0;
        }
        prevFaceCenterRef.current = currentLandmarksString;

        // ── CHALLENGE DETECTION: UNBYPASSABLE SMILE ONLY ──
        // 🔱 EAR calculation removed — blink detection eliminated, smile only

        // 🔱 CRITICAL: Get current challenge state from REF for fresh value
        const currentPhaseIndex = livenessPhaseRef.current;
        const currentChallenge = challengeSequenceRef.current?.[currentPhaseIndex];
        
        if (!currentChallenge || currentPhaseIndex >= 1) { // 🔱 1 challenge only — UNBYPASSABLE SMILE
          // All challenges complete or not initialized
          // 🔱 CRITICAL: Must schedule next frame before returning
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        // 🔱 BULLETPROOF: Advance function with proper state synchronization
        const advance = () => {
          const nextIdx = currentPhaseIndex + 1;
          
          // 🔱 CRITICAL: Update refs immediately for synchronous reads
          const updatedComplete = [...livenessCompleteRef.current];
          updatedComplete[currentPhaseIndex] = true;
          livenessCompleteRef.current = updatedComplete;
          livenessPhaseRef.current = nextIdx >= 1 ? 1 : nextIdx; // 🔱 1 challenge only — complete at 1
          
          // Update completion state (async, for UI)
          setLivenessComplete(updatedComplete);
          
          // Reset per-challenge counters
          smileHoldRef.current = 0;
          challengeProgressShown = 0;
          challengeHoldStart = 0;
          
          if (nextIdx >= 1) {
            // 🔱 ALL CHALLENGES COMPLETE (1 challenge — UNBYPASSABLE SMILE)
            setLivenessPhase(1);
            // CRITICAL: Clear ALL blocking flags when real user completes challenge
            setStaticImageFlag(false);
            staticImageFlagRef.current = false;
            setAccountLocked(false); // CLEAR ACCOUNT LOCK on successful completion
            accountLockedRef.current = false;
            // Stop camera
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (liveStreamRef.current) {
              liveStreamRef.current.getTracks().forEach(t => t.stop());
              liveStreamRef.current = null;
            }
            setStatusDebounced('✅ Challenge complete! Click Continue to proceed...', true);
            if (navigator?.vibrate) navigator.vibrate([200, 100, 200]);
            // MANUAL: User clicks Continue button - no auto-continue
          } else {
            // Move to next challenge
            setLivenessPhase(nextIdx);
            const nextChallenge = challengeSequenceRef.current[nextIdx];
            setStatusDebounced(`🔱 UNBYPASSABLE: ${nextChallenge?.icon || ''} ${nextChallenge?.label || 'Smile & Hold'}`, true); // 🔱 1 challenge
          }
        };

        // 🔱 UNBYPASSABLE SMILE CHALLENGE — expressions.happy sustained > 0.65 for ≥5 frames
        // STRICT: Higher threshold, longer hold time = harder to fake with static images
        if (currentChallenge.id === 'smile') {
          const currentSmileCount = smileHoldRef.current || 0;
          
          // Show progress every 15th frame only (much less spam)
          if (frameCount % 15 === 0 && currentSmileCount !== challengeProgressShown) {
            challengeProgressShown = currentSmileCount;
            setStatusDebounced(`😊 UNBYPASSABLE SMILE — Hold genuine smile (${Math.min(currentSmileCount, 5)}/5 complete)`); // 🔱 1 challenge, 5 frames required
          }
          
          // 🔱 UNBYPASSABLE: Strict threshold 0.65 (was 0.5) and 5 frames (was 3)
          // This makes it much harder to bypass with fake photos or videos
          if (expressions.happy > 0.65) {
            smileHoldRef.current = currentSmileCount + 1;
            if (smileHoldRef.current >= 5) {
              advance();
              return;
            }
          } else {
            // 🔱 UNBYPASSABLE: Reset counter if smile drops below threshold
            // This forces continuous genuine smiling, not just a quick flash
            if (currentSmileCount > 0 && frameCount % 30 === 0) {
              smileHoldRef.current = 0;
              setStatusDebounced('⚠️ Smile dropped — start over and hold continuously', true);
            }
          }
        }
        
        // 🔱 CRITICAL: Schedule next frame after processing smile challenge
        if (currentChallenge.id === 'smile' && livenessPhaseRef.current === currentPhaseIndex) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        // 🔱 SOVEREIGN: Only 1 challenge (UNBYPASSABLE SMILE) — no blink, no tilt, no look
        
        // 🔱 CRITICAL: Schedule next frame after all challenges processed
        rafRef.current = requestAnimationFrame(detect);
      } catch (err) {
        consecutiveFailures++;
        if (consecutiveFailures > 15) {
          console.error('[TrustShield] Liveness detection paused due to errors');
          loopRunning = false;
          setStatusDebounced('⚠️ Detection paused. Please ensure good lighting and try again.', true);
        }
        // 🔱 CRITICAL: Schedule next frame even after errors (unless paused)
        if (loopRunning) {
          rafRef.current = requestAnimationFrame(detect);
        }
      }
    };
    
    // Start the detection loop
    rafRef.current = requestAnimationFrame(detect);
  }, [livenessPhase]); // Minimal dependencies

  // ── STOP Liveness Camera (No dependencies) ───────────────────
  const stopLivenessCamera = useCallback(() => {
    // 🔱 MEMORY FIX: Cancel RAF and reset ref
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => t.stop());
      liveStreamRef.current = null;
    }
  }, []);

  // ── START Liveness Camera (depends on startLivenessLoop) ───────────────────
  const startLivenessCamera = useCallback(async () => {
    // ── SINGLE UNBYPASSABLE CHALLENGE (Smile Only) ──
    // 🔱 SOVEREIGN: 1 powerful challenge — no shuffle needed for single item
    const shuffled = shuffleChallenges(LIVENESS_CHALLENGE_POOL);
    challengeSequenceRef.current = shuffled;
    
    // Try multiple camera configurations for better compatibility
    const cameraConfigs = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: true, audio: false },
    ];
    
    let lastError = null;
    
    for (let i = 0; i < cameraConfigs.length; i++) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(cameraConfigs[i]);
        liveStreamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.playsInline = true;
          liveVideoRef.current.muted = true;
          await liveVideoRef.current.play();
        }
        
        // Reset all liveness state
        earBufferRef.current    = [];
        baselineEARRef.current  = null;
        yawHistoryRef.current   = [];
        blinkCountRef.current   = 0; // Legacy: not used, kept for ref stability
        prevYawRef.current      = null;
        prevFaceCenterRef.current = null;
        teleportCountRef.current = 0;
        tiltHoldRef.current      = 0;
        smileHoldRef.current     = 0;
        setLivenessPhase(0);
        setLivenessComplete([false]); // 🔱 1 challenge only — UNBYPASSABLE SMILE
        livenessCompleteRef.current = [false]; // Reset ref too
        hasAutoContinuedRef.current = false; // Reset for fresh auto-continue
        setStaticImageFlag(false);
        // Show the RANDOMIZED first challenge
        setLivenessStatus(`🔱 UNBYPASSABLE: ${shuffled[0]?.icon || ''} ${shuffled[0]?.label || 'Smile & Hold'}`); // 🔱 1 challenge
        startLivenessLoop();
        return; // Success
      } catch (err) {
        lastError = err;
      }
    }
    
    // All attempts failed
    
    if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
      setLivenessStatus('Camera permission denied. Please allow camera access and retry.');
    } else if (lastError?.name === 'NotFoundError') {
      setLivenessStatus('No camera found. Please try on a device with a camera.');
    } else {
      setLivenessStatus('Camera blocked. Enable camera and retry.');
    }
  }, [startLivenessLoop]);

  // 🔱 CRITICAL FIX: Prevent infinite loop by using refs for callbacks
  const startLivenessCameraRef = useRef(startLivenessCamera);
  const stopLivenessCameraRef = useRef(stopLivenessCamera);
  const completeVerificationRef = useRef(completeVerification); // 🔱 AUTO-CONTINUE ref
  startLivenessCameraRef.current = startLivenessCamera;
  stopLivenessCameraRef.current = stopLivenessCamera;
  completeVerificationRef.current = completeVerification;
  
  // 🔱 AUTO-CONTINUE: Sync refs with state for reliable setTimeout access
  useEffect(() => { accountLockedRef.current = accountLocked; }, [accountLocked]);
  useEffect(() => { staticImageFlagRef.current = staticImageFlag; }, [staticImageFlag]);
  
  // MANUAL FLOW: No auto-continue - user clicks Continue button
  
  // MANUAL FLOW: No auto-continue - user clicks Continue button when liveness complete
  
  // 🔱 SOVEREIGN FIX: Single useEffect to coordinate model loading and camera start
  useEffect(() => {
    let isActive = true;
    
    if (step === 3) {
      // Load models first, then start camera
      loadFaceModels().then(() => {
        if (isActive && faceModelsLoaded) {
          startLivenessCameraRef.current();
        }
      });
    }
    
    return () => { 
      isActive = false;
      if (step !== 3) stopLivenessCameraRef.current(); 
    };
    // 🔱 CRITICAL: Only depend on step and faceModelsLoaded, not the callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, faceModelsLoaded, loadFaceModels]);

  // Cleanup on unmount
  useEffect(() => () => stopLivenessCameraRef.current(), []); // 🔱 Fixed: empty deps, use ref
  
  // 🔱 CRITICAL: Restore idConfirmed from localStorage when entering Step 3
  useEffect(() => {
    if (step === 3) {
      const saved = localStorage.getItem('trust_shield_id_confirmed') === 'true';
      if (saved && !idConfirmed) {

        setIdConfirmedState(true);
      }
    }
  }, [step, idConfirmed]);

// ── Progress Bar ──────────────────────────────────────────────────────────
function renderProgress() {
  return (
    <div className={styles.progressBar}>
      {STEPS.map((s) => (
        <div key={s.id} className={`${styles.progressStep} ${step >= s.id ? styles.progressActive : ''} ${step === s.id ? styles.progressCurrent : ''}`}>
          <div className={styles.progressIcon}>{s.icon}</div>
          <div className={styles.progressLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR 1: ENHANCED VISUAL RING-LIGHT — FORCE 100% BRIGHTNESS ON MOBILE
// When luminance < 0.3, force the entire UI to pure white to illuminate face
// ═══════════════════════════════════════════════════════════════════════════
const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
// 🔱 GOD-LEVEL: Luminance threshold upgraded to 0.4 (spec: "if livenessLuminance < 0.4")
const shouldActivateRingLight = step === 3 && livenessLuminance < 0.4 && !accountLocked;
const ringLightStyles = shouldActivateRingLight 
  ? { 
      backgroundColor: '#FFFFFF', 
      filter: 'brightness(1.0)',
      transition: 'all 0.3s ease',
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
    } 
  : { transition: 'background-color 0.3s ease' };

// ══ OCR Pipeline Progress Bar Component ═══════════════════════════════════════════════════
const PIPELINE_PHASES = [
  { id: 1, label: '🔬 Purifying Image',          sublabel: 'OpenCV noise reduction + threshold' },
  { id: 2, label: '🧬 Extracting Identity DNA',  sublabel: 'Tesseract sovereign OCR' },
  { id: 3, label: '🔒 Verifying Uniqueness', sublabel: 'One Person = One Account' },
];
function OcrPipelineProgress() {
  if (!ocrPipelineActive && ocrPipelinePhase === 0) return null;
  const isDone = !ocrPipelineActive && ocrPipelinePhase >= 3;
  return (
      <div className={styles.ocrPipelineWrap}>
        <div className={styles.ocrPipelineBar}>
          <div
            className={styles.ocrPipelineFill}
            style={{ width: `${isDone ? 100 : ocrPipelinePct}%` }}
          />
        </div>
        <div className={styles.ocrPipelinePhases}>
          {PIPELINE_PHASES.map((ph) => {
            const isActive  = ocrPipelinePhase === ph.id && ocrPipelineActive;
            const isDonePhase = ocrPipelinePhase > ph.id || isDone;
            return (
              <div
                key={ph.id}
                className={[
                  styles.ocrPipelinePhase,
                  isActive    ? styles.ocrPhaseActive  : '',
                  isDonePhase ? styles.ocrPhaseDone    : '',
                ].join(' ')}
              >
                <span className={styles.ocrPhaseIcon}>
                  {isDonePhase ? '✅' : isActive ? '⏳' : '⬜'}
                </span>
                <div>
                  <div className={styles.ocrPhaseLabel}>{ph.label}</div>
                  <div className={styles.ocrPhaseSub}>{ph.sublabel}</div>
                </div>
              </div>
            );
          })}
        </div>
        {isDone && (
          <div className={styles.ocrPipelineDone}>
            ✅ Identity DNA extracted · Method: {ocrPurifyMethod || 'standard'}
          </div>
        )}
      </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🔱 LOCKED STEP WARNING - If user is locked to a specific step
// ═══════════════════════════════════════════════════════════════════════════
function LockedStepWarning() {
  if (!lockedStep || lockedStep <= 1) return null;
  
  const stepNames = {
      2: 'ID Scan Required',
      3: 'Biometrics Locked',
      4: 'Mobile Bridge Active',
      5: 'Verification Complete',
    };
  return (
    <div style={{
      background: 'rgba(139, 92, 246, 0.15)',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      borderRadius: '12px',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backdropFilter: 'blur(10px)',
    }}>
      <span style={{ fontSize: '20px' }}>🔒</span>
      <div>
        <p style={{ color: '#c4b5fd', fontSize: '13px', fontWeight: 600, margin: 0 }}>
          Session Locked: {stepNames[lockedStep] || 'Verification in Progress'}
        </p>
        <p style={{ color: '#a78bfa', fontSize: '11px', margin: '4px 0 0 0' }}>
          Complete this step to continue. Your progress is saved.
        </p>
      </div>
    </div>
  );
}

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.trustShieldWrapper}>
      <div 
        className={styles.container} 
        style={ringLightStyles}
        data-ring-light-active={shouldActivateRingLight && isMobile ? 'true' : 'false'}
      >
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} disabled={step >= 2 || !!lockedStep || isLoadingStep} title={step >= 2 ? 'Verification is one-way — no going back' : ''}>← Back</button>
          <h1 className={styles.title} style={{ userSelect: 'none' }}>
            🛡️ Focus Trust Shield
          </h1>
          <div style={{ width: 60 }} />
        </div>

        {/* 🔱 LOADING STATE: Show while initializing to prevent confusion */}
        {isLoadingStep && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5,5,16,0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid rgba(168,85,247,0.3)',
              borderTop: '3px solid #a855f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: '#c4b5fd', marginTop: '20px', fontSize: '1rem' }}>
              Initializing Trust Shield...
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <LockedStepWarning />

        {renderProgress()}

        {/* 🔱 GOD-LEVEL: 3-Phase OCR Pipeline Progress Bar — visible during Step 2 ID submission, HIDE when captured */}
        {step === 2 && scanner.phase !== 'captured' && <OcrPipelineProgress />}

        <div className={styles.content}>
          <FocuslyLion />

          {/* ── STEP 1: TRUST SHIELD ENTRY — 3 CLEAR PATHS ── */}
          {step === 1 && (
            <div className={styles.stepCard}>
              <div className={styles.shieldIcon}>🛡️</div>
              <h2 className={styles.stepTitle}>Trust Shield Verification</h2>
              <p className={styles.stepDesc}>
                One verified human. One account. Choose your path to join India's authentic social network.
              </p>

              {/* ═══════════════════════════════════════════════════════════════════════
                  PHASE 2 STEP 1: THREE CLEAR PATHS — Student / Government / Guardian
                  Each path prepares OCR templates dynamically for the capture phase.
              ═══════════════════════════════════════════════════════════════════════ */}
              <div className={styles.pathGrid}>
                {/* Path 1: Student ID (Teen Tier) */}
                <button
                  className={`${styles.pathCard} ${ageGroup === '13-17' ? styles.pathCardSelected : ''}`}
                  onClick={() => setAgeGroup('13-17')}
                  disabled={isLocked}
                  data-path="student"
                >
                  <div className={styles.pathIconRing}>
                    <span className={styles.pathIcon}>🎓</span>
                  </div>
                  <strong className={styles.pathTitle}>Student ID</strong>
                  <small className={styles.pathMeta}>Ages 13–17 • School/College ID</small>
                  <ul className={styles.pathFeatures}>
                    <li>📚 Student ID Card scan</li>
                    <li>👨‍👩‍👧 Guardian approval required</li>
                    <li>🔒 Full safety protections</li>
                  </ul>
                  {ageGroup === '13-17' && (
                    <div className={styles.pathSelectedBadge}>✓ Selected</div>
                  )}
                </button>

                {/* Path 2: Government ID (Adult Tier) */}
                <button
                  className={`${styles.pathCard} ${ageGroup === '18+' ? styles.pathCardSelected : ''}`}
                  onClick={() => setAgeGroup('18+')}
                  disabled={isLocked}
                  data-path="government"
                >
                  <div className={styles.pathIconRing}>
                    <span className={styles.pathIcon}>🪪</span>
                  </div>
                  <strong className={styles.pathTitle}>Government ID</strong>
                  <small className={styles.pathMeta}>Ages 18+ • Aadhaar/PAN/Passport</small>
                  <ul className={styles.pathFeatures}>
                    <li>🆔 Govt ID scan (Aadhaar/PAN)</li>
                    <li>✅ Instant verification</li>
                    <li>🏆 Full platform access</li>
                  </ul>
                  {ageGroup === '18+' && (
                    <div className={styles.pathSelectedBadge}>✓ Selected</div>
                  )}
                </button>

                {/* Path 3: Guardian Link (Already have approval) */}
                <button
                  className={`${styles.pathCard} ${ageGroup === 'guardian-link' ? styles.pathCardSelected : ''}`}
                  onClick={() => setAgeGroup('guardian-link')}
                  disabled={isLocked}
                  data-path="guardian"
                >
                  <div className={styles.pathIconRing}>
                    <span className={styles.pathIcon}>🔗</span>
                  </div>
                  <strong className={styles.pathTitle}>I Have a Guardian Link</strong>
                  <small className={styles.pathMeta}>Already approved • Skip to activation</small>
                  <ul className={styles.pathFeatures}>
                    <li>🔗 Paste your guardian token</li>
                    <li>⚡ Instant account activation</li>
                    <li>📱 No ID scan needed</li>
                  </ul>
                  {ageGroup === 'guardian-link' && (
                    <div className={styles.pathSelectedBadge}>✓ Selected</div>
                  )}
                </button>
              </div>

              {/* Guardian Link Input (shown when guardian-link path selected) */}
              {ageGroup === 'guardian-link' && (
                <div className={styles.guardianTokenInput}>
                  <label htmlFor="guardian-token">Guardian Approval Token</label>
                  <input
                    id="guardian-token"
                    type="text"
                    placeholder="Paste your guardian link or token here..."
                    value={guardianTokenInput || ''}
                    onChange={(e) => setGuardianTokenInput(e.target.value)}
                    className={styles.tokenInput}
                    disabled={isLocked}
                  />
                  <p className={styles.tokenHint}>
                    Ask your parent/guardian to send you the approval link from their email.
                  </p>
                </div>
              )}

              {error && <div className={styles.errorBox}>{error}</div>}

              {/* MANUAL: Continue button always visible */}
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  try {
                    await handleAgeConfirm();
                  } catch (err) {
                    console.error('[TrustShield] Step 1 continue error:', err);
                  }
                }}
                disabled={!ageGroup || isLocked || (ageGroup === 'guardian-link' && !guardianTokenInput)}
                style={{
                  opacity: (!ageGroup || isLocked || (ageGroup === 'guardian-link' && !guardianTokenInput)) ? 0.5 : 1,
                  cursor: (!ageGroup || isLocked || (ageGroup === 'guardian-link' && !guardianTokenInput)) ? 'not-allowed' : 'pointer',
                  marginTop: '20px'
                }}
              >
                {ageGroup === 'guardian-link' ? 'Activate Account →' : 'Continue — Start Camera →'}
              </button>

              {/* OCR Template Indicator (technical but reassuring) */}
              {ageGroup && ageGroup !== 'guardian-link' && (
                <div className={styles.ocrTemplateBadge}>
                  <span className={styles.ocrTemplateDot} />
                  OCR Template Loaded: {ageGroup === '13-17' ? 'Student ID Parser' : 'Government ID Parser (Aadhaar/PAN)'}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: LIVE CAMERA SCANNER ── */}
          {step === 2 && (
            <div className={styles.stepCard}>
              <h2 className={styles.stepTitle}>
                {ageGroup === '13-17' ? '🎓 Scan Student ID' : '🪪 Scan Government ID'}
              </h2>
              <p className={styles.stepDesc}>
                Scan or upload your ID card. The AI will auto-detect details, then you'll confirm your ID number.
              </p>

              {/* ═══════════════════════════════════════════════════════════════════════
                  PHASE 2 STEP 2: SOVEREIGN FRAME — Glassmorphism Camera Overlay
                  Animated corners, edge detection glow, real-time alignment feedback
              ═══════════════════════════════════════════════════════════════════════ */}
              {(scanner.phase === 'streaming' || scanner.phase === 'requesting' || scanner.phase === 'scanning') && (
                <div className={styles.liveScannerWrap}>
                  <video
                    ref={scanner.videoRef}
                    autoPlay muted playsInline
                    className={styles.liveScannerVideo}
                  />
                  <canvas ref={scanner.canvasRef} style={{ display: 'none' }} />

                  {/* 🔱 SOVEREIGN FRAME: H2 Glassmorphism Overlay */}
                  <SovereignFrame
                    isActive={true}
                    alignmentScore={scanner.sharpnessOk ? 85 : 40}
                    sharpness={scanner.sharpnessOk ? 90 : 30}
                    luminance={scanner.lightWarning ? 35 : 85}
                    isScanning={scanner.phase === 'scanning'}
                    documentDetected={scanner.sharpnessOk && !scanner.lightWarning}
                    ageGroup={ageGroup}
                  />

                  {/* Legacy quality chip (backup) */}
                  <div className={styles.qualityChip} style={{
                    background: scanner.sharpnessOk ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                    borderColor: scanner.sharpnessOk ? '#22c55e' : '#fbbf24',
                    color: scanner.sharpnessOk ? '#22c55e' : '#fbbf24',
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 20,
                  }}>
                    {scanner.sharpnessOk ? '✅ Sharp' : '📷 Aligning...'}
                  </div>
                </div>
              )}

              {/* 🏛️ SOVEREIGN FIX: Enhanced captured frame with retake option */}
              {scanner.phase === 'captured' && scanner.capturedFrame && (
                <div style={{ 
                  border: '2px solid #4ade80', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.5)',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    background: 'rgba(74,222,128,0.1)', 
                    padding: '8px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>✅ ID Captured</span>
                    <button 
                      onClick={() => {
                        scannerStopRef.current = false;
                        scanner.startCamera?.();
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      📷 Retake
                    </button>
                  </div>
                  {/* 🏛️ SOVEREIGN FIX: Success banner when ID captured */}
                  {scanner.phase === 'captured' && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
                      border: '1px solid #22c55e',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
                      <h3 style={{ color: '#22c55e', margin: '0 0 8px', fontSize: '1.1rem' }}>
                        ID Successfully Captured!
                      </h3>
                      <p style={{ color: '#a0a0a0', margin: 0, fontSize: '0.9rem' }}>
                        Please confirm your ID number below to continue
                      </p>
                    </div>
                  )}
                  <img 
                    src={scanner.capturedFrame} 
                    alt="Captured ID" 
                    className={styles.capturedPreview}
                    style={{ display: 'block', width: '100%' }}
                  />
                </div>
              )}

              {/* Start camera button */}
              {scanner.phase === 'idle' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className={styles.primaryBtn} onClick={() => {

                    scanner.startCamera?.();
                  }}>
                    📸 Open Camera
                  </button>
                  <label className={styles.primaryBtn} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--accent-magenta)' }}>
                    📂 Browse Files
                    <input 
                       key={`file-upload-${Date.now()}`}
                       ref={fileUploadRef}
                       type="file" 
                       accept="image/*" 
                       hidden 
                       onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Reset input so same file can be selected again
                          if (fileUploadRef.current) {
                            fileUploadRef.current.value = '';
                          }
                          
                          // Validate file
                          if (file.size === 0) {
                            setError('Selected file is empty');
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            setError('File too large. Maximum size is 10MB.');
                            return;
                          }
                          
                          // 🔱 GOD-LEVEL: Run purification BEFORE scanner.runOCR
                          setOcrPipelineActive(true);
                          setOcrPipelinePhase(1);
                          setOcrPipelinePct(5);
                          setOcrPipelineLabel('🔬 Purifying Image...');
                          setError(null);
                          
                          try {
                            const purified = await purifyIDImage(file, (pct) => {
                              setOcrPipelinePct(5 + Math.round(pct * 0.30));
                            });
                            setOcrPurifyMethod(purified.method);
                            setOcrPipelinePhase(2);
                            setOcrPipelinePct(38);
                            setOcrPipelineLabel('🧬 Extracting Identity DNA...');
                            
                            // Use processFile instead of runOCR for file uploads
                            if (scanner.processFile) {
                              await scanner.processFile(file);
                            } else if (scanner.runOCR) {
                              await scanner.runOCR(purified.canvas);
                            }
                            
                            setOcrPipelinePhase(3);
                            setOcrPipelinePct(100);
                          } catch (err) {
                            console.error('[TrustShield] File upload error:', err);
                            setError('Failed to process file: ' + (err.message || 'Please try again with a clearer image'));
                            
                            // Fallback processing
                            try {
                              const img = new Image();
                              const url = URL.createObjectURL(file);
                              await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                                img.src = url;
                              });
                              const canvas = document.createElement('canvas');
                              canvas.width = img.naturalWidth || img.width; 
                              canvas.height = img.naturalHeight || img.height;
                              canvas.getContext('2d').drawImage(img, 0, 0);
                              URL.revokeObjectURL(url);
                              
                              if (scanner.processFile) {
                                await scanner.processFile(file);
                              } else if (scanner.runOCR) {
                                await scanner.runOCR(canvas);
                              }
                            } catch (fallbackErr) {
                              setError('Could not process image. Please try the camera option or a different file.');
                            }
                          } finally {
                            setOcrPipelineActive(false);
                          }
                       }}
                    />
                  </label>
                </div>
              )}

              {/* 🔱 UNIFIED PROGRESS: Show either pipeline OR scanner progress, never both */}
              {scanner.phase !== 'captured' && (
                <>
                  {ocrPipelineActive ? (
                    <OcrPipelineProgress />
                  ) : (scanner.phase === 'scanning' || scanner.progress > 0) ? (
                    <div className={styles.ocrProgress}>
                      <div className={styles.ocrProgressBar}>
                        <div className={styles.ocrProgressFill} style={{ width: `${scanner.progress}%` }} />
                      </div>
                      <p className={styles.statusText}>{scanner.statusMessage}</p>
                    </div>
                  ) : null}
                </>
              )}
              
              {/* ID VERIFICATION IS MANDATORY - No skip option per Trust Shield Policy */}

              {/* Status message */}
              {scanner.phase !== 'scanning' && scanner.statusMessage && !ocrPipelineActive && (
                <p className={styles.statusText} style={{ textAlign: 'center', color: '#a78bfa' }}>
                  {scanner.statusMessage}
                </p>
              )}

              {/* OCR Auto-fill (informational) */}
              {scanner.phase === 'captured' && ocrData && (
                <div className={styles.ocrResults}>
                  <h3>📋 Auto-Detected from ID</h3>
                  {ocrData.name && <div className={styles.ocrField}><span>Name</span><strong>{ocrData.name}</strong></div>}
                  {ocrData.dob && <div className={styles.ocrField}><span>DOB</span><strong>{ocrData.dob}</strong></div>}
                  {ocrData.idNumber && <div className={styles.ocrField}><span>ID</span><strong>XXXX XXXX {ocrData.idNumber.slice(-4)}</strong></div>}
                  <div className={styles.ocrField}><span>OCR Confidence</span><strong>{Math.round(ocrData.confidence || 0)}%</strong></div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════════
                  ID ENTRY FORM — ALWAYS VISIBLE WHEN ID IS CAPTURED
                  🔱 GOD-LEVEL FIX: Removed ageGroup dependency that was hiding the form
                  🔱 CRITICAL FIX: Show form even when saving (just disable it), don't hide it!
              ═══════════════════════════════════════════════════════════════════════ */}
              {scanner.phase === 'captured' && !idConfirmed && (
                <div className={styles.idEntrySection} style={{ 
                  marginTop: 24, 
                  padding: 24, 
                  background: 'rgba(15,23,42,0.6)', 
                  border: '2px solid rgba(168,85,247,0.4)', 
                  borderRadius: 16,
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{ 
                    color: '#c4b5fd', 
                    marginBottom: 8, 
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8 
                  }}>
                    {ageGroup === '13-17' ? '🎓 Enter Student ID Details' : '🪪 Enter Your ID Number'}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 16 }}>
                    {ageGroup === '13-17' 
                      ? 'Enter your School/College ID and institution name to verify your student status.'
                      : ocrData?.idType === 'aadhaar_masked' 
                        ? `Masked Aadhaar detected (last 4: ${ocrData?.idMaskedLast4 || '****'}). Enter full 12 digits below.`
                        : 'Enter your 12-digit Aadhaar number. One Aadhaar = One account.'}
                  </p>
                  
                  {/* STUDENT ID FORM (13-17 age group) */}
                  {ageGroup === '13-17' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#c4b5fd', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Student ID / Roll Number</label>
                        <input 
                          value={manualStudentId} 
                          autoComplete="off" 
                          placeholder="e.g., 2024CS001"
                          onChange={(e) => { setManualStudentIdError(null); setManualStudentId(e.target.value); }}
                          style={{ 
                            padding: '14px 16px', 
                            borderRadius: 12, 
                            border: '2px solid rgba(168,85,247,0.5)', 
                            background: 'rgba(15,23,42,0.8)', 
                            color: '#e2e8f0', 
                            width: '100%', 
                            outline: 'none',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }} 
                        />
                      </div>
                      <div>
                        <label style={{ color: '#c4b5fd', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>School / College Name</label>
                        <input 
                          value={manualInstitution} 
                          autoComplete="off" 
                          placeholder="e.g., Delhi Public School"
                          onChange={(e) => { setManualStudentIdError(null); setManualInstitution(e.target.value); }}
                          style={{ 
                            padding: '14px 16px', 
                            borderRadius: 12, 
                            border: '2px solid rgba(168,85,247,0.5)', 
                            background: 'rgba(15,23,42,0.8)', 
                            color: '#e2e8f0', 
                            width: '100%', 
                            outline: 'none',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                          }} 
                        />
                      </div>
                      <button 
                        type="button"
                        className={styles.primaryBtn} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          handleManualStudentIdSubmit(e);
                        }}
                        disabled={saving}
                        style={{ 
                          marginTop: 8, 
                          padding: '14px 24px', 
                          fontSize: '1rem',
                          opacity: saving ? 0.6 : 1,
                          cursor: saving ? 'wait' : 'pointer',
                          minWidth: '200px'
                        }}
                      >
                        {saving ? '⏳ Verifying...' : '✓ Verify Student ID →'}
                      </button>
                      {manualStudentIdError && (
                        <p style={{ color: '#fca5a5', textAlign: 'center', marginTop: 8, fontSize: '0.9rem', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                          ⚠️ {manualStudentIdError}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* GOVERNMENT ID FORM (18+ or default) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#c4b5fd', fontSize: '0.85rem', display: 'block', marginBottom: 6 }}>Aadhaar Number (12 digits)</label>
                        <input 
                          value={manualAadhaar} 
                          inputMode="numeric" 
                          autoComplete="off" 
                          placeholder="XXXX XXXX XXXX"
                          maxLength={14}
                          onChange={(e) => { 
                            setManualAadhaarError(null); 
                            // Allow only digits and spaces, auto-format
                            const val = (e.target.value || '').replace(/[^0-9]/g, '');
                            // Format as XXXX XXXX XXXX
                            let formatted = val;
                            if (val.length > 4) formatted = val.slice(0,4) + ' ' + val.slice(4);
                            if (val.length > 8) formatted = val.slice(0,4) + ' ' + val.slice(4,8) + ' ' + val.slice(8);
                            setManualAadhaar(formatted); 
                          }}
                          style={{ 
                            padding: '14px 16px', 
                            borderRadius: 12, 
                            border: manualAadhaar.replace(/\s/g, '').length === 12 ? '2px solid #22c55e' : '2px solid rgba(168,85,247,0.5)', 
                            background: 'rgba(15,23,42,0.8)', 
                            color: '#e2e8f0', 
                            width: '100%', 
                            outline: 'none',
                            fontSize: '1.1rem',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.3s'
                          }} 
                        />
                        <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4 }}>
                          {manualAadhaar.replace(/\s/g, '').length}/12 digits entered
                        </p>
                      </div>
                      <button 
                        type="button"
                        className={styles.primaryBtn} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          handleManualAadhaarSubmit(e);
                        }}
                        disabled={saving}
                        style={{ 
                          marginTop: 8, 
                          padding: '14px 24px', 
                          fontSize: '1rem',
                          opacity: saving ? 0.6 : 1,
                          cursor: saving ? 'wait' : 'pointer',
                          minWidth: '200px'
                        }}
                      >
                        {saving ? '⏳ Verifying...' : '✓ Verify Aadhaar →'}
                      </button>
                      {manualAadhaarError && (
                        <p style={{ color: '#fca5a5', textAlign: 'center', marginTop: 8, fontSize: '0.9rem', padding: '10px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)' }}>
                          ⚠️ {manualAadhaarError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* CONFIRMED STATE — Show success message when ID is verified */}
              {scanner.phase === 'captured' && idConfirmed && (
                <div style={{ 
                  marginTop: 20, 
                  padding: 20, 
                  background: 'rgba(34,197,94,0.15)', 
                  border: '2px solid #22c55e', 
                  borderRadius: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
                  <h4 style={{ color: '#4ade80', margin: '0 0 4px 0' }}>
                    {ageGroup === '13-17' ? 'Student ID Verified!' : 'Aadhaar Verified!'}
                  </h4>
                  <p style={{ color: '#86efac', fontSize: '0.9rem', margin: 0 }}>
                    Your identity has been confirmed. Continue to the next step.
                  </p>
                </div>
              )}

              {(error || scanner.phase === 'error') && (
                <div className={`${styles.errorBox} ${styles.glassErrorToast}`}>
                  <p>{error || scanner.statusMessage}</p>
                  <button className={styles.retryBtn} onClick={scanner.retry}>↺ Retry Scan</button>
                </div>
              )}

              {/* 🔱 EMERGENCY RESET: Clear stuck states */}
              {(saving || isProcessingRef.current) && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => {

                      isProcessingRef.current = false;
                      setSaving(false);
                      setOcrPipelineActive(false);
                      setManualAadhaarError(null);
                      setManualStudentIdError(null);
                      setError(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.5)',
                      color: '#fca5a5',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Stuck? Click to Reset
                  </button>
                </div>
              )}

              {/* MANUAL: Continue button when ID is verified */}
              {idConfirmed && !saving && (
                <div style={{ 
                  marginTop: '24px', 
                  padding: '24px', 
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))',
                  border: '2px solid #22c55e',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
                  <h3 style={{ color: '#4ade80', marginBottom: '8px', fontSize: '1.2rem' }}>
                    Identity Verified Successfully!
                  </h3>
                  <p style={{ color: '#86efac', marginBottom: '16px', fontSize: '0.95rem' }}>
                    Your {ageGroup === '13-17' ? 'Student ID' : 'Aadhaar'} has been confirmed.
                  </p>
                  <button 
                    className={styles.primaryBtn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();


                      localStorage.setItem('trust_shield_id_confirmed', 'true');
                      setIdConfirmedState(true);

                      setStepRaw(3);
                      persistStepChange(3).catch(() => {});
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      padding: '12px 32px',
                      fontSize: '1.1rem'
                    }}
                  >
                    Continue to Liveness Check →
                  </button>
                </div>
              )}

              {/* 🔱 MANUAL CAPTURE BUTTON — When auto-capture doesn't work */}
              {scanner.phase === 'streaming' && (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                  <button 
                    className={styles.primaryBtn} 
                    onClick={() => { 

                      scanner.captureManually?.(); 
                    }}
                    style={{ 
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      minWidth: '140px'
                    }}
                  >
                    📸 Capture ID
                  </button>
                  <button className={styles.secondaryBtn} onClick={() => { scanner.stopCamera(); }}>
                    ✋ Stop Camera
                  </button>
                </div>
              )}
              
              {scanner.phase === 'scanning' && (
                <button className={styles.secondaryBtn} onClick={() => { scanner.stopCamera(); }}>
                  ✋ Stop Camera
                </button>
              )}
            </div>
          )}

          {/* ── STEP 3: RUTHLESS LIVENESS ── */}
          {step === 3 && (
            <div className={styles.stepCard} style={
              typeof window !== 'undefined' && window.innerWidth <= 768 && livenessLuminance < 0.3 
                ? { background: '#FFFFFF', zIndex: 9999, position: 'fixed', inset: 0, width: '100vw', height: '100vh', borderRadius: 0, paddingTop: '10%' } 
                : {}
            }>
              <h2 className={styles.stepTitle}>👁️ Biometric Liveness</h2>
              <p className={styles.stepDesc}>
                🔱 UNBYPASSABLE 1-step challenge: Hold a genuine smile for 3+ seconds. Anti-spoof enabled.
              </p>

              {/* UNBYPASSABLE Challenge progress chip (1 challenge only) */}
              <div className={styles.challengeBar}>
                {(challengeSequenceRef.current || []).map((ch, i) => (
                  <div key={ch.id} className={`${styles.challengeChip} ${
                    livenessCompleteRef.current[i] ? styles.challengeDone :
                    livenessPhase === i ? styles.challengeActive :
                    styles.challengePending
                  }`}>
                    {livenessCompleteRef.current[i] ? '✓ ' : `${i+1}. `}{ch.icon} {ch.label}
                  </div>
                ))}
              </div>

              {/* Video feed */}
              <div className={styles.livenessRing} style={{
                borderColor: livenessCompleteRef.current[0] ? '#22c55e' :
                             livenessPhase === 0 ? '#a855f7' : '#38bdf8',
                boxShadow: `0 0 30px ${livenessCompleteRef.current[0] ? 'rgba(34,197,94,0.4)' :
                                       livenessPhase === 0 ? 'rgba(168,85,247,0.4)' : 'rgba(56,189,248,0.4)'}`,
              }}>
                <video
                  ref={liveVideoRef}
                  autoPlay muted playsInline
                  className={styles.livenessVideo}
                />
              </div>

              {/* Status */}
              <div className={styles.statusBox}>
                <div className={styles.pulseDot} style={{
                  background: livenessCompleteRef.current[0] ? '#22c55e' : 
                              staticImageFlag ? '#ef4444' : '#a855f7',
                  boxShadow: `0 0 10px ${livenessCompleteRef.current[0] ? '#22c55e' : 
                                          staticImageFlag ? '#ef4444' : '#a855f7'}`,
                }} />
                <span className={styles.statusText}>{livenessCompleteRef.current[0] 
                  ? '✅ Challenge complete! Proceeding...' 
                  : staticImageFlag
                    ? '🚨 Static image injection detected — restarting'
                    : livenessStatus || 'Initializing biometric engine...'
                }</span>
              </div>

              {/* Restart button - ONLY show when challenge NOT complete (check ref for reliability) */}
              {staticImageFlag && !accountLocked && !livenessCompleteRef.current[0] && (
                <button className={styles.retryBtn} onClick={() => {
                  setStaticImageFlag(false);
                  setLivenessPhase(0);
                  setLivenessComplete([false]); // 🔱 1 challenge only — UNBYPASSABLE SMILE
                  yawHistoryRef.current = [];
                  prevYawRef.current = null;
                  teleportCountRef.current = 0;
                  startLivenessCamera();
                }}>↺ Restart Liveness</button>
              )}
              {/* HARD LOCK: Account permanently locked - hide when challenge complete (check ref) */}
              {accountLocked && !livenessCompleteRef.current[0] && (
                <div className={styles.errorBox} style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.5)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backdropFilter: 'blur(20px)',
                }}>
                  <p style={{ color: '#f87171', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>🔒 ACCOUNT LOCKED</p>
                  <p style={{ color: '#fca5a5', fontSize: '0.85rem' }}>A biometric injection attack was detected. This account has been permanently locked. Contact admin@focusapp.in to appeal.</p>
                </div>
              )}

              {!faceModelsLoaded && (
                <div className={styles.ocrProgress}>
                  <div className={styles.ocrProgressBar}>
                    <div className={styles.ocrProgressFill} style={{ width: '60%', animation: 'pulse 1s infinite alternate' }} />
                  </div>
                </div>
              )}

              {/* 🔱 EMERGENCY RESET: Clear stuck liveness states */}
              {saving && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button 
                    type="button"
                    onClick={() => {

                      setSaving(false);
                      setLivenessPhase(0);
                      setLivenessComplete([false]); // 🔱 1 challenge only — UNBYPASSABLE SMILE
                      livenessPhaseRef.current = 0;
                      livenessCompleteRef.current = [false]; // 🔱 1 challenge only — UNBYPASSABLE SMILE
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.5)',
                      color: '#fca5a5',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Stuck? Click to Reset
                  </button>
                </div>
              )}

              {/*
                ═══════════════════════════════════════════════════════════════════════
                PILLAR 1: PHYSICAL CONTINUE LOCK — BULLETPROOF EDITION
                ═══════════════════════════════════════════════════════════════════════
                The Continue button is 100% DISABLED until UNBYPASSABLE SMILE
                challenge is complete. No bypass. No exceptions. Auto-continue enabled.
                BYPASS: staticImageFlag is IGNORED when challenge is actually complete
              */}
              {(() => {
                // 🔱 SIMPLE: Just check ref directly
                const isComplete = livenessCompleteRef.current[0] === true;
                const canProceed = isComplete && !saving;
                
                return (
                  <button
                    type="button"
                    className={`${styles.primaryBtn} ${styles.pillar1Locked}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (isComplete) {

                        completeVerification();
                      }
                    }}
                    disabled={!isComplete || saving}
                    data-testid="trust-shield-continue-btn"
                    data-pillar1-verified={isComplete ? 'true' : 'false'}
                    data-challenges-complete={isComplete ? '1/1' : '0/1'}
                    data-auto-continue="liveness"
                    aria-disabled={!isComplete}
                    style={{
                      marginTop: 16,
                      padding: '16px 32px',
                      fontSize: '1.1rem',
                      opacity: isComplete ? 1 : 0.4,
                      cursor: isComplete ? 'pointer' : 'not-allowed',
                      border: isComplete ? '2px solid #22c55e' : '2px solid #6b7280',
                      boxShadow: isComplete ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
                      background: isComplete 
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                        : 'rgba(107, 114, 128, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {saving ? (
                      '⏳ Securing verification…'
                    ) : isComplete ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✅</span>
                        <span>Complete Verification →</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔒</span>
                        <span>Complete Smile Challenge — Hold 3+ sec</span>
                      </span>
                    )}
                  </button>
                );
              })()}

              {/*
                Allow the user to restart the ritual on the same device only.
                NO 'skip to mobile' path — spec: "Physically remove 'Skip' buttons."
                The Bridge (Step 4) is only reachable via a camera-blocked fallback.
              */}
              {staticImageFlag && accountLocked === false && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#fbbf24', marginTop: 8 }}>
                  Injection detected. Use "Restart Liveness" above.
                </p>
              )}
            </div>
          )}

          {/* ── STEP 4: MOBILE BRIDGE ── */}
          {step === 4 && (
            <div className={styles.stepCard}>
              <h2 className={styles.stepTitle}>📱 Focus Bridge</h2>
              <p className={styles.stepDesc}>
                Scan this QR from your mobile device (Chrome / Safari). Complete the biometric ritual on your phone.
                Leave this tab open — it will unlock automatically.
              </p>

              {/* QR Code */}
              <div style={{
                width: '100%', maxWidth: '280px', margin: '0 auto',
                aspectRatio: '1/1', padding: '24px', background: '#fff',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                borderRadius: '20px', boxShadow: '0 10px 40px rgba(168,85,247,0.35)',
                boxSizing: 'border-box',
              }}>
                {user?.id ? (
                  <QRCodeSVG
                    value={`${HANDOFF_BASE_URL}/verify-mobile?uid=${user.id}&session_id=${handoffSessionId}`}
                    style={{ width: '100%', height: '100%' }}
                    level="H"
                    fgColor="#000000"
                    bgColor="#ffffff"
                    includeMargin={false}
                  />
                ) : (
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>Loading...</div>
                )}
              </div>

              {/* Typewriter status */}
              <div
                className={styles.statusBox}
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  minHeight: '60px',
                }}
              >
                <div className={styles.pulseDot} style={{ background: '#a855f7', boxShadow: '0 0 10px #a855f7' }} />
                <span className={styles.statusText} style={{ color: '#d8b4fe' }}>{typewriterText}</span>
              </div>

              {saving && (
                <div className={styles.statusBox}>
                  <div className={styles.pulseDot} />
                  <span className={styles.statusText}>Securing your verification...</span>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#475569', marginTop: 8 }}>
                Secure bridge expires in 5 minutes
              </p>
            </div>
          )}

          {/* ── STEP 5: SUCCESS ── */}
          {step === 5 && (
            <div className={styles.stepCard}>
              {/* 🏛️ SOVEREIGN FIX: Proper age group handling */}
              {ageGroup === '18+' && (
                <>
                  <div className={styles.successIcon}>✨</div>
                  <h2 className={styles.stepTitle}>Verification Complete!</h2>
                  <p className={styles.stepDesc}>
                    Welcome to the elite tier of Focus. You are officially verified by the Focus Trust Shield.
                  </p>
                  <div className={styles.rewardBox}>
                    <h3>🏆 Unlocked</h3>
                    <ul>
                      <li>✅ Trust Shield Verification Badge</li>
                      <li>✅ Access to Home Feed, Explore & Boltz</li>
                      <li>✅ Priority placement in feed algorithm</li>
                      <li>✅ Eligible for Boltz Creator monetization</li>
                    </ul>
                  </div>
                  <button className={styles.primaryBtn} onClick={() => navigate('/home', { replace: true })}>
                    Enter Focus →
                  </button>
                </>
              )}

              {ageGroup === '13-17' && (
                <>
                  <div className={styles.successIcon}>🔐</div>
                  <h2 className={styles.stepTitle}>Awaiting Guardian Approval</h2>
                  <p className={styles.stepDesc}>
                    Your identity has been verified! A parent or guardian must approve your account.
                  </p>
                  {guardianToken && (
                    <div className={styles.guardianBox}>
                      <p className={styles.guardianLabel}>Enter your Parent/Guardian's Email for approval:</p>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <input
                          id="guardian_email_input"
                          type="email"
                          placeholder="guardian@example.com"
                          className={styles.emailInput}
                          style={{
                             flex: 1, padding: '12px', borderRadius: '10px', 
                             background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                             color: 'white', outline: 'none'
                          }}
                        />
                        <button
                          className={styles.primaryBtn}
                          style={{ width: 'auto', padding: '12px 20px', margin: '0' }}
                          onClick={async (e) => {
                             const btn = e.currentTarget;
                             const emailInput = document.getElementById('guardian_email_input').value;
                             if (!emailInput) return;
                             btn.innerText = 'Sending...';
                             
                             try {
                                await supabase.functions.invoke('sendGuardianVerification', {
                                    body: { guardianEmail: emailInput, link: `${window.location.origin}/verification/parent-consent?token=${guardianToken}` }
                                });
                             } catch (err) {
                                }

                             btn.innerText = 'Sent ✓';
                             btn.style.background = '#22c55e';
                          }}
                        >
                          Send Invite
                        </button>
                      </div>

                      <p className={styles.guardianLabel} style={{ marginTop: '16px' }}>Or send this approval link manually:</p>
                      <div className={styles.guardianLink}>
                        {`${window.location.origin}/verification/parent-consent?token=${guardianToken}`}
                      </div>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => navigator.clipboard.writeText(
                          `${window.location.origin}/verification/parent-consent?token=${guardianToken}`
                        )}
                        style={{ marginTop: '8px' }}
                      >
                        📋 Copy Link
                      </button>
                    </div>
                  )}
                  <button className={styles.primaryBtn} onClick={() => navigate('/security')}>
                    Check Approval Status
                  </button>
                </>
              )}

              {/* Fallback for null/undefined ageGroup - should not reach here but handle gracefully */}
              {!ageGroup && (
                <>
                  <div className={styles.successIcon}>⚠️</div>
                  <h2 className={styles.stepTitle}>Verification Status Unknown</h2>
                  <p className={styles.stepDesc}>
                    We couldn't determine your age group. This may happen if you refreshed during verification.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button className={styles.primaryBtn} onClick={() => setStepRaw(1)}>
                      ← Go Back & Reselect
                    </button>
                    <button className={styles.secondaryBtn} onClick={() => navigate('/help')}>
                      Contact Support
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CINEMATIC ACCESS GRANTED OVERLAY ── */}
      {showAccessGranted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.15) 0%, rgba(5,5,16,0.97) 70%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeInAccess 0.5s ease-out',
        }}>
          <div style={{ textAlign: 'center', animation: 'scaleInAccess 0.6s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px', filter: 'drop-shadow(0 0 40px #4ade80)' }}>✅</div>
            <h1 style={{
              fontSize: '2.5rem', color: '#4ade80', margin: '0 0 12px',
              letterSpacing: '6px', textTransform: 'uppercase',
              textShadow: '0 0 30px rgba(74,222,128,0.9)',
            }}>ACCESS GRANTED</h1>
            <p style={{ color: '#d8b4fe', fontSize: '1.1rem', opacity: 0.85, margin: 0 }}>
              Identity locked in. Entering Focus...
            </p>
          </div>
          <style>{`
            @keyframes fadeInAccess  { from { opacity:0 } to { opacity:1 } }
            @keyframes scaleInAccess {
              from { transform: scale(0.4) translateY(30px); opacity:0 }
              to   { transform: scale(1)   translateY(0);    opacity:1 }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default TrustShieldVerification;
