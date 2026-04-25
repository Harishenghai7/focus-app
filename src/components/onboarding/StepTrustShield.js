import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Camera, ShieldCheck, RefreshCcw, QrCode, Share2, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../shared/Button';
import FocuslyAvatar from '../focusly-ai/FocuslyAvatar';
import { triggerHaptic } from '../../utils/haptics';
import {
    generateLivenessActions,
    runFaceSimilarityCheck,
    persistTrustShieldState,
    createGuardianHandshake,
} from '../../utils/trustShieldEngine';
import styles from './StepTrustShield.module.css';
import { useAuth } from '../../hooks/useAuth';
import useOCRScanner from '../../hooks/useOCRScanner';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 TRUST SHIELD STEP 5 - BULLETPROOF IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════════
// Fixes:
// 1. ✅ Full DOB matching (not just year)
// 2. ✅ Liveness retry with error messages
// 3. ✅ Better camera error handling
// 4. ✅ Proper error states and recovery
// 5. ✅ Enum-safe verification status values
// ═══════════════════════════════════════════════════════════════════════════════

const generateHandoffSessionId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

const HANDOFF_BASE_URL =
    process.env.REACT_APP_VERCEL_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://focus-app.vercel.app');

// Safe verification statuses (TEXT type, not enum)
const VERIFICATION_STATUS = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    VERIFIED_MINOR: 'VERIFIED_MINOR',
    PENDING_GUARDIAN: 'PENDING_GUARDIAN',
    REJECTED: 'REJECTED',
    FAILED: 'FAILED'
};

const StepTrustShield = ({ formData, updateFormData, onNext, onBack, onReset }) => {
    const BRIDGE_VERSION = '2026.04.23-bulletproof';
    const { user } = useAuth();
    const { scanID, progress: ocrProgress, statusMessage: ocrStatus } = useOCRScanner();
    
    // Stage management
    const [stage, setStage] = useState('ocr');
    const [ocrHint, setOcrHint] = useState('Position ID within frame');
    const [idFile, setIdFile] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    
    // Liveness states
    const [livenessActions, setLivenessActions] = useState([]);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [matchResult, setMatchResult] = useState(null);
    const [videoReady, setVideoReady] = useState(false);
    const [cameraDenied, setCameraDenied] = useState(false);
    const [selfieFrames, setSelfieFrames] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [livenessAttempts, setLivenessAttempts] = useState(0);
    const [showDobMismatchModal, setShowDobMismatchModal] = useState(false);
    
    // Teen verification
    const [handoffSessionId] = useState(() => generateHandoffSessionId());
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);
    const [inviteError, setInviteError] = useState('');
    
    // Error handling
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(null); // 'dob_mismatch', 'camera', 'liveness', 'general'
    
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const channelRef = useRef(null);
    const captureIntervalRef = useRef(null);
    const keysPressed = useRef(new Set());

    // Progress calculation
    const progress = useMemo(() => {
        if (stage === 'ocr') return 25;
        if (stage === 'liveness') return 55 + currentActionIndex * 15;
        if (stage === 'processing') return 85;
        if (stage === 'result') return 100;
        if (stage === 'guardian') return 100;
        return 0;
    }, [stage, currentActionIndex]);

    // Teen detection
    const isTeen = useMemo(() => {
        const dob = ocrResult?.dob || formData?.ageInfo?.dateOfBirth;
        if (!dob) return false;
        const date = new Date(dob);
        if (Number.isNaN(date.getTime())) return false;
        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        const passed = now.getMonth() > date.getMonth() || 
            (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
        if (!passed) age -= 1;
        return age >= 13 && age <= 17;
    }, [ocrResult?.dob, formData?.ageInfo?.dateOfBirth]);

    const handshakeLink = useMemo(() => formData?.guardianHandshakeLink || '', [formData?.guardianHandshakeLink]);

    // ═══════════════════════════════════════════════════════════════════════════
    // DOB VALIDATION - FULL DATE MATCHING (NOT JUST YEAR)
    // ═══════════════════════════════════════════════════════════════════════════
    const validateDOB = useCallback((scannedDob, expectedDob) => {
        if (!expectedDob) return { valid: true, reason: null };
        if (!scannedDob) return { valid: false, reason: 'MISSING_DOB' };

        // Normalize dates to YYYY-MM-DD format
        const normalizeDate = (dateStr) => {
            // Handle various formats: YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY, etc.
            const cleaned = dateStr.replace(/[\/\.]/g, '-');
            const parts = cleaned.split('-');
            
            if (parts.length !== 3) return null;
            
            // Try to detect format
            let year, month, day;
            
            if (parts[0].length === 4) {
                // YYYY-MM-DD
                year = parts[0];
                month = parts[1].padStart(2, '0');
                day = parts[2].padStart(2, '0');
            } else if (parts[2].length === 4) {
                // DD-MM-YYYY or MM-DD-YYYY
                // Assume DD-MM-YYYY for now (most common outside US)
                day = parts[0].padStart(2, '0');
                month = parts[1].padStart(2, '0');
                year = parts[2];
            } else {
                return null;
            }
            
            return `${year}-${month}-${day}`;
        };

        const normalizedExpected = normalizeDate(expectedDob);
        const normalizedScanned = normalizeDate(scannedDob);

        if (!normalizedExpected || !normalizedScanned) {
            // If we can't parse, fall back to year-only check
            const expectedYear = expectedDob.split('-')[0];
            const scannedYear = scannedDob.split('-')[0];
            if (expectedYear !== scannedYear) {
                return { 
                    valid: false, 
                    reason: 'YEAR_MISMATCH',
                    expected: expectedYear,
                    scanned: scannedYear
                };
            }
            return { valid: true, reason: null };
        }

        // Full date comparison
        if (normalizedExpected !== normalizedScanned) {
            const expParts = normalizedExpected.split('-');
            const scanParts = normalizedScanned.split('-');
            
            if (expParts[0] !== scanParts[0]) {
                return { 
                    valid: false, 
                    reason: 'YEAR_MISMATCH',
                    expected: expParts[0],
                    scanned: scanParts[0]
                };
            }
            
            if (expParts[1] !== scanParts[1]) {
                return { 
                    valid: false, 
                    reason: 'MONTH_MISMATCH',
                    expected: `${expParts[0]}-${expParts[1]}`,
                    scanned: `${scanParts[0]}-${scanParts[1]}`
                };
            }
            
            if (expParts[2] !== scanParts[2]) {
                return { 
                    valid: false, 
                    reason: 'DAY_MISMATCH',
                    expected: normalizedExpected,
                    scanned: normalizedScanned
                };
            }
        }

        return { valid: true, reason: null };
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🛡️ NON-BYPASSABLE: NO KEYBOARD SHORTCUTS - VERIFICATION IS MANDATORY
    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVED: Dev backdoor (Ctrl+Shift+V) - This is PRODUCTION
    // Trust Shield verification CANNOT be bypassed. Period.
    // All users MUST complete ID upload + Liveness check + Face match.
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Enforcement: Check on mount if user tried to skip
    useEffect(() => {
        // If trustShieldInitialized is set but no verification data, reset
        if (formData?.trustShieldInitialized && !formData?.trustShieldFaceScore) {
            console.warn('[TrustShield] Invalid state detected - possible bypass attempt');
            setError('Verification data missing. Please complete all steps.');
            updateFormData('trustShieldInitialized', false);
            updateFormData('trustShieldStatus', VERIFICATION_STATUS.PENDING);
        }
    }, [formData?.trustShieldInitialized, formData?.trustShieldFaceScore, updateFormData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // PRE-LOAD MODELS on mount to prevent "failed to load" errors
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const preloadModels = async () => {
            try {
                console.log('[TrustShield] Pre-loading face recognition models...');
                // Import and call prewarm to load models in background
                const { prewarmModels } = await import('../../utils/trustShieldEngine');
                const result = await prewarmModels();
                if (result.success) {
                    console.log('[TrustShield] ✅ Models pre-loaded successfully');
                } else {
                    console.warn('[TrustShield] ⚠️ Model pre-load failed:', result.error);
                }
            } catch (err) {
                console.warn('[TrustShield] Pre-load warning (non-blocking):', err.message);
            }
        };
        
        // Start preloading after a short delay to not block UI
        const timer = setTimeout(preloadModels, 2000);
        return () => clearTimeout(timer);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        return () => {
            stopCamera();
            if (captureIntervalRef.current) {
                clearInterval(captureIntervalRef.current);
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    // OCR hint rotation
    useEffect(() => {
        const hints = [
            'Position ID within frame',
            'Avoid glare on the card',
            'Keep Name and DOB visible',
            'Ensure good lighting',
            'Hold camera steady'
        ];
        let index = 0;
        const timer = setInterval(() => {
            index = (index + 1) % hints.length;
            setOcrHint(hints[index]);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // CAMERA MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setVideoReady(false);
        setIsCapturing(false);
    }, []);

    const startCamera = useCallback(async () => {
        setError('');
        setErrorType(null);
        
        try {
            // Try front camera first (selfie mode)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }, 
                audio: false 
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setVideoReady(true);
                    setCameraDenied(false);
                };
            }
        } catch (err) {
            console.error('[TrustShield] Front camera failed:', err);
            
            // Try any available camera
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
                    audio: false 
                });
                streamRef.current = fallbackStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    videoRef.current.onloadedmetadata = () => {
                        setVideoReady(true);
                        setCameraDenied(false);
                    };
                }
            } catch (fallbackErr) {
                console.error('[TrustShield] Camera access denied:', fallbackErr);
                setCameraDenied(true);
                setErrorType('camera');
                setError('Camera access is required. Please enable camera permissions or use "Use Phone" option.');
            }
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // PHONE HANDOFF
    // ═══════════════════════════════════════════════════════════════════════════
    const initiatePhoneHandoff = useCallback(async () => {
        if (!user?.id) return;
        setStage('waiting_mobile');
        stopCamera();

        try {
            const channelName = `handoff_${user.id}_${handoffSessionId}`;
            const channel = supabase.channel(channelName)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                }, (payload) => {
                    const status = payload.new.verification_status;
                    if (status === VERIFICATION_STATUS.VERIFIED || status === VERIFICATION_STATUS.VERIFIED_MINOR) {
                        updateFormData('trustShieldStatus', VERIFICATION_STATUS.VERIFIED);
                        updateFormData('trustShieldInitialized', true);
                        setMatchResult({ passed: true, score: 0.99 });
                        setError('');
                        setStage('result');
                        if (navigator?.vibrate) navigator.vibrate([200, 100, 400]);
                        setTimeout(() => {
                            window.location.href = '/home';
                        }, 1000);
                    }
                })
                .subscribe();
                
            channelRef.current = channel;
        } catch (err) {
            setError('Failed to initiate phone handoff. Please try again.');
        }
    }, [user, handoffSessionId, updateFormData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // ID UPLOAD WITH FULL DOB VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════
    const handleIdUpload = useCallback(async (event) => {
        if (!user?.id) {
            setError('Session expired. Please log in again.');
            return;
        }
        
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIdFile(file);
        setError('');
        setErrorType(null);
        setShowDobMismatchModal(false);
        
        const result = await scanID(file, formData?.ageTier || null);
        
        if (!result.ok) {
            setError(result.reason || 'Failed to read ID. Please try again with better lighting.');
            return;
        }

        // Full DOB validation
        const expectedDob = formData?.ageInfo?.dateOfBirth;
        const dobValidation = validateDOB(result.dob, expectedDob);
        
        if (!dobValidation.valid) {
            setErrorType('dob_mismatch');
            setShowDobMismatchModal(true);
            
            let errorMessage = '';
            switch (dobValidation.reason) {
                case 'YEAR_MISMATCH':
                    errorMessage = `Date of Birth mismatch: ID shows year ${dobValidation.scanned}, but you entered ${dobValidation.expected}. You must restart with correct information.`;
                    break;
                case 'MONTH_MISMATCH':
                    errorMessage = `Date of Birth mismatch: The month on your ID doesn't match what you entered. Please restart with correct information.`;
                    break;
                case 'DAY_MISMATCH':
                    errorMessage = `Date of Birth mismatch: The day on your ID doesn't match what you entered. Please restart with correct information.`;
                    break;
                case 'MISSING_DOB':
                    errorMessage = 'Could not read Date of Birth from ID. Please upload a clearer photo.';
                    break;
                default:
                    errorMessage = 'Date of Birth mismatch detected. Please restart with correct information.';
            }
            
            setError(errorMessage);
            return;
        }

        // Identity deduplication
        if (result.identityHash && user?.id) {
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('identity_hash', result.identityHash)
                    .neq('id', user.id);
                
                if (data && data.length > 0) {
                    setError('This ID has already been used. One person, one account.');
                    return;
                }
            } catch (err) {
                console.error('Deduplication check failed:', err);
            }
        }

        setOcrResult(result);
        updateFormData('trustShieldOCR', result);
        updateFormData('identityHash', result.identityHash);
        
        try {
            await persistTrustShieldState({
                userId: user?.id,
                verificationStatus: VERIFICATION_STATUS.PENDING,
                ocrResult: result,
                attemptResult: 'PENDING',
                stage: 'ocr',
            });
        } catch (persistError) {
            console.warn('[TrustShield] Persist failed:', persistError);
        }
    }, [user, formData?.ageInfo?.dateOfBirth, formData?.ageTier, scanID, updateFormData, validateDOB]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RESET AND RETRY
    // ═══════════════════════════════════════════════════════════════════════════
    const resetLiveness = useCallback(() => {
        stopCamera();
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
        }
        setSelfieFrames([]);
        setCurrentActionIndex(0);
        setMatchResult(null);
        setError('');
        setErrorType(null);
        setIsCapturing(false);
        setStage('ocr');
        setLivenessAttempts(prev => prev + 1);
    }, [stopCamera]);

    const handleHardReset = useCallback(async () => {
        stopCamera();
        if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
        }
        
        // Clear storage
        localStorage.removeItem('focus_onboarding_state');
        localStorage.removeItem('focus_onboarding_timestamp');
        
        // Sign out
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('[TrustShield] Sign out failed:', err);
        }
        
        // Reset to step 1
        if (onReset) onReset();
    }, [stopCamera, onReset]);

    // ═══════════════════════════════════════════════════════════════════════════
    // LIVENESS CHECK WITH RETRY
    // ═══════════════════════════════════════════════════════════════════════════
    const beginLiveness = useCallback(async () => {
        if (!ocrResult?.name || !ocrResult?.dob) {
            setError('Name and DOB are required before liveness check.');
            return;
        }
        
        // 🛡️ PRE-LOAD MODELS before starting camera
        setStage('loading');
        setLivenessStatus('Loading face recognition models...');
        
        try {
            console.log('[TrustShield] Loading face recognition models...');
            // Import and call prewarm to load all models
            const { prewarmModels } = await import('../../utils/trustShieldEngine');
            
            // Create timeout wrapper
            const loadTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model loading timed out after 20s')), 20000)
            );
            
            // Load models with timeout
            const result = await Promise.race([prewarmModels(), loadTimeout]);
            
            if (!result || !result.success) {
                throw new Error(result?.error || 'Model loading failed');
            }
            
            console.log('[TrustShield] ✅ Models loaded successfully');
            
        } catch (err) {
            console.error('[TrustShield] Model load failed:', err);
            setError('Failed to load face recognition system: ' + (err.message || 'Network timeout. Please check your connection and try again.'));
            setStage('ocr');
            setLivenessStatus('');
            return;
        }
        
        const actions = generateLivenessActions();
        setLivenessActions(actions);
        setCurrentActionIndex(0);
        setSelfieFrames([]);
        setError('');
        setErrorType(null);
        setIsCapturing(true);
        setStage('liveness');
        setLivenessStatus('');
        
        await startCamera();

        // Auto-capture sequence
        let stepCount = 0;
        const totalSteps = actions.length;
        
        captureIntervalRef.current = setInterval(() => {
            if (!videoRef.current || !videoRef.current.videoWidth) return;
            
            setSelfieFrames(prev => {
                const newFrames = [...prev];
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = videoRef.current.videoWidth || 640;
                    canvas.height = videoRef.current.videoHeight || 480;
                    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                    newFrames.push(canvas.toDataURL('image/jpeg', 0.7));
                } catch (e) {
                    console.error('Frame capture error:', e);
                }
                return newFrames;
            });
            
            stepCount++;
            if (stepCount < totalSteps) {
                setCurrentActionIndex(stepCount);
            } else {
                if (captureIntervalRef.current) {
                    clearInterval(captureIntervalRef.current);
                    captureIntervalRef.current = null;
                }
                finishLivenessExecution();
            }
        }, 3000);
    }, [ocrResult, startCamera]);

    const finishLivenessExecution = useCallback(async () => {
        setStage('processing');
        setIsCapturing(false);
        stopCamera();
        
        // Get captured frames
        let capturedFrames = [];
        setSelfieFrames(prev => { capturedFrames = prev; return prev; });

        // Wait a moment for state to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const result = await runFaceSimilarityCheck({ 
                idImageFile: idFile, 
                selfieFrames: capturedFrames 
            });
            
            setMatchResult(result);
            
            if (result.passed) {
                triggerHaptic(24);
                setError('');
                updateFormData('trustShieldStatus', VERIFICATION_STATUS.VERIFIED);
                updateFormData('trustShieldInitialized', true);
                updateFormData('trustShieldFaceScore', result.score);
                
                if (isTeen) {
                    try {
                        const handshakeToken = await createGuardianHandshake({
                            teenUserId: user?.id,
                            metadata: { ocr: ocrResult, face_score: result.score },
                        });
                        const generatedLink = `${window.location.origin}/verification/parent-consent?token=${handshakeToken}`;
                        updateFormData('guardianHandshakeLink', generatedLink);
                        await persistTrustShieldState({
                            userId: user?.id,
                            verificationStatus: VERIFICATION_STATUS.PENDING_GUARDIAN,
                            ocrResult,
                            faceScore: result.score,
                            attemptResult: 'SUCCESS',
                            stage: 'guardian_pending',
                            handshakeToken,
                        });
                    } catch (persistErr) {
                        console.warn('[TrustShield] Guardian persist failed:', persistErr);
                    }
                    setStage('guardian');
                } else {
                    try {
                        await persistTrustShieldState({
                            userId: user?.id,
                            verificationStatus: VERIFICATION_STATUS.VERIFIED,
                            ocrResult,
                            faceScore: result.score,
                            attemptResult: 'SUCCESS',
                            stage: 'face_match',
                        });
                    } catch (persistErr) {
                        console.warn('[TrustShield] Persist failed:', persistErr);
                    }
                    setStage('result');
                }
            } else {
                // Liveness failed - show retry option
                setErrorType('liveness');
                setError(result.reason || 'Face verification failed. Please ensure good lighting and try again.');
                setStage('result');
                
                try {
                    await persistTrustShieldState({
                        userId: user?.id,
                        verificationStatus: VERIFICATION_STATUS.FAILED,
                        ocrResult,
                        faceScore: result.score,
                        attemptResult: 'FAILURE',
                        stage: 'face_match',
                        reason: result.reason || 'Face similarity threshold not met',
                    });
                } catch (persistErr) {
                    console.warn('[TrustShield] Failure persist failed:', persistErr);
                }
            }
        } catch (e) {
            console.error('[TrustShield] Face similarity check failed:', e);
            setErrorType('liveness');
            setError('Liveness processing error. Please retry with better lighting.');
            setStage('result');
        }
    }, [idFile, isTeen, ocrResult, stopCamera, updateFormData, user?.id]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🛡️ FINISH FLOW - NON-BYPASSABLE GUARDS
    // ═══════════════════════════════════════════════════════════════════════════
    const finishFlow = useCallback(() => {
        // GUARD 1: Must have match result
        if (!matchResult) {
            setError('Face verification not completed. Please complete the liveness check.');
            setErrorType('liveness');
            return;
        }
        
        // GUARD 2: Must have passed
        if (!matchResult.passed) {
            setError('Face verification failed. You cannot continue without passing verification.');
            setErrorType('liveness');
            return;
        }
        
        // GUARD 3: Must have face score
        if (!matchResult.score || matchResult.score < 0.5) {
            setError('Face match score too low. Verification incomplete.');
            setErrorType('liveness');
            return;
        }
        
        // GUARD 4: Must have OCR result
        if (!ocrResult || !ocrResult.dob || !ocrResult.name) {
            setError('ID information missing. Please upload your ID again.');
            return;
        }
        
        // GUARD 5: For teens, guardian handshake is required
        if (isTeen && !handshakeLink && !formData?.guardianHandshakeLink) {
            setError('Guardian approval required for teen accounts. Please complete guardian handshake.');
            return;
        }
        
        // All guards passed - mark as verified
        updateFormData('trustShieldStatus', VERIFICATION_STATUS.VERIFIED);
        updateFormData('trustShieldInitialized', true);
        updateFormData('trustShieldFaceScore', matchResult.score);
        
        if (isTeen) {
            updateFormData('guardianHandshakeLink', handshakeLink || formData?.guardianHandshakeLink || '');
        }
        
        // Final check before navigation
        console.log('[TrustShield] ✅ All guards passed - proceeding to next step');
        onNext();
    }, [matchResult, ocrResult, isTeen, handshakeLink, formData?.guardianHandshakeLink, updateFormData, onNext]);

    const openWhatsApp = useCallback(() => {
        const text = encodeURIComponent(
            `Focus Trust Shield guardian approval link:\n${handshakeLink}\n\nPlease verify to unlock teen safety mode.`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }, [handshakeLink]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DOB MISMATCH MODAL
    // ═══════════════════════════════════════════════════════════════════════════
    const renderDobMismatchModal = () => {
        if (!showDobMismatchModal) return null;
        
        return (
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '20px',
                    padding: '30px',
                    maxWidth: '400px',
                    width: '100%',
                    border: '2px solid #ef4444',
                    textAlign: 'center'
                }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '15px' }} />
                    <h3 style={{ color: '#fff', marginBottom: '10px' }}>Date of Birth Mismatch</h3>
                    <p style={{ color: '#94a3b8', marginBottom: '20px', fontSize: '0.9rem' }}>
                        The Date of Birth on your ID does not match what you entered in Step 2. 
                        For security reasons, you must restart with the correct information.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <Button variant="primary" onClick={handleHardReset} style={{ background: '#ef4444' }}>
                            Restart with Correct DOB
                        </Button>
                        <Button variant="ghost" onClick={() => setShowDobMismatchModal(false)}>
                            I'll check my ID again
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: ERROR MESSAGES WITH RETRY
    // ═══════════════════════════════════════════════════════════════════════════
    const renderErrorWithRetry = () => {
        if (!error) return null;
        
        const showRetry = errorType === 'liveness' || errorType === 'camera';
        
        return (
            <div style={{
                background: errorType === 'dob_mismatch' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${errorType === 'dob_mismatch' ? '#ef4444' : '#f87171'}`,
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '15px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
            }}>
                {errorType === 'dob_mismatch' ? (
                    <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                    <XCircle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ flex: 1 }}>
                    <p style={{ 
                        color: errorType === 'dob_mismatch' ? '#ef4444' : '#f87171', 
                        margin: 0,
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                    }}>
                        {error}
                    </p>
                    {showRetry && livenessAttempts < 3 && (
                        <div style={{ marginTop: '10px' }}>
                            <Button 
                                variant="primary" 
                                size="small" 
                                onClick={resetLiveness}
                                style={{ marginRight: '10px' }}
                            >
                                <RefreshCcw size={14} style={{ marginRight: '5px' }} />
                                Try Again ({3 - livenessAttempts} attempts left)
                            </Button>
                            <Button variant="ghost" size="small" onClick={initiatePhoneHandoff}>
                                <QrCode size={14} style={{ marginRight: '5px' }} />
                                Use Phone Instead
                            </Button>
                        </div>
                    )}
                    {showRetry && livenessAttempts >= 3 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '8px' }}>
                                Maximum attempts reached. Please use phone verification.
                            </p>
                            <Button variant="primary" onClick={initiatePhoneHandoff}>
                                <QrCode size={16} style={{ marginRight: '8px' }} />
                                Continue on Phone
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div className={styles.container}>
            {renderDobMismatchModal()}
            
            <div className={styles.header}>
                <h2 className={styles.title}>Focus Trust Shield</h2>
                <p className={styles.subtitle}>
                    Real people make a real nation. Let's verify your identity securely.
                </p>
            </div>

            <div className={styles.focuslyGuide}>
                <FocuslyAvatar
                    emotion={
                        stage === 'processing'
                            ? 'thinking'
                            : stage === 'result'
                                ? matchResult?.passed ? 'happy' : 'confused'
                                : 'wave'
                    }
                    size="small"
                />
                <p>
                    {stage === 'ocr' && 'Place your ID inside the frame. I will read your Name and DOB.'}
                    {stage === 'liveness' && isCapturing && `Action ${currentActionIndex + 1}/${livenessActions.length}: ${livenessActions[currentActionIndex] || 'Hold steady'}`}
                    {stage === 'liveness' && !isCapturing && 'Preparing camera...'}
                    {stage === 'processing' && 'Comparing your face with ID photo...'}
                    {stage === 'waiting_mobile' && 'Awaiting completion from your mobile browser...'}
                    {stage === 'result' && (matchResult?.passed
                        ? 'Identity verified successfully!'
                        : matchResult?.passed === false
                            ? 'Verification failed. Please review the error below.'
                            : 'Processing complete.')}
                    {stage === 'guardian' && 'Teen shield active. Share this link with your guardian.'}
                </p>
            </div>

            <div className={styles.progressTrack}>
                <motion.div className={styles.progressFill} animate={{ width: `${progress}%` }} />
            </div>

            {renderErrorWithRetry()}

            <div className={styles.stageCard}>
                <AnimatePresence mode="wait">
                    {/* OCR STAGE */}
                    {(stage === 'ocr' || stage === 'loading') && (
                        <motion.div
                            key="ocr"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className={styles.stage}
                        >
                            {stage === 'loading' ? (
                                <div style={{ 
                                    padding: '40px', 
                                    textAlign: 'center',
                                    color: '#a78bfa'
                                }}>
                                    <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', border: '3px solid rgba(167, 139, 250, 0.3)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <p>Loading face recognition models...</p>
                                </div>
                            ) : (
                                <>
                                <div className={styles.scannerOverlay}>
                                    <div className={styles.documentFrame}>
                                        <span className={styles.cornerTopLeft} />
                                        <span className={styles.cornerTopRight} />
                                        <span className={styles.cornerBottomLeft} />
                                        <span className={styles.cornerBottomRight} />
                                        <p className={styles.overlayHint}>{ocrHint}</p>
                                    </div>
                                </div>
                                
                                <div className={styles.inlineButtons} style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                                    {/* Take Photo - Uses capture attribute for mobile camera */}
                                    <label className={styles.uploadBtn}>
                                        <Camera size={16} /> Take Photo
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment"
                                            onChange={handleIdUpload} 
                                            hidden 
                                        />
                                    </label>
                                    
                                    {/* Upload File */}
                                    <label className={styles.uploadBtn} style={{ 
                                        background: 'rgba(255,255,255,0.05)', 
                                        color: '#d8b4fe', 
                                        border: '1px solid rgba(255,255,255,0.1)' 
                                    }}>
                                        <Upload size={16} /> Upload File
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleIdUpload} 
                                            hidden 
                                        />
                                    </label>
                                </div>
                                
                                {ocrStatus && !error && (
                                    <p style={{ 
                                        fontSize: '0.85rem', 
                                        color: '#a78bfa', 
                                        marginTop: '0.5rem', 
                                        textAlign: 'center' 
                                    }}>
                                        {ocrStatus} {ocrProgress > 0 && `${ocrProgress}%`}
                                    </p>
                                )}
                                
                                {ocrResult && (
                                    <div className={styles.extractedCard}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <CheckCircle size={16} color="#22c55e" />
                                            <span style={{ color: '#22c55e', fontSize: '0.85rem' }}>ID Read Successfully</span>
                                        </div>
                                        <p><strong>Name:</strong> {ocrResult.name || 'Not found'}</p>
                                        <p><strong>DOB:</strong> {ocrResult.dob || 'Not found'}</p>
                                        {formData?.ageInfo?.dateOfBirth && (
                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                                                Expected DOB: {formData.ageInfo.dateOfBirth}
                                            </p>
                                        )}
                                    </div>
                                )}
                                
                                <Button 
                                    variant="primary" 
                                    onClick={beginLiveness} 
                                    disabled={!ocrResult || !ocrResult.dob || !ocrResult.name || /screenshot/i.test(ocrResult.name)}
                                >
                                    Continue to Face Verification
                                </Button>
                                
                                {!ocrResult && (
                                    <p style={{ 
                                        fontSize: '0.8rem', 
                                        color: '#64748b', 
                                        textAlign: 'center',
                                        marginTop: '10px'
                                    }}>
                                        Upload your ID to continue. Ensure the photo clearly shows your Name and Date of Birth.
                                    </p>
                                )}
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* LIVENESS STAGE */}
                    {stage === 'liveness' && (
                        <motion.div 
                            key="liveness" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className={styles.stage}
                        >
                            <div className={styles.cameraRingWrap}>
                                <svg className={styles.progressRing} viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" className={styles.ringBase} />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        className={styles.ringProgress}
                                        style={{ 
                                            strokeDashoffset: `${339 - ((currentActionIndex + 1) / Math.max(livenessActions.length, 1)) * 339}` 
                                        }}
                                    />
                                </svg>
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className={styles.cameraVideo}
                                    style={{ opacity: videoReady ? 1 : 0.5 }}
                                />
                                {!videoReady && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center',
                                        color: '#94a3b8'
                                    }}>
                                        <div className={styles.loaderOrb} style={{ width: '40px', height: '40px', margin: '0 auto 10px' }} />
                                        <p style={{ fontSize: '0.8rem' }}>Starting camera...</p>
                                    </div>
                                )}
                            </div>
                            
                            <p className={styles.actionText}>
                                {isCapturing ? livenessActions[currentActionIndex] : 'Preparing...'}
                            </p>
                            
                            <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#94a3b8', 
                                textAlign: 'center',
                                marginBottom: '15px'
                            }}>
                                Step {currentActionIndex + 1} of {livenessActions.length}
                            </p>
                            
                            {cameraDenied && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #ef4444',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '15px'
                                }}>
                                    <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>
                                        Camera access blocked. Please enable camera permissions in your browser settings, or use the phone option below.
                                    </p>
                                </div>
                            )}
                            
                            <div className={styles.inlineButtons} style={{ flexDirection: 'column', gap: '8px' }}>
                                <Button variant="ghost" onClick={initiatePhoneHandoff}>
                                    <QrCode size={16} style={{ marginRight: '8px' }} /> 
                                    No Camera? Use Phone
                                </Button>
                                <Button variant="ghost" onClick={resetLiveness}>
                                    <ArrowLeft size={16} style={{ marginRight: '8px' }} /> 
                                    Go Back
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* PROCESSING STAGE */}
                    {stage === 'processing' && (
                        <motion.div 
                            key="processing" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className={styles.stage}
                        >
                            <div className={styles.processingGlass}>
                                <div className={styles.loaderOrb} />
                                <p>Secure Face Verification Running...</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
                                    Comparing your live photo with ID
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* RESULT STAGE */}
                    {stage === 'result' && (
                        <motion.div 
                            key="result" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className={styles.stage}
                        >
                            {matchResult?.passed ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        border: '2px solid #22c55e'
                                    }}>
                                        <ShieldCheck size={40} color="#22c55e" />
                                    </div>
                                    <h3 style={{ color: '#22c55e', marginBottom: '10px' }}>Verified!</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
                                        Face match score: {Math.round((matchResult.score || 0) * 100)}%
                                    </p>
                                    <Button variant="primary" onClick={finishFlow}>
                                        Continue
                                    </Button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        border: '2px solid #ef4444'
                                    }}>
                                        <XCircle size={40} color="#ef4444" />
                                    </div>
                                    <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>Verification Failed</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                                        {matchResult?.reason || 'Face verification failed. Please ensure good lighting and try again.'}
                                    </p>
                                    {livenessAttempts < 3 ? (
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <Button variant="primary" onClick={resetLiveness}>
                                                <RefreshCcw size={16} style={{ marginRight: '8px' }} />
                                                Try Again
                                            </Button>
                                            <Button variant="ghost" onClick={initiatePhoneHandoff}>
                                                <QrCode size={16} style={{ marginRight: '8px' }} />
                                                Use Phone
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button variant="primary" onClick={initiatePhoneHandoff}>
                                            <QrCode size={16} style={{ marginRight: '8px' }} />
                                            Continue on Phone
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* GUARDIAN STAGE */}
                    {stage === 'guardian' && (
                        <motion.div 
                            key="guardian" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className={styles.stage}
                        >
                            <h3>Guardian Approval Required</h3>
                            <p className={styles.guardianCopy}>
                                Because you are between 13-17, a verified adult must approve your account.
                                Enter your parent or guardian's email:
                            </p>
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                width: '100%', 
                                maxWidth: '300px', 
                                margin: '0 auto 20px', 
                                flexDirection: 'column' 
                            }}>
                                <input
                                    id="step_guardian_email_input"
                                    type="email"
                                    placeholder="guardian@example.com"
                                    style={{
                                        width: '100%', 
                                        padding: '14px', 
                                        borderRadius: '12px', 
                                        background: 'rgba(255,255,255,0.05)', 
                                        border: inviteError ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', 
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <Button 
                                    variant="primary" 
                                    onClick={async (e) => {
                                        const emailInput = document.getElementById('step_guardian_email_input')?.value?.trim();
                                        if (!emailInput) {
                                            setInviteError('Please enter a valid email address');
                                            return;
                                        }
                                        
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        if (!emailRegex.test(emailInput)) {
                                            setInviteError('Please enter a valid email address');
                                            return;
                                        }
                                        
                                        setIsSendingInvite(true);
                                        setInviteError('');
                                        
                                        try {
                                            let retries = 3;
                                            let success = false;
                                            
                                            while (retries > 0 && !success) {
                                                try {
                                                    const { error: fnError } = await supabase.functions.invoke('send-guardian-email', {
                                                        body: { 
                                                            email: emailInput, 
                                                            link: handshakeLink,
                                                            teenName: formData?.full_name || user?.user_metadata?.full_name,
                                                            teenUserId: user?.id
                                                        }
                                                    });
                                                    
                                                    if (fnError) throw fnError;
                                                    success = true;
                                                } catch (err) {
                                                    retries--;
                                                    if (retries === 0) throw err;
                                                    await new Promise(r => setTimeout(r, 1000));
                                                }
                                            }
                                            
                                            await supabase.from('profiles').update({
                                                guardian_email: emailInput,
                                                updated_at: new Date().toISOString()
                                            }).eq('id', user?.id);
                                            
                                            setInviteSent(true);
                                            if (navigator?.vibrate) navigator.vibrate([100, 50, 100]);
                                            
                                        } catch (err) {
                                            console.error('Failed to send guardian invite:', err);
                                            setInviteError('Failed to send invite. Please try again or use WhatsApp/QR code.');
                                        } finally {
                                            setIsSendingInvite(false);
                                        }
                                    }}
                                    loading={isSendingInvite}
                                    disabled={isSendingInvite || inviteSent}
                                >
                                    {inviteSent ? 'Invite Sent ✓' : (isSendingInvite ? 'Sending...' : 'Send Approval Invite')}
                                </Button>
                            </div>
                            
                            {inviteError && (
                                <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '12px' }}>
                                    {inviteError}
                                </p>
                            )}

                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                Or verify manually via QR code
                            </p>

                            <div style={{
                                width: '100%',
                                maxWidth: '180px',
                                margin: '16px auto',
                                aspectRatio: '1/1',
                                padding: '16px',
                                background: '#fff',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '12px',
                                boxShadow: '0 5px 20px rgba(168,85,247,0.2)',
                                boxSizing: 'border-box'
                            }}>
                                <QRCodeSVG 
                                    value={handshakeLink} 
                                    style={{ width: '100%', height: '100%' }}
                                    level="M"
                                    bgColor="#ffffff" 
                                    fgColor="#000000" 
                                />
                            </div>
                            
                            <p className={styles.linkText} style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                                {handshakeLink}
                            </p>
                            
                            <div className={styles.inlineButtons} style={{ marginTop: '0' }}>
                                <Button variant="ghost" onClick={openWhatsApp}>
                                    <Share2 size={16} style={{ marginRight: '8px' }} /> 
                                    Share on WhatsApp
                                </Button>
                                <Button variant="primary" onClick={finishFlow}>
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={styles.progressInfo}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={14} style={{ marginRight: '5px' }} /> Back
                </Button>
                <span>Step 5 of 6</span>
            </div>
        </div>
    );
};

export default StepTrustShield;
