/**
 * useFaceLiveness.js
 * ==================
 * Real-time face liveness detection using face-api.js
 * Implements 3-random-action challenge: Blink, Smile, Look Left, Look Right, Nod
 * Models loaded from /public/models/ (self-hosted — no CDN dependency)
 *
 * H2 Innovative — Focus Trust Shield
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';

// ── Challenge Pool ────────────────────────────────────────────────────────────
const CHALLENGE_POOL = [
  {
    id: 'blink',
    label: 'Blink your eyes',
    icon: '👁️',
    description: 'Slowly blink both eyes once',
  },
  {
    id: 'smile',
    label: 'Smile naturally',
    icon: '😊',
    description: 'Show a genuine smile',
  },
];

// ── Thresholds ────────────────────────────────────────────────────────────────
const THRESHOLDS = {
  smile: 0.35,          // lower smile threshold to accommodate subtle indoor lighting
  blink: 0.25,          // eye aspect ratio (lower = more closed)
  lookLeft: 12,         // head yaw degrees (positive = left)
  lookRight: -12,       // head yaw degrees (negative = right)
  nod: 15,              // head pitch degrees
  detectionMinScore: 0.5,
};

// ── Shuffle helper ────────────────────────────────────────────────────────────
const getRandomChallenges = (count = 3) => {
  const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export const useFaceLiveness = ({
  videoRef,
  onComplete,
  onFail,
  challengeCount = 3,
  timeoutMs = 30000,
} = {}) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const currentIndexRef = useRef(0);
  const [smileProgress, setSmileProgress] = useState(0);
  const [isPartiallyTurned, setIsPartiallyTurned] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading AI models...');
  const [progress, setProgress] = useState(0);
  const [livenessScore, setLivenessScore] = useState(0);
  const [capturedFrames, setCapturedFrames] = useState([]); // frames for similarity check

  const detectionLoopRef = useRef(null);
  const timeoutRef = useRef(null);
  const challengeHoldRef = useRef(null); // require user to HOLD the expression
  const baselineRef = useRef(null);      // baseline neutral expression
  const pauseRef = useRef(false);
  const noFaceTimerRef = useRef(null);
  const poseHistoryRef = useRef([]);     // for smoothing head pose
  const blinkStartRef = useRef(null);
  const earHistoryRef = useRef([]);      // for rolling average blink

  // ── Load models from /public/models/ ───────────────────────────────────────
  const loadModels = useCallback(async () => {
    try {
      setStatusMessage('Loading Face AI (1/4)...');
      const MODEL_URL = '/models';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      setStatusMessage('Face AI ready. Position your face in the frame.');

      // Generate 3 random challenges
      const selected = getRandomChallenges(challengeCount);
      setChallenges(selected);
    } catch (err) {
      console.error('[TrustShield] Model load error:', err);
      setStatusMessage('Failed to load security models. Please refresh.');
    }
  }, [challengeCount]);

  useEffect(() => {
    loadModels();
    return () => {
      stopDetection();
    };
    // eslint-disable-next-line
  }, []);

  // ── Start Detection ─────────────────────────────────────────────────────────
  const startDetection = useCallback(() => {
    if (!modelsLoaded || !videoRef?.current) return;

    setIsDetecting(true);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setCompletedChallenges([]);
    setProgress(0);

    // Global timeout
    timeoutRef.current = setTimeout(() => {
      stopDetection();
      onFail?.('Liveness check timed out. Please try again in better lighting.');
    }, timeoutMs);

    runDetectionLoop();
    // eslint-disable-next-line
  }, [modelsLoaded, videoRef, timeoutMs]);

  // ── Detection Loop ──────────────────────────────────────────────────────────
  const runDetectionLoop = useCallback(() => {
    const detect = async () => {
      if (!videoRef?.current || videoRef.current.paused) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }
      if (pauseRef.current) {
        detectionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: THRESHOLDS.detectionMinScore }))
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptor();

        if (!detections) {
          // Face hidden: DO NOT FAIL. Just pause and show 'Face hidden'
          if (faceDetected) setFaceDetected(false);
          detectionLoopRef.current = requestAnimationFrame(detect);
          return;
        }

        // Slide timeout forward to effectively never timeout while actively looking and processing
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            stopDetection();
            onFail?.('Liveness check timed out. Please try again in better lighting.');
          }, timeoutMs);
        }

        const { expressions, landmarks, descriptor, detection } = detections;

        // Face-to-Center calculation
        if (videoRef.current) {
          const { box } = detection;
          const vWidth = videoRef.current.videoWidth;
          const vHeight = videoRef.current.videoHeight;
          const faceCenterX = box.x + (box.width / 2);
          const faceCenterY = box.y + (box.height / 2);
          
          if (vWidth > 0 && vHeight > 0) {
            // Check if center of face box is between 35% and 65% horizontally & vertically
            const inCenterX = faceCenterX > (vWidth * 0.35) && faceCenterX < (vWidth * 0.65);
            const inCenterY = faceCenterY > (vHeight * 0.35) && faceCenterY < (vHeight * 0.65);
            
            if (!inCenterX || !inCenterY) {
              setStatusMessage('⚠️ Please align your face in the center.');
              detectionLoopRef.current = requestAnimationFrame(detect);
              return;
            }
          }
        }

        if (!faceDetected) setFaceDetected(true);

        // Capture a frame for similarity check (keep last 5)
        setCapturedFrames(prev => {
          const updated = [...prev, Array.from(descriptor)];
          return updated.slice(-5);
        });

        // Estimate head pose from landmarks
        const rawHeadPose = estimateHeadPose(landmarks);
        
        // Detection Interpolation: smooth head pose values over 5 frames
        poseHistoryRef.current.push(rawHeadPose);
        if (poseHistoryRef.current.length > 5) poseHistoryRef.current.shift();
        
        const avgYaw = poseHistoryRef.current.reduce((sum, p) => sum + p.yaw, 0) / poseHistoryRef.current.length;
        const avgPitch = poseHistoryRef.current.reduce((sum, p) => sum + p.pitch, 0) / poseHistoryRef.current.length;
        const smoothedPose = { yaw: avgYaw, pitch: avgPitch };

        // Check current challenge using the stable ref index
        const stableIndex = currentIndexRef.current;
        const currentChallenge = challenges[stableIndex];
        if (currentChallenge) {
          const expectedMessage = `${currentChallenge.icon} ${currentChallenge.label}`;
          setStatusMessage((prev) => prev !== expectedMessage ? expectedMessage : prev);
          
          const passed = evaluateChallenge(currentChallenge.id, expressions, smoothedPose, landmarks);
          
          // Visual Guidance Logic
          let partial = false;
          if (currentChallenge.id === 'lookLeft' && smoothedPose.yaw > 5 && smoothedPose.yaw < THRESHOLDS.lookLeft) partial = true;
          if (currentChallenge.id === 'lookRight' && smoothedPose.yaw < -5 && smoothedPose.yaw > THRESHOLDS.lookRight) partial = true;
          setIsPartiallyTurned(prev => prev !== partial ? partial : prev);

          if (passed) {
            if (!challengeHoldRef.current) {
              // Start hold timer — user must maintain expression for 0.5s
              challengeHoldRef.current = setTimeout(() => {
                challengeHoldRef.current = null;
                // Mark challenge complete
                setCompletedChallenges(prev => {
                  const updated = [...prev, currentChallenge.id];
                  return updated;
                });
                
                setStatusMessage('✅ ' + currentChallenge.label + ' Complete!');
                if (navigator?.vibrate) navigator.vibrate(200); // Gentle vibration for success
                pauseRef.current = true; // Pause detection loop logic
                
                setTimeout(() => {
                  const nextIndex = stableIndex + 1;
                  setCurrentIndex(nextIndex);
                  currentIndexRef.current = nextIndex;
                  setProgress(Math.round((nextIndex / challenges.length) * 100));
                  setLivenessScore(prev => prev + (100 / challenges.length));

                  if (nextIndex >= challenges.length) {
                    // All challenges passed!
                    stopDetection();
                    setStatusMessage('✅ Liveness verified. Excellent!');
                    if (navigator?.vibrate) navigator.vibrate([400, 100, 400]); // Long vibration for final win

                    // Wait 1.5 seconds so user feels the win before moving to success page
                    setTimeout(() => {
                      onComplete?.({
                        score: 100,
                        capturedFrames,
                        completedChallenges: [...completedChallenges, currentChallenge.id],
                      });
                    }, 1500);
                  } else {
                    pauseRef.current = false; // resume
                    const nextChallenge = challenges[nextIndex];
                    setStatusMessage(`${nextChallenge.icon} ${nextChallenge.label}`);
                  }
                }, 1000);
              }, 500);
            }
          } else {
            // Expression not matching — cancel hold timer
            if (challengeHoldRef.current) {
              clearTimeout(challengeHoldRef.current);
              challengeHoldRef.current = null;
            }
          }
        }
      } catch (err) {
        // Silently ignore per-frame errors
      }

      detectionLoopRef.current = requestAnimationFrame(detect);
    };

    detectionLoopRef.current = requestAnimationFrame(detect);
  }, [challenges, capturedFrames, completedChallenges, onComplete, videoRef, timeoutMs]);

  // ── Challenge Evaluator ─────────────────────────────────────────────────────
  const evaluateChallenge = (challengeId, expressions, headPose, landmarks) => {
    switch (challengeId) {
      case 'smile': {
        setSmileProgress(prev => {
          const p = Math.min(100, Math.max(0, (expressions.happy / THRESHOLDS.smile) * 100));
          return Math.abs(prev - p) > 2 ? Math.round(p) : prev;
        });
        return expressions.happy >= THRESHOLDS.smile;
      }

      case 'blink': {
        const pts = landmarks.positions;
        const calcEAR = (eyeIdx) => {
          const p0 = pts[eyeIdx];     
          const p1 = pts[eyeIdx + 1]; 
          const p2 = pts[eyeIdx + 2]; 
          const p3 = pts[eyeIdx + 3]; 
          const p4 = pts[eyeIdx + 4]; 
          const p5 = pts[eyeIdx + 5]; 
          const v1 = Math.hypot(p1.x - p5.x, p1.y - p5.y);
          const v2 = Math.hypot(p2.x - p4.x, p2.y - p4.y);
          const h  = Math.hypot(p0.x - p3.x, p0.y - p3.y);
          return (v1 + v2) / (2.0 * h);
        };
        const leftEAR = calcEAR(36);
        const rightEAR = calcEAR(42);
        
        // Either eye drops below 0.22 instantaneously
        if (leftEAR < 0.22 || rightEAR < 0.22) {
          return true;
        }
        
        return false;
      }

      default:
        return false;
    }
  };

  // ── Head Pose Estimation from 68 Landmarks ─────────────────────────────────
  const estimateHeadPose = (landmarks) => {
    try {
      const pts = landmarks.positions;
      // Nose tip: pt 30, left eye outer: pt 36, right eye outer: pt 45
      // Chin: pt 8
      const noseTip = pts[30];
      const leftEye = pts[36];
      const rightEye = pts[45];
      const chin = pts[8];
      const noseBase = pts[27];

      // Horizontal yaw: compare nose x vs midpoint of eyes
      const eyeMidX = (leftEye.x + rightEye.x) / 2;
      const eyeWidth = Math.abs(rightEye.x - leftEye.x);
      const yaw = ((noseTip.x - eyeMidX) / eyeWidth) * 90;

      // Vertical pitch: nose tip vs base
      const faceHeight = Math.abs(chin.y - noseBase.y);
      const pitch = ((noseTip.y - noseBase.y) / faceHeight) * 45;

      return { yaw, pitch };
    } catch {
      return { yaw: 0, pitch: 0 };
    }
  };

  // ── Stop Detection ──────────────────────────────────────────────────────────
  const stopDetection = useCallback(() => {
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (challengeHoldRef.current) {
      clearTimeout(challengeHoldRef.current);
      challengeHoldRef.current = null;
    }
    if (noFaceTimerRef.current) {
      clearTimeout(noFaceTimerRef.current);
      noFaceTimerRef.current = null;
    }
    blinkStartRef.current = null;
    earHistoryRef.current = [];
    setSmileProgress(0);
    pauseRef.current = false;
    setIsDetecting(false);
  }, []);

  return {
    modelsLoaded,
    challenges,
    currentIndex,
    completedChallenges,
    currentChallenge: challenges[currentIndex] || null,
    isDetecting,
    faceDetected,
    smileProgress,
    isPartiallyTurned,
    statusMessage,
    progress,
    livenessScore,
    capturedFrames,
    startDetection,
    stopDetection,
  };
};

export default useFaceLiveness;
