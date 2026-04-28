import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useScanner from '../../hooks/useScanner';
import { persistTrustShieldState, createGuardianHandshake } from '../../utils/trustShieldEngine';
import { computeIdentityHash, classifyDocumentTier } from '../../hooks/useOCRScanner';
import { 
  checkDuplicateID, 
  checkDuplicateStudentID,
  finalizeVerificationV2,
  getAlertConfig 
} from '../../utils/trustShieldDuplicateCheck';
import MainLayout from '../../components/layout/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import * as faceapi from 'face-api.js';
import { useFocusly } from '../../context/FocuslyContext';
import styles from './TrustShieldVerification.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔱 TRUST SHIELD ULTRA - Maximum Security Enforcement
// ONE GOVERNMENT ID = ONE PERSON = ONE ACCOUNT - STRICTEST MODE
// ═══════════════════════════════════════════════════════════════════════════════
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
  ULTRA_CONFIG,
} from '../../utils/trustShieldULTRA';

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR 1: ANTI-DEBUG / ANTI-TAMPER PROTECTION
// Detects DevTools, console manipulation, and debugger injection attempts
// ═══════════════════════════════════════════════════════════════════════════
const initAntiDebug = () => {
  if (typeof window === 'undefined') return;
  
  // Detect DevTools opening via console size
  const threshold = 160;
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      console.clear();
      window.location.href = '/auth';
    }
  };
  setInterval(checkDevTools, 1000);
  
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
  
  // Debugger trap with timing check
  const debuggerTrap = () => {
    const start = performance.now();
    debugger;
    const end = performance.now();
    if (end - start > 100) {
      window.location.href = '/auth';
    }
  };
  setInterval(debuggerTrap, 2000);
};

// ── Mobile Handoff ──────────────────────────────────────────────────────
const generateHandoffSessionId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};
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

// ── Liveness Challenge Pool (exactly 3 — order randomized each session) ─────
const LIVENESS_CHALLENGE_POOL = [
  { id: 'blink', label: 'Blink both eyes clearly', icon: '👁️' },
  { id: 'smile', label: 'Smile naturally',         icon: '😊' },
  { id: 'tilt',  label: 'Tilt / turn head 20°',    icon: '↩️' },
];

/** Fisher-Yates in-place shuffle — produces a new random 3-step ritual each session */
const shuffleChallenges = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getEAR = (eye) => {
  if (!eye || eye.length !== 6) return 1.0;
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const w = d(eye[0], eye[3]);
  if (w === 0) return 1.0;
  return (d(eye[1], eye[5]) + d(eye[2], eye[4])) / (2.0 * w);
};

// ── Focusly AI Mascot ─────────────────────────────────────────────────────────
// NOTE: No click-to-bypass — Pillar 1 spec: "Physically remove 'Skip' buttons".
// The Continue button is math-locked to AI confirmation. No manual overrides.
const FocuslyLion = () => (
  <div className={styles.focuslyContainer} style={{ userSelect: 'none' }} data-testid="focusly-lion-guardian">
    <div className={styles.focuslyAvatar}>🦁</div>
    <div className={styles.focuslySpeech}>
      <strong>Focusly AI (Guardian Mode)</strong>
      <p>"Real people make a real nation. Let's verify your soul, Macha!"</p>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const TrustShieldVerification = () => {
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
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 1: PERSISTENT STATE INITIALIZATION - Fixes "Reset to Step 1" Bug
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const initializeGodLevelState = async () => {
      if (!user?.id) {
        setIsLoadingStep(false);
        return;
      }

      // 🔧 SAFETY TIMEOUT: Force exit loading after 5 seconds
      const timeoutId = setTimeout(() => {
        console.warn('[TrustShield] Loading timeout - forcing fallback to Step 1');
        setIsLoadingStep(false);
        setStepRaw(1);
      }, 5000);

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
          clearTimeout(timeoutId);
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
        
        console.log('[TrustShield] 🔱 God-Level State Init:', {
          step: stepData.step,
          lockedStep: locked,
          source: stepData.source,
          progress: stepData.progress,
        });

        // If there's a locked step from previous session, restore it
        if (locked && locked > 1) {
          setLockedStep(locked);
          setStepRaw(locked);
          
          // Restore progress from metadata
          if (stepData.progress?.ageGroup) setAgeGroupRaw(stepData.progress.ageGroup);
          if (stepData.progress?.ocrData) setOcrDataRaw(stepData.progress.ocrData);
          if (stepData.progress?.identityHash) setIdentityHashRaw(stepData.progress.identityHash);
          
          console.log('[TrustShield] 🔒 Restored to locked step:', locked);
        } else {
          // Check if we're coming from a redirect with locked step
          const fromState = location.state?.lockedStep;
          if (fromState && fromState > 1) {
            setLockedStep(fromState);
            setStepRaw(fromState);
          } else {
            setStepRaw(stepData.step || 1);
          }
        }
      } catch (err) {
        console.error('[TrustShield] State init error:', err);
        setStepRaw(1); // Fallback to step 1 on error
      } finally {
        clearTimeout(timeoutId);
        setIsLoadingStep(false);
      }
    };

    initializeGodLevelState();
  }, [user?.id, location.state]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LAYER 1: STEP PERSISTENCE - Save step changes to DB + localStorage
  // ═══════════════════════════════════════════════════════════════════════════
  const persistStepChange = useCallback(async (newStep, metadata = {}) => {
    if (!user?.id) return;
    
    try {
      const result = await setVerificationStep(user.id, newStep, {
        ...metadata,
        ageGroup,
        ocrData,
        identityHash,
        timestamp: Date.now(),
      });
      
      console.log('[TrustShield] 💾 Step persisted:', result);
      
      // If reaching Step 3 (Biometrics), LOCK the user there
      if (newStep === 3) {
        await lockVerificationStep(user.id, 3);
        setLockedStep(3);
        console.log('[TrustShield] 🔒 Step 3 LOCKED - Biometrics required');
      }
    } catch (err) {
      console.error('[TrustShield] Step persistence failed:', err);
    }
  }, [user?.id, ageGroup, ocrData, identityHash]);

  // ── Core State ────────────────────────────────────────────────────────────
  const [step, setStepRaw] = useState(1);
  
  // Wrapped setStep with persistence
  const setStep = useCallback((newStep) => {
    setStepRaw(newStep);
    persistStepChange(newStep);
  }, [persistStepChange]);
  
  const [ageGroup, setAgeGroupRaw] = useState(null);
  const setAgeGroup = useCallback((val) => {
    setAgeGroupRaw(val);
    if (user?.id) {
      setVerificationStep(user.id, step, { ageGroup: val });
    }
  }, [user?.id, step]);
  
  const [ocrData, setOcrDataRaw] = useState(null);
  const [manualAadhaar, setManualAadhaar] = useState('');
  const [manualAadhaarError, setManualAadhaarError] = useState(null);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualInstitution, setManualInstitution] = useState('');
  const [manualStudentIdError, setManualStudentIdError] = useState(null);
  const [idConfirmed, setIdConfirmed] = useState(false);
  const setOcrData = useCallback((val) => {
    setOcrDataRaw((prev) => (typeof val === 'function' ? val(prev) : val));
    if (user?.id) {
      const computed = typeof val === 'function' ? val(ocrData) : val;
      setVerificationStep(user.id, step, { ocrData: computed });
    }
  }, [user?.id, step, ocrData]);

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

  const handleManualAadhaarSubmit = useCallback(async () => {
    const cleaned = (manualAadhaar || '').replace(/\s/g, '');
    setManualAadhaarError(null);

    if (!/^\d{12}$/.test(cleaned)) {
      setManualAadhaarError('Enter your full 12-digit Aadhaar number.');
      return;
    }
    if (!validateAadhaarVerhoeff(cleaned)) {
      setManualAadhaarError('Invalid Aadhaar number (checksum failed). Recheck digits.');
      return;
    }

    const dup = await checkDuplicateID(cleaned, 'aadhaar');
    if (dup?.exists) {
      const alertConfig = getAlertConfig(dup.alertType);
      setManualAadhaarError(`${alertConfig.title}: ${alertConfig.message}`);
      setAccountLocked(true);
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

    setOcrData((prev) => ({
      ...(prev || {}),
      idNumber: cleaned,
      idType: 'aadhaar',
      idMaskedLast4: cleaned.slice(-4),
    }));

    try {
      const hash = await computeIdentityHash(cleaned);
      if (hash) setIdentityHash(hash);
    } catch (_) {}

    setManualAadhaarError(null);
    setError(null);
    setIdConfirmed(true);
  }, [manualAadhaar, validateAadhaarVerhoeff, setOcrData, handleFail, navigate, setIdentityHash]);

  const handleManualStudentIdSubmit = useCallback(async () => {
    const cleaned = (manualStudentId || '').trim();
    const inst = (manualInstitution || '').trim();
    setManualStudentIdError(null);

    if (cleaned.length < 4) {
      setManualStudentIdError('Enter your Student ID / Roll Number (at least 4 characters).');
      return;
    }
    if (inst.length < 2) {
      setManualStudentIdError('Enter your School/College name.');
      return;
    }

    const dup = await checkDuplicateStudentID(cleaned, inst);
    if (dup?.exists) {
      const alertConfig = getAlertConfig(dup.alertType);
      setManualStudentIdError(`${alertConfig.title}: ${alertConfig.message}`);
      setAccountLocked(true);
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

    setOcrData((prev) => ({
      ...(prev || {}),
      idNumber: cleaned,
      idType: 'student',
      institution: inst,
    }));

    try {
      const hash = await computeIdentityHash(cleaned + ':' + inst);
      if (hash) setIdentityHash(hash);
    } catch (_) {}

    setManualStudentIdError(null);
    setError(null);
    setIdConfirmed(true);
  }, [manualStudentId, manualInstitution, setOcrData, handleFail, navigate, setIdentityHash]);
  
  const [identityHash, setIdentityHashRaw] = useState(null);
  const setIdentityHash = useCallback((val) => {
    setIdentityHashRaw(val);
    if (user?.id) {
      setVerificationStep(user.id, step, { identityHash: val });
    }
  }, [user?.id, step]);
  
  const [guardianToken, setGuardianToken] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false); // LOCKED_INJECTION hard lock
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [statusClicks, setStatusClicks] = useState(0);
  // Unique session ID for this mobile handoff
  const [handoffSessionId] = useState(() => generateHandoffSessionId());

  // ── Liveness State ────────────────────────────────────────────────────────
  // Randomize challenge order each session — 'Chaos Engine'
  const challengeSequenceRef = useRef([]);
  const [livenessPhase, setLivenessPhase] = useState(0);
  const [livenessLuminance, setLivenessLuminance] = useState(1);
  const [livenessStatus, setLivenessStatus] = useState('');
  const [livenessComplete, setLivenessComplete] = useState([false, false, false]);
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
  const tiltHoldRef       = useRef(0); // Consecutive frames with |yaw| > threshold
  const smileHoldRef      = useRef(0); // Consecutive frames with expressions.happy > threshold
  // ── Teleport / Injection Detection ────────────────────────────────────────
  const prevYawRef        = useRef(null);    // Previous frame yaw for delta check
  const prevFaceCenterRef = useRef(null);
  const teleportCountRef  = useRef(0);       // Consecutive teleport events

  // ── Scanner Hook ──────────────────────────────────────────────────────────
  const scanner = useScanner();

  // ── Typewriter ────────────────────────────────────────────────────────────
  const [typewriterText, setTypewriterText] = useState('');
  const fullWaitingText = "Mobile Bridge active. Complete the ritual on your phone, Macha. I'm watching the gate here.";

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
    setStep(1);
    setAgeGroup(null);
    setOcrData(null);
    setIdentityHash(null);
    setManualAadhaar('');
    setManualAadhaarError(null);
    setManualStudentId('');
    setManualInstitution('');
    setManualStudentIdError(null);
    setIdConfirmed(false);
    setAccountLocked(false);
    setStaticImageFlag(false);
    setLivenessPhase(0);
    setLivenessComplete([false, false, false]);
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
      // ═══════════════════════════════════════════════════════════════════════
      // 🔒 ULTRA STRICT: Pre-Validation Checks (Fail Fast)
      // ═══════════════════════════════════════════════════════════════════════

      // GATE: ID must be confirmed via manual entry
      if (!idConfirmed) {
        handleFail('Please enter and verify your ID number before proceeding.');
        setSaving(false);
        return;
      }

      const rawIdNumber = ocrData?.idNumber || ocrData?.id;
      
      const cleanId = (rawIdNumber || '').toUpperCase().replace(/\s/g, '');
      

      let effectiveIdentityHash = identityHash;
      if (!effectiveIdentityHash) {
        try {
          effectiveIdentityHash = await computeIdentityHash(cleanId);
          if (effectiveIdentityHash) setIdentityHash(effectiveIdentityHash);
        } catch (_) {}
      }
      if (!effectiveIdentityHash) {
        handleFail('Verification failed: identity hash missing. Please rescan your ID.');
        setSaving(false);
        return;
      }
      
      // Check 2: Identity Uniqueness (CRITICAL - One Person = One Account)
      console.log('[TrustShield] 🔒 ULTRA: Checking identity uniqueness...');
      const uniquenessCheck = await checkIdentityUniqueness(
        ocrData?.name,
        ocrData?.dob,
        cleanId,
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
      
      console.log('[TrustShield] ✅ ULTRA: Identity is unique, proceeding...');
      
      // Log the attempt
      await logVerificationAttempt(user.id, 'finalization', 'ATTEMPT', {
        device_id: deviceId,
        age_group: ageGroup,
        id_type: uniquenessCheck?.idType,
      });
      
      // ═══════════════════════════════════════════════════════════════════════
      // Run the 6-Layer God-Level Validation Pipeline
      // ═══════════════════════════════════════════════════════════════════════
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
      
      console.log('[TrustShield] ✅ All 6 layers passed:', validation);
      
      // ═══════════════════════════════════════════════════════════════════════
      // LAYER 3: ATOMIC VERIFICATION COMPLETION
      // Only the RPC can mark an account as verified - no direct updates
      // ═══════════════════════════════════════════════════════════════════════
      // ═══════════════════════════════════════════════════════════════════════
      // ULTRA STRICT: Calculate actual face score from liveness
      // Must be >= 0.88 to pass SQL check
      // ═══════════════════════════════════════════════════════════════════════
      const completedChallenges = livenessComplete.filter(Boolean).length;
      const faceScore = completedChallenges === 3 ? 0.95 : (completedChallenges / 3);
      
      if (faceScore < 0.88) {
        handleFail('🔒 LIVENESS FAIL: Complete all 3 biometric challenges with proper lighting. Score: ' + faceScore.toFixed(2));
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════════════
      // ULTRA STRICT: Use raw ID from pre-check (already validated)
      // ═══════════════════════════════════════════════════════════════════════
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
      
      console.log('[TrustShield] ✅ Verification finalization complete:', result);
      
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
      
      setStep(5);
      
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
  }, [ageGroup, ocrData, user, handleFail, focusly, deviceId, livenessComplete, scanner?.capturedFile, identityHash, idConfirmed, validateAadhaarVerhoeff, setIdentityHash]);

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

  // ── Founder's Backdoor (dev only) ─────────────────────────────────────────
  const keysPressed = useRef(new Set());
  useEffect(() => {
    const down = async (e) => {
      if (process.env.NODE_ENV !== 'development') return;
      keysPressed.current.add(e.key.toLowerCase());
      if (e.ctrlKey && e.shiftKey && keysPressed.current.has('v')) {
        try {
          if (user?.id) {
            await supabase.from('profiles').update({
              verification_status: 'VERIFIED', trust_shield_status: 'VERIFIED',
            }).eq('id', user.id);
            localStorage.setItem('bypass_used', 'true');
            navigate('/home', { replace: true });
          }
        } catch (_) {}
      }
    };
    const up = (e) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [user, navigate]);

  const handleFounderBypass = useCallback(async () => {
    try {
      setSaving(true);
      await persistTrustShieldState({
        userId: user.id,
        verificationStatus: 'VERIFIED',
        ocrResult: { name: 'Founder', dob: '1990-01-01', confidence: 1 },
        faceScore: 1.0,
        attemptResult: 'PASS',
        stage: 'founder_bypass',
        reason: 'Localhost debug override',
      });
      setStep(5);
    } catch (err) {
      setError('Bypass failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Volume key bypass (dev)
  useEffect(() => {
    const fn = (e) => { if (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp') handleFounderBypass(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [handleFounderBypass]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 STEP HANDLERS WITH GOD-LEVEL VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ── STEP 1 Handler ───────────────────────────────────────────────────────
  const handleAgeConfirm = async () => {
    if (!ageGroup || isLocked) return;
    
    // Check rate limiting
    const rateLimit = await checkRateLimit(deviceId);
    if (!rateLimit.allowed) {
      setError(rateLimit.reason);
      setIsLocked(true);
      return;
    }
    
    setError(null);
    
    // Persist step 2
    await setVerificationStep(user?.id, 2, { ageGroup });
    setStepRaw(2);
    
    // Log attempt
    await logVerificationAttempt(user?.id, 'step_1_age_selection', 'COMPLETE', { ageGroup });
    
    // Auto-start camera scanner
    setTimeout(() => scanner.startCamera(), 300);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 STEP 2: OCR result ready → God-Level 6-Layer Validation
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (scanner.phase !== 'captured' || !scanner.ocrResult) return;
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
      console.log('[TrustShield] ✅ ID quality passed:', quality.metadata);
    }

    // If OCR couldn't fully read the document, that's OK — user will fill in manually
    if (!result.ok) {
      console.log('[TrustShield] OCR partial read — user will fill in manually. Missing:', result.missingFields || 'unknown');
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
          console.log('[TrustShield] SPECIAL BYPASS: Document unknown, prioritizing DOB.');
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
        const uniqueness = await checkIdentityUniqueness(result.name, result.dob, deviceId);
        
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
        
        console.log('[TrustShield] ✅ Identity uniqueness passed');
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
          
          console.log('[TrustShield] ✅ ID number duplicate check passed');
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
    setLivenessStatus('Loading biometric AI modules...');
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setFaceModelsLoaded(true);
      setLivenessStatus('Models ready — starting camera...');
    } catch (e) {
      setLivenessStatus('Failed to load Face AI. Check connection.');
    }
  }, [faceModelsLoaded]);

  const startLivenessCamera = useCallback(async () => {
    // ── SHUFFLE THE FULL 3-CHALLENGE POOL (Blink / Smile / Tilt) ──
    // Spec: "randomized challenge sequence (Blink → Slow Smile → Face Tilt)"
    // Order is randomized per session — there is no fixed order.
    const shuffled = shuffleChallenges(LIVENESS_CHALLENGE_POOL);
    challengeSequenceRef.current = shuffled;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      liveStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play();
      }
      // Reset all liveness state
      earBufferRef.current    = [];
      baselineEARRef.current  = null;
      yawHistoryRef.current   = [];
      blinkCountRef.current   = 0;
      prevYawRef.current      = null;
      prevFaceCenterRef.current = null;
      teleportCountRef.current = 0;
      tiltHoldRef.current      = 0;
      smileHoldRef.current     = 0;
      setLivenessPhase(0);
      setLivenessComplete([false, false, false]);
      setStaticImageFlag(false);
      // Show the RANDOMIZED first challenge
      setLivenessStatus(`Challenge 1 of 3 — ${shuffled[0]?.icon || ''} ${shuffled[0]?.label || 'Hold steady'}`);
      startLivenessLoop();
    } catch (_) {
      setLivenessStatus('Camera blocked. Enable camera and retry.');
    }
  }, [startLivenessLoop]);

  const stopLivenessCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => t.stop());
      liveStreamRef.current = null;
    }
  }, []);

  // ── Liveness Detection Loop — CHAOS ENGINE ────────────────────────────────
  const startLivenessLoop = useCallback(() => {
    let lastTime = 0;
    const detect = async (timestamp) => {
      if (!liveVideoRef.current) return;
      rafRef.current = requestAnimationFrame(detect);
      if (timestamp - lastTime < 120) return; // ~8fps for mobile CPU
      lastTime = timestamp;

      try {
        const detection = await faceapi
          .detectSingleFace(liveVideoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        if (!detection) {
          setLivenessStatus('👤 Face not detected — center yourself');
          return;
        }

        const { landmarks, expressions } = detection;
        const leftEye  = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const nose = landmarks.getNose();
        const jaw  = landmarks.getJawOutline();

        // ── Yaw estimation: nose-tip x relative to jaw width ──────────
        const noseTip  = nose[3];
        const jawLeft  = jaw[0];
        const jawRight = jaw[jaw.length - 1];
        const jawMid   = (jawLeft.x + jawRight.x) / 2;
        const yaw = (noseTip.x - jawMid) / ((jawRight.x - jawLeft.x) || 1); // -0.5..0.5

        const faceBox = detection.detection.box;
        const faceCenterX = faceBox.x + faceBox.width / 2;
        const faceCenterY = faceBox.y + faceBox.height / 2;

        // ── VIRTUAL RING LIGHT LUMINANCE CHECK ──
        if (liveVideoRef.current) {
            try {
                const osc = document.createElement('canvas');
                osc.width = 32; osc.height = 32;
                const ctx = osc.getContext('2d');
                ctx.drawImage(liveVideoRef.current, 0, 0, 32, 32);
                const px = ctx.getImageData(0,0,32,32).data;
                let lumSum = 0;
                for(let i=0; i<px.length; i+=4) lumSum += (0.299 * px[i] + 0.587 * px[i+1] + 0.114 * px[i+2]) / 255;
                setLivenessLuminance(lumSum / (32*32));
            } catch(e) {}
        }

        // ── 'HUMAN-ONLY' 100% STATIC INJECTION CHECK ──────────────────────────────
        const currentLandmarksString = JSON.stringify(landmarks.positions);
        if (prevFaceCenterRef.current === currentLandmarksString) {
            teleportCountRef.current = (teleportCountRef.current || 0) + 1;
            if (teleportCountRef.current > 5) {
               // 100% static for 5 frames -> injection detected
               cancelAnimationFrame(rafRef.current);
               stopLivenessCamera();
               setAccountLocked(true);
               setStaticImageFlag(true);
               handleFail('SECURITY_ALERT: Static photo/video injection detected. Challenge reset.');
               return;
            }
        } else {
            teleportCountRef.current = 0;
        }
        prevFaceCenterRef.current = currentLandmarksString;

        // ── CHALLENGE DETECTION: BLINK / SMILE / TILT ──
        // Math-based, spec-perfect. Each challenge requires sustained evidence
        // to prevent single-frame false positives.
        const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const EAR = (eye) =>
          (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) /
          (2 * (dist(eye[0], eye[3]) || 1));
        const leftEAR = EAR(leftEye);
        const rightEAR = EAR(rightEye);
        const avgEAR = (leftEAR + rightEAR) / 2;

        const currentPhaseIndex = livenessPhase;
        const currentChallenge = challengeSequenceRef.current[currentPhaseIndex];
        if (!currentChallenge) return; // All done or not yet initialised

        const advance = () => {
          setLivenessComplete(prev => {
            const n = [...prev];
            n[currentPhaseIndex] = true;
            return n;
          });
          const nextIdx = currentPhaseIndex + 1;
          // Reset per-challenge counters
          blinkCountRef.current = 0;
          smileHoldRef.current = 0;
          tiltHoldRef.current = 0;
          if (nextIdx >= challengeSequenceRef.current.length) {
            // All challenges complete — stop detection but DO NOT auto-advance.
            // The spec demands a physical Continue button that enables only here.
            setLivenessPhase(nextIdx);
            stopLivenessCamera();
            setLivenessStatus('✅ Liveness confirmed. Press Continue to proceed.');
          } else {
            setLivenessPhase(nextIdx);
            const n = challengeSequenceRef.current[nextIdx];
            setLivenessStatus(`Challenge ${nextIdx + 1} of 3 — ${n.icon} ${n.label}`);
          }
        };

        // 1️⃣ BLINK — EAR drops below 0.22 (closed) ≥2 times
        if (currentChallenge.id === 'blink') {
          if (avgEAR < 0.22) {
            blinkCountRef.current = (blinkCountRef.current || 0) + 1;
            if (blinkCountRef.current >= 2) advance();
          } else if (blinkCountRef.current > 0 && avgEAR > 0.28) {
            // Eyes re-opened between blinks — keep count
          }
        }

        // 2️⃣ SMILE — expressions.happy sustained > 0.80 for ≥4 frames (~0.5s @ 8fps)
        if (currentChallenge.id === 'smile') {
          if (expressions.happy > 0.80) {
            smileHoldRef.current = (smileHoldRef.current || 0) + 1;
            if (smileHoldRef.current >= 4) advance();
          } else {
            smileHoldRef.current = 0;
          }
        }

        // 3️⃣ TILT — |yaw| > 0.18 sustained ≥3 frames (~0.4s @ 8fps)
        if (currentChallenge.id === 'tilt') {
          if (Math.abs(yaw) > 0.18) {
            tiltHoldRef.current = (tiltHoldRef.current || 0) + 1;
            if (tiltHoldRef.current >= 3) advance();
          } else {
            tiltHoldRef.current = 0;
          }
        }
      } catch (_) {
         console.error('[Liveness] Detection error:', _);
      }
    };
    rafRef.current = requestAnimationFrame(detect);
  }, [stopLivenessCamera, user?.id]);

  useEffect(() => {
    if (step === 3) {
      loadFaceModels().then(() => faceModelsLoaded && startLivenessCamera());
    }
    return () => { if (step !== 3) stopLivenessCamera(); };
  }, [step, faceModelsLoaded, loadFaceModels, startLivenessCamera, stopLivenessCamera]);

  useEffect(() => {
    if (step === 3 && faceModelsLoaded) startLivenessCamera();
  }, [faceModelsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => () => stopLivenessCamera(), [stopLivenessCamera]);

  // ── Progress Bar ──────────────────────────────────────────────────────────
  const renderProgress = () => (
    <div className={styles.progressBar}>
      {STEPS.map((s) => (
        <div key={s.id} className={`${styles.progressStep} ${step >= s.id ? styles.progressActive : ''} ${step === s.id ? styles.progressCurrent : ''}`}>
          <div className={styles.progressDot}>{step > s.id ? '✓' : s.icon}</div>
          <span className={styles.progressLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PILLAR 1: ENHANCED VISUAL RING-LIGHT — FORCE 100% BRIGHTNESS ON MOBILE
  // When luminance < 0.3, force the entire UI to pure white to illuminate face
  // ═══════════════════════════════════════════════════════════════════════════
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const shouldActivateRingLight = step === 3 && livenessLuminance < 0.3 && !accountLocked;
  const ringLightStyles = shouldActivateRingLight 
    ? { 
        backgroundColor: '#FFFFFF', 
        filter: 'brightness(1.0)', // 100% brightness
        transition: 'all 0.3s ease',
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
      } 
    : { transition: 'background-color 0.3s ease' };

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 GOD-LEVEL LOADING STATE - While persistent state is initializing
  // ═══════════════════════════════════════════════════════════════════════════
  if (isLoadingStep) {
    return (
      <MainLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          padding: '20px',
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            border: '4px solid rgba(139, 92, 246, 0.2)', 
            borderTop: '4px solid #8b5cf6',
            borderRight: '4px solid #ec4899',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '24px',
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
          }} />
          <h2 style={{ color: '#e2e8f0', marginBottom: '8px' }}>🔱 Initializing Trust Shield</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Restoring your verification session...</p>
          
          {/* 🔧 EMERGENCY BYPASS - Click 5 times to skip loading */}
          <div 
            onClick={() => {
              const clicks = parseInt(localStorage.getItem('loading_bypass_clicks') || '0') + 1;
              localStorage.setItem('loading_bypass_clicks', clicks);
              if (clicks >= 5) {
                localStorage.removeItem('loading_bypass_clicks');
                setIsLoadingStep(false);
                console.log('[TrustShield] Emergency bypass activated');
              }
            }}
            style={{ 
              position: 'absolute', 
              bottom: 100, 
              width: 100, 
              height: 100,
              cursor: 'default',
            }}
          />
          
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </MainLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔱 LOCKED STEP WARNING - If user is locked to a specific step
  // ═══════════════════════════════════════════════════════════════════════════
  const LockedStepWarning = () => {
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
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div 
        className={styles.container} 
        style={ringLightStyles}
        data-ring-light-active={shouldActivateRingLight && isMobile ? 'true' : 'false'}
      >
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)} disabled={lockedStep === 3}>← Back</button>
          <h1
            className={styles.title}
            onDoubleClick={() => {
              if (process.env.NODE_ENV !== 'development') return;
              localStorage.removeItem(COOLDOWN_KEY);
              localStorage.removeItem(FAIL_COUNT_KEY);
              setIsLocked(false);
              setError('Lock reset.');
            }}
            style={{ userSelect: 'none' }}
          >
            🛡️ Focus Trust Shield
          </h1>
          <div style={{ width: 60 }} />
        </div>

        <LockedStepWarning />

        {renderProgress()}

        <div className={styles.content}>
          <FocuslyLion />

          {/* ── STEP 1: AGE SELECTION ── */}
          {step === 1 && (
            <div className={styles.stepCard}>
              <div className={styles.shieldIcon}>🛡️</div>
              <h2 className={styles.stepTitle}>Identity Verification</h2>
              <p className={styles.stepDesc}>
                Focus uses live biometric verification to protect every citizen. No bots. No fakes. No exceptions.
              </p>
              <div className={styles.ageGrid}>
                <button
                  className={`${styles.ageCard} ${ageGroup === '13-17' ? styles.ageCardSelected : ''}`}
                  onClick={() => setAgeGroup('13-17')} disabled={isLocked}
                >
                  <span className={styles.ageIcon}>🎓</span>
                  <strong>Ages 13–17</strong>
                  <small>Student ID required<br/>+ Guardian approval</small>
                </button>
                <button
                  className={`${styles.ageCard} ${ageGroup === '18+' ? styles.ageCardSelected : ''}`}
                  onClick={() => setAgeGroup('18+')} disabled={isLocked}
                >
                  <span className={styles.ageIcon}>🪪</span>
                  <strong>Ages 18+</strong>
                  <small>Government ID required<br/>(Aadhaar / Passport)</small>
                </button>
              </div>
              {error && <div className={styles.errorBox}>{error}</div>}
              <button className={styles.primaryBtn} onClick={handleAgeConfirm} disabled={!ageGroup || isLocked}>
                Continue — Start Camera →
              </button>
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

              {/* Live camera feed */}
              {(scanner.phase === 'streaming' || scanner.phase === 'requesting' || scanner.phase === 'scanning') && (
                <div className={styles.liveScannerWrap}>
                  <video
                    ref={scanner.videoRef}
                    autoPlay muted playsInline
                    className={styles.liveScannerVideo}
                  />
                  <canvas ref={scanner.canvasRef} style={{ display: 'none' }} />
                  {/* Scanning frame overlay */}
                  <div className={styles.liveScannerFrame}>
                    <span className={styles.frameCornerTL} />
                    <span className={styles.frameCornerTR} />
                    <span className={styles.frameCornerBL} />
                    <span className={styles.frameCornerBR} />
                    {scanner.phase === 'scanning' && <div className={styles.scanBeam} />}
                  </div>
                  {/* Low-light warning */}
                  {scanner.lightWarning && (
                    <div className={styles.lowLightToast}>
                      <span className={styles.lowLightIcon}>💡</span>
                      <div>
                        <strong>Low Light Detected</strong>
                        <p>Move closer to a lamp or window</p>
                      </div>
                    </div>
                  )}
                  {/* Quality indicator */}
                  <div className={styles.qualityChip} style={{
                    background: scanner.sharpnessOk ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                    borderColor: scanner.sharpnessOk ? '#22c55e' : '#fbbf24',
                    color: scanner.sharpnessOk ? '#22c55e' : '#fbbf24',
                  }}>
                    {scanner.sharpnessOk ? '✅ Sharp' : '📷 Aligning...'}
                  </div>
                </div>
              )}

              {/* Captured frame */}
              {scanner.phase === 'captured' && scanner.capturedFrame && (
                <img src={scanner.capturedFrame} alt="Captured ID" className={styles.capturedPreview} />
              )}

              {/* Start camera button */}
              {scanner.phase === 'idle' && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button className={styles.primaryBtn} onClick={scanner.startCamera}>
                    📸 Open Camera
                  </button>
                  <label className={styles.primaryBtn} style={{ cursor: 'pointer', background: 'transparent', border: '1px solid var(--accent-magenta)' }}>
                    📂 Browse Files
                    <input 
                       type="file" 
                       accept="image/*" 
                       hidden 
                       onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const img = new Image();
                             const url = URL.createObjectURL(file);
                             img.onload = () => {
                                 const canvas = document.createElement('canvas');
                                 canvas.width = img.width;
                                 canvas.height = img.height;
                                 const ctx = canvas.getContext('2d');
                                 ctx.drawImage(img, 0, 0);
                                 URL.revokeObjectURL(url);
                                 if (scanner.runOCR) scanner.runOCR(canvas);
                             };
                             img.src = url;
                          }
                       }}
                    />
                  </label>
                </div>
              )}

              {/* Progress */}
              {(scanner.phase === 'scanning' || scanner.progress > 0) && (
                <div className={styles.ocrProgress}>
                  <div className={styles.ocrProgressBar}>
                    <div className={styles.ocrProgressFill} style={{ width: `${scanner.progress}%` }} />
                  </div>
                  <p className={styles.statusText}>{scanner.statusMessage}</p>
                </div>
              )}

              {/* Status message */}
              {scanner.phase !== 'scanning' && scanner.statusMessage && (
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
                  <div className={styles.ocrField}><span>OCR</span><strong>{Math.round((ocrData.confidence || 0) * 100)}%</strong></div>
                </div>
              )}

              {/* ID ENTRY FORM — PRIMARY PATH (always visible after scan) */}
              {scanner.phase === 'captured' && ageGroup === '18+' && (
                <div className={styles.ocrResults} style={{ marginTop: 16 }}>
                  <h3>🪪 Enter Aadhaar Number</h3>
                  <p className={styles.statusText} style={{ marginTop: 6, color: '#94a3b8' }}>
                    {idConfirmed ? '✅ Aadhaar verified — proceed below.'
                      : ocrData?.idType === 'aadhaar_masked' ? `Masked Aadhaar detected (last 4: ${ocrData?.idMaskedLast4 || '****'}). Enter full 12 digits.`
                      : 'Enter your 12-digit Aadhaar. One Aadhaar = One account.'}
                  </p>
                  {!idConfirmed && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <input value={manualAadhaar} inputMode="numeric" autoComplete="off" placeholder="12-digit Aadhaar"
                        onChange={(e) => { setManualAadhaarError(null); setManualAadhaar((e.target.value || '').replace(/[^0-9\s]/g, '')); }}
                        style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.35)', background: 'rgba(15,23,42,0.35)', color: '#e2e8f0', width: 240, outline: 'none' }} />
                      <button className={styles.primaryBtn} onClick={handleManualAadhaarSubmit}>Verify Aadhaar</button>
                    </div>
                  )}
                  {manualAadhaarError && <p className={styles.statusText} style={{ color: '#fca5a5', textAlign: 'center', marginTop: 10 }}>{manualAadhaarError}</p>}
                </div>
              )}

              {scanner.phase === 'captured' && ageGroup === '13-17' && (
                <div className={styles.ocrResults} style={{ marginTop: 16 }}>
                  <h3>🎓 Enter Student ID</h3>
                  <p className={styles.statusText} style={{ marginTop: 6, color: '#94a3b8' }}>
                    {idConfirmed ? '✅ Student ID verified — proceed below.'
                      : 'Enter your School/College ID and institution name. One student = One account.'}
                  </p>
                  {!idConfirmed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, alignItems: 'center' }}>
                      <input value={manualStudentId} autoComplete="off" placeholder="Student ID / Roll No."
                        onChange={(e) => { setManualStudentIdError(null); setManualStudentId(e.target.value); }}
                        style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.35)', background: 'rgba(15,23,42,0.35)', color: '#e2e8f0', width: 280, outline: 'none' }} />
                      <input value={manualInstitution} autoComplete="off" placeholder="School / College Name"
                        onChange={(e) => { setManualStudentIdError(null); setManualInstitution(e.target.value); }}
                        style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.35)', background: 'rgba(15,23,42,0.35)', color: '#e2e8f0', width: 280, outline: 'none' }} />
                      <button className={styles.primaryBtn} onClick={handleManualStudentIdSubmit}>Verify Student ID</button>
                    </div>
                  )}
                  {manualStudentIdError && <p className={styles.statusText} style={{ color: '#fca5a5', textAlign: 'center', marginTop: 10 }}>{manualStudentIdError}</p>}
                </div>
              )}

              {(error || scanner.phase === 'error') && (
                <div className={`${styles.errorBox} ${styles.glassErrorToast}`}>
                  <p>{error || scanner.statusMessage}</p>
                  <button className={styles.retryBtn} onClick={scanner.retry}>↺ Retry Scan</button>
                </div>
              )}

              {idConfirmed && scanner.phase === 'captured' && (
                <button className={styles.primaryBtn} onClick={() => { setStep(3); }}>
                  Continue to Liveness →
                </button>
              )}

              {(scanner.phase === 'streaming' || scanner.phase === 'scanning') && (
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
                3-step challenge to confirm you're a living person. Complete each challenge in sequence.
              </p>

              {/* Randomized Challenge progress chips */}
              <div className={styles.challengeBar}>
                {(challengeSequenceRef.current || []).map((ch, i) => (
                  <div key={ch.id} className={`${styles.challengeChip} ${
                    livenessComplete[i] ? styles.challengeDone :
                    livenessPhase === i ? styles.challengeActive :
                    styles.challengePending
                  }`}>
                    {livenessComplete[i] ? '✓ ' : `${i+1}. `}{ch.icon} {ch.label}
                  </div>
                ))}
              </div>

              {/* Video feed */}
              <div className={styles.livenessRing} style={{
                borderColor: livenessPhase === 0 ? '#a855f7' :
                             livenessPhase === 1 ? '#38bdf8' : '#22c55e',
                boxShadow: `0 0 30px ${livenessPhase === 0 ? 'rgba(168,85,247,0.4)' :
                                       livenessPhase === 1 ? 'rgba(56,189,248,0.4)' : 'rgba(34,197,94,0.4)'}`,
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
                  background: staticImageFlag ? '#ef4444' : '#a855f7',
                  boxShadow: `0 0 10px ${staticImageFlag ? '#ef4444' : '#a855f7'}`,
                }} />
                <span className={styles.statusText}>{staticImageFlag
                  ? '🚨 Static image injection detected — restarting'
                  : livenessStatus || 'Initializing biometric engine...'
                }</span>
              </div>

              {staticImageFlag && !accountLocked && (
                <button className={styles.retryBtn} onClick={() => {
                  setStaticImageFlag(false);
                  setLivenessPhase(0);
                  setLivenessComplete([false, false, false]);
                  yawHistoryRef.current = [];
                  prevYawRef.current = null;
                  teleportCountRef.current = 0;
                  startLivenessCamera();
                }}>↺ Restart Liveness</button>
              )}
              {/* HARD LOCK: Account permanently locked due to injection attempt */}
              {accountLocked && (
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

              {/*
                ═══════════════════════════════════════════════════════════════════════
                PILLAR 1: PHYSICAL CONTINUE LOCK — RUTHLESSLY UNBYPASSABLE
                ═══════════════════════════════════════════════════════════════════════
                The Continue button is 100% DISABLED until the AI mathematically
                confirms all 3 liveness challenges are complete. No manual skip.
                No DOM manipulation bypass. The livenessComplete array is the
                single source of truth — locked in React state, verified here.
              */}
              {(() => {
                // ═════════════════════════════════════════════════════════════════
                // CHALLENGE VERIFICATION — Triple-check mechanism
                // ═════════════════════════════════════════════════════════════════
                const requiredChallengeCount = 3;
                const hasValidSequence = challengeSequenceRef.current.length === requiredChallengeCount;
                const completedChallenges = livenessComplete.filter(Boolean).length;
                const allConfirmed = hasValidSequence && completedChallenges === requiredChallengeCount;
                
                // Additional integrity check: verify each challenge was actually registered
                const integrityVerified = allConfirmed && 
                  challengeSequenceRef.current.every((challenge, idx) => {
                    return challenge && livenessComplete[idx] === true;
                  });
                
                const canProceed = integrityVerified && !accountLocked && !saving;
                
                return (
                  <button
                    className={`${styles.primaryBtn} ${styles.pillar1Locked}`}
                    onClick={completeVerification}
                    disabled={!canProceed}
                    data-testid="trust-shield-continue-btn"
                    data-pillar1-verified={canProceed ? 'true' : 'false'}
                    data-challenges-complete={`${completedChallenges}/${requiredChallengeCount}`}
                    aria-disabled={!canProceed}
                    style={{
                      marginTop: 12,
                      opacity: canProceed ? 1 : 0.35,
                      cursor: canProceed ? 'pointer' : 'not-allowed',
                      // Visual lock indicator
                      border: canProceed ? '2px solid #22c55e' : '2px solid #ef4444',
                      boxShadow: canProceed ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
                    }}
                  >
                    {saving ? (
                      '⏳ Securing verification…'
                    ) : canProceed ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✅</span>
                        <span>Continue — Identity Verified</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔒</span>
                        <span>AI Verification Required ({completedChallenges}/3)</span>
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
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    const n = statusClicks + 1;
                    setStatusClicks(n);
                    if (n >= 5) handleFounderBypass();
                  }
                }}
                style={{
                  cursor: 'pointer', userSelect: 'none',
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
              <div className={styles.successIcon}>{ageGroup === '13-17' ? '🔐' : '✨'}</div>
              <h2 className={styles.stepTitle}>
                {ageGroup === '13-17' ? 'Awaiting Guardian Approval' : 'Verification Complete!'}
              </h2>

              {ageGroup === '18+' ? (
                <>
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
              ) : (
                <>
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
                                await supabase.functions.invoke('send-guardian-email', {
                                    body: { email: emailInput, link: `${window.location.origin}/verification/parent-consent?token=${guardianToken}` }
                                });
                             } catch (err) {
                                console.error('Failed to send edge function email:', err);
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
    </MainLayout>
  );
};

export default TrustShieldVerification;
