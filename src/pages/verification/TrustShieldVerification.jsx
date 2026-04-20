import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useScanner from '../../hooks/useScanner';
import { persistTrustShieldState, createGuardianHandshake } from '../../utils/trustShieldEngine';
import { computeIdentityHash, classifyDocumentTier } from '../../hooks/useOCRScanner';
import MainLayout from '../../components/layout/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import * as faceapi from 'face-api.js';
import styles from './TrustShieldVerification.module.css';

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

// ── Liveness Challenge Pool (order randomized each session) ──────────────────
const LIVENESS_CHALLENGE_POOL = [
  { id: 'blink',     label: '👁️  Blink both eyes rapidly',   icon: '👁️'  },
  { id: 'smile',     label: '😊  Slow Smile naturally',       icon: '😊'  },
  { id: 'turn_left', label: '↩️  Look LEFT 15°',             icon: '↩️'  },
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
const FocuslyLion = ({ onSecretBypass }) => {
  const [clicks, setClicks] = useState(0);
  return (
    <div
      className={styles.focuslyContainer}
      onClick={() => { const n = clicks + 1; setClicks(n); if (n >= 5) onSecretBypass(); }}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.focuslyAvatar} style={{ userSelect: 'none' }}>🦁</div>
      <div className={styles.focuslySpeech} style={{ userSelect: 'none' }}>
        <strong>Focusly AI (Guardian Mode)</strong>
        <p>"Real people make a real nation. Let's verify your soul, Macha!"</p>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TrustShieldVerification = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  // ── Core State ────────────────────────────────────────────────────────────
  const [step, setStep]               = useState(1);
  const [ageGroup, setAgeGroup]       = useState(null);
  const [ocrData, setOcrData]         = useState(null);
  const [identityHash, setIdentityHash] = useState(null); // SHA-256 of ID number
  const [guardianToken, setGuardianToken] = useState(null);
  const [error, setError]             = useState(null);
  const [saving, setSaving]           = useState(false);
  const [isLocked, setIsLocked]       = useState(false);
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
   * handleHardReset — THE LAW
   * ──────────────────────────
   * Called when a user's ID reveals an age or tier mismatch they lied about.
   * Wipes the ENTIRE session: step, ageGroup, OCR data — back to Step 1.
   * No 'Retry Scan' option. They must re-enter from the beginning.
   */
  const handleHardReset = useCallback((reason) => {
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300]);
    localStorage.clear();
    setStep(1);
    setAgeGroup(null);
    setOcrData(null);
    setIdentityHash(null);
    setError(reason || 'Your ID does not match your selected age tier. You have been returned to Step 1.');
    scanner.stopCamera?.();
    // Also stop liveness camera if it was started
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => t.stop());
      liveStreamRef.current = null;
    }
  }, [scanner]);

  const handleSuccessFeedback = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    localStorage.removeItem(FAIL_COUNT_KEY);
  }, []);

  // ── Final verification persist ────────────────────────────────────────────
  const completeVerification = useCallback(async () => {
    setSaving(true);
    try {
      const isTeen = ageGroup === '13-17';
      const verificationStatus = isTeen ? 'PENDING_GUARDIAN' : 'VERIFIED';
      await persistTrustShieldState({
        userId: user.id,
        verificationStatus,
        ocrResult: ocrData,
        faceScore: 1.0,
        attemptResult: 'PASS',
        stage: 'trust_shield_complete',
        reason: null,
      });
      // ── THE DNA: Persist identity_hash to prevent future duplicate registrations
      if (identityHash) {
        await supabase.from('profiles')
          .update({ identity_hash: identityHash })
          .eq('id', user.id);

        // ── THE PRIVACY WIPE: Delete from bucket ──
        const autoCleanup = async () => {
           try {
             const { data: files } = await supabase.storage.from('verification-uploads').list(user.id);
             if (files?.length > 0) {
                 const filePaths = files.map(f => `${user.id}/${f.name}`);
                 await supabase.storage.from('verification-uploads').remove(filePaths);
             }
           } catch(e) { console.error('autoCleanup failed', e); }
        };
        autoCleanup();
      }
      // Refresh session so global profile state picks up immediately
      await supabase.auth.refreshSession();
      if (isTeen) {
        const token = await createGuardianHandshake({
          teenUserId: user.id,
          metadata: { ocrData },
        });
        setGuardianToken(token);

        // Lock post privileges for teen
        await supabase.from('profiles').update({ can_post: false }).eq('id', user.id);

        if (profile?.guardian_email) {
            await supabase.functions.invoke('send-parent-consent-email', {
                body: { parentEmail: profile.guardian_email, childName: user?.user_metadata?.full_name || '', childUserId: user?.id, token }
            });
        }
      }
      setStep(5);
    } catch (err) {
      handleFail('Failed to save verification. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [ageGroup, ocrData, identityHash, user, handleFail]);

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

  // ── STEP 1 Handlers ───────────────────────────────────────────────────────
  const handleAgeConfirm = () => {
    if (!ageGroup || isLocked) return;
    setError(null);
    setStep(2);
    // Auto-start camera scanner
    setTimeout(() => scanner.startCamera(), 300);
  };

  // ── STEP 2: OCR result ready → THE DNA + THE LAW + THE GATEKEEPER ──────────
  useEffect(() => {
    if (scanner.phase !== 'captured' || !scanner.ocrResult) return;
    const result = scanner.ocrResult;
    if (!result.ok) {
      handleFail(result.reason || 'Could not read ID. Please retry.');
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
          const msg = detected === 'unknown' 
            ? 'ERR_INVALID: Could not verify if document is Government or Student ID. Please ensure clarity.'
            : (required === 'adult' ? 'ERR_WRONG_DOCUMENT: Student IDs not accepted for 18+. Use Govt ID.' : 'ERR_WRONG_DOCUMENT: Govt IDs not accepted for Teen tier. Use Student ID.');
          handleFail(msg);
          return;
       }
    }

    // 2. Age Verification Rule Engine
    if (dobValid && age !== null) {
      if (age < 13) {
        handleHardReset('Focus is not available for anyone under 13. You have been returned to Step 1.');
        return;
      }
      if (ageGroup === '18+' && age < 18) {
        handleHardReset('Your government ID confirms you are under 18. You selected the wrong age tier. Please select \'Ages 13–17\'.');
        return;
      }
      if (ageGroup === '13-17' && age >= 18) {
        handleHardReset('Your ID confirms you are 18 or older. Please select the \'Ages 18+\' tier and upload a Government ID.');
        return;
      }
    }

    // ── THE DNA: SHA-256 Identity Deduplication ──────────────────────────
    // Async block — compute hash and check DB without blocking the effect
    const runIdentityCheck = async () => {
      if (result.idNumber) {
        try {
          const hash = await computeIdentityHash(result.idNumber);
          if (hash) {
            // Check if this identity hash is already linked to another account
            const { data: existing } = await supabase
              .from('profiles')
              .select('id')
              .eq('identity_hash', hash)
              .neq('id', user?.id ?? '')  // Don't block own re-verification
              .maybeSingle();

            if (existing) {
              setAccountLocked(true);
              setStaticImageFlag(true);
              cancelAnimationFrame(rafRef.current);
              if (liveStreamRef.current) {
                liveStreamRef.current.getTracks().forEach(t => t.stop());
                liveStreamRef.current = null;
              }
              handleFail('ACCOUNT_ALREADY_EXISTS: Identity already linked to an existing Focus account. Each ID can only be used once.');
              scanner.stopCamera?.();
              return;
            }

            setIdentityHash(hash);
          }
        } catch (_) {
          // Hash check failure is non-fatal — proceed but log
          console.warn('[TrustShield] Identity hash check failed:', _);
        }
      }
      setOcrData(result);
      setError(null);
    };

    runIdentityCheck();
  }, [scanner.phase, scanner.ocrResult, ageGroup, handleFail, handleHardReset, user?.id]);

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
    const newSeq = shuffleChallenges(LIVENESS_CHALLENGE_POOL);
    challengeSequenceRef.current = newSeq;
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
      prevYawRef.current      = null;     // Reset teleport tracker
      prevFaceCenterRef.current = null;
      teleportCountRef.current = 0;       // Reset injection counter
      setLivenessPhase(0);
      setLivenessComplete([false, false, false]);
      setStaticImageFlag(false);
      // Show the RANDOMIZED first challenge
      setLivenessStatus(`Challenge 1: ${newSeq[0]?.label ?? 'Hold steady'}`);
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

        // ── TELEPORT INJECTION DETECTION ──────────────────────────────
        // A real face moving naturally cannot jump >30% of frame width in one frame.
        // A photoswap or virtual-camera injection will 'teleport' instantly.
        if (prevYawRef.current !== null && prevFaceCenterRef.current !== null) {
          const prevPos = prevFaceCenterRef.current;
          const deltaX = Math.abs(faceCenterX - prevPos.x) / (liveVideoRef.current.videoWidth || 640);
          const deltaY = Math.abs(faceCenterY - prevPos.y) / (liveVideoRef.current.videoHeight || 480);
          const deltaYaw = Math.abs(yaw - prevYawRef.current);

          if (deltaX > 0.30 || deltaY > 0.30 || deltaYaw > 0.30) {
            teleportCountRef.current += 1;
            if (teleportCountRef.current >= 2) {
              // ── HARD LOCK — LOCKED_INJECTION ──────────────────────
              cancelAnimationFrame(rafRef.current);
              if (liveStreamRef.current) {
                liveStreamRef.current.getTracks().forEach(t => t.stop());
                liveStreamRef.current = null;
              }
              setLivenessStatus('🚨 ACCOUNT LOCKED: Static injection attack detected. This incident has been reported.');
              setAccountLocked(true);
              setStaticImageFlag(true);
              // Persist LOCKED_INJECTION to database — no mercy
              try {
                await supabase.from('profiles').update({
                  verification_status: 'LOCKED_INJECTION',
                  trust_shield_status: 'LOCKED_INJECTION',
                }).eq('id', user?.id ?? '');
              } catch (lockErr) {
                console.error('[TrustShield] Failed to lock account:', lockErr);
              }
              return; // Halt the detection loop permanently
            }
            setLivenessStatus(`⚠️ Suspicious movement detected. Final warning. (${teleportCountRef.current}/2)`);
          }
        }
        prevYawRef.current = yaw;
        prevFaceCenterRef.current = { x: faceCenterX, y: faceCenterY };

        yawHistoryRef.current.push(yaw);
        if (yawHistoryRef.current.length > 30) yawHistoryRef.current.shift();

        // ── Use RANDOMIZED challengeSequence ──────────────────────────
        setLivenessPhase(prev => {
          const currentChallenge = challengeSequenceRef.current[prev];
          if (!currentChallenge || prev >= 3) return prev;

          // ── CHALLENGE: BLINK ───────────────────────────────────────
          if (currentChallenge.id === 'blink') {
            const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2.0;

            if (baselineEARRef.current === null) {
              earBufferRef.current.push(ear);
              if (earBufferRef.current.length >= 12) {
                baselineEARRef.current = earBufferRef.current.reduce((a, b) => a + b, 0) / earBufferRef.current.length;
                earBufferRef.current = [];
                setLivenessStatus('Baseline set. Blink rapidly 3× 👁️');
              }
              return prev;
            }

            earBufferRef.current.push(ear);
            if (earBufferRef.current.length > 3) earBufferRef.current.shift();
            const rollingAvg = earBufferRef.current.reduce((a, b) => a + b, 0) / earBufferRef.current.length;

            if (rollingAvg < baselineEARRef.current * 0.60) {
              blinkCountRef.current += 1;
              setLivenessStatus(`Blink ${blinkCountRef.current}/3 detected ✓`);
              earBufferRef.current = [];
              if (blinkCountRef.current >= 3) {
                if (navigator?.vibrate) navigator.vibrate(80);
                setLivenessComplete(p => { const n=[...p]; n[prev]=true; return n; });
                const next = prev + 1;
                const nextCh = challengeSequenceRef.current[next];
                setLivenessStatus(nextCh ? `✅ Complete! Next: ${nextCh.label}` : '✅ All challenges passed!');
                if (!nextCh) { cancelAnimationFrame(rafRef.current); stopLivenessCamera(); setTimeout(() => setStep(s => s + 1), 800); }
                return next;
              }
            }
            return prev;
          }

          // ── CHALLENGE: LOOK LEFT ───────────────────────────────────
          if (currentChallenge.id === 'turn_left') {
            const yawRange = yawHistoryRef.current.length > 5
              ? Math.max(...yawHistoryRef.current) - Math.min(...yawHistoryRef.current)
              : 0;

            // Secondary static-frame check (yaw never changes)
            if (yawHistoryRef.current.length >= 25 && yawRange < 0.03) {
              setStaticImageFlag(true);
              setLivenessStatus('🚨 Static Image Detected — you must be physically present');
              return prev;
            }

            const recentYaw = yawHistoryRef.current.slice(-5);
            const avgRecentYaw = recentYaw.reduce((a, b) => a + b, 0) / recentYaw.length;

            if (avgRecentYaw < -0.10) {
              if (navigator?.vibrate) navigator.vibrate(80);
              setLivenessComplete(p => { const n=[...p]; n[prev]=true; return n; });
              yawHistoryRef.current = [];
              const next = prev + 1;
              const nextCh = challengeSequenceRef.current[next];
              setLivenessStatus(nextCh ? `✅ Complete! Next: ${nextCh.label}` : '✅ All challenges passed!');
              if (!nextCh) { cancelAnimationFrame(rafRef.current); stopLivenessCamera(); setTimeout(() => setStep(s => s + 1), 800); }
              return next;
            }
            return prev;
          }

          // ── CHALLENGE: SMILE ───────────────────────────────────────
          if (currentChallenge.id === 'smile') {
            if (expressions.happy > 0.40) {
              if (navigator?.vibrate) navigator.vibrate([100, 50, 100]);
              setLivenessComplete(p => { const n=[...p]; n[prev]=true; return n; });
              const next = prev + 1;
              const nextCh = challengeSequenceRef.current[next];
              setLivenessStatus(nextCh ? `✅ Complete! Next: ${nextCh.label}` : '✅ All challenges passed!');
              cancelAnimationFrame(rafRef.current);
              stopLivenessCamera();
              setTimeout(() => setStep(s => s + 1), 800);
              return next;
            }
            return prev;
          }

          return prev;
        });
      } catch (_) {}
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div 
        className={styles.container} 
        style={(step === 3 && livenessLuminance < 0.3 && !accountLocked) ? { backgroundColor: '#FFFFFF', transition: 'background-color 0.3s ease' } : { transition: 'background-color 0.3s ease' }}
      >
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>← Back</button>
          <h1
            className={styles.title}
            onDoubleClick={() => {
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

        {renderProgress()}

        <div className={styles.content}>
          <FocuslyLion onSecretBypass={handleFounderBypass} />

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
                Hold your ID card inside the frame. The AI will auto-capture when it's sharp and well-lit.
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

              {/* OCR Results */}
              {scanner.phase === 'captured' && ocrData && (
                <div className={styles.ocrResults}>
                  <h3>📋 Extracted Identity Data</h3>
                  {ocrData.name     && <div className={styles.ocrField}><span>Name</span><strong>{ocrData.name}</strong></div>}
                  {ocrData.dob      && <div className={styles.ocrField}><span>Date of Birth</span><strong>{ocrData.dob}</strong></div>}
                  {ocrData.idNumber && <div className={styles.ocrField}><span>ID Number</span><strong>XXXX XXXX {ocrData.idNumber.slice(-4)}</strong></div>}
                  <div className={styles.ocrField}><span>Confidence</span><strong>{Math.round(ocrData.confidence * 100)}%</strong></div>
                </div>
              )}

              {(error || scanner.phase === 'error') && (
                <div className={`${styles.errorBox} ${styles.glassErrorToast}`}>
                  <p>{error || scanner.statusMessage}</p>
                  <button className={styles.retryBtn} onClick={scanner.retry}>↺ Retry Scan</button>
                </div>
              )}

              {ocrData && !error && scanner.phase === 'captured' && (
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
                {challengeSequence.map((ch, i) => (
                  <div key={ch.id} className={`${styles.challengeChip} ${
                    livenessComplete[i] ? styles.challengeDone :
                    livenessPhase === i ? styles.challengeActive :
                    styles.challengePending
                  }`}>
                    {livenessComplete[i] ? '✓ ' : `${i+1}. `}{ch.label}
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

              {/* Skip to mobile bridge if camera is unavailable */}
              <button className={styles.secondaryBtn} onClick={() => setStep(4)} style={{ marginTop: 8 }}>
                📱 Use Phone Instead
              </button>
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
                      <p className={styles.guardianLabel}>Send this approval link to your guardian:</p>
                      <div className={styles.guardianLink}>
                        {`${window.location.origin}/verification/parent-consent?token=${guardianToken}`}
                      </div>
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => navigator.clipboard.writeText(
                          `${window.location.origin}/verification/parent-consent?token=${guardianToken}`
                        )}
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
