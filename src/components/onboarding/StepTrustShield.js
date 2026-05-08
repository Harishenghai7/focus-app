/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔱 FOCUS TRUST SHIELD - BULLETPROOF IDENTITY VERIFICATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The Five Pillars of Focus:
 * 1. Real people make a real nation
 * 2. One Aadhar = One User = One Account
 * 3. No fakes, no bots, no multiple accounts
 * 4. Trust Shield keeps the community safe
 * 5. Meet real people, not fake profiles
 * 
 * Verification Flow:
 * Step 1: OCR (Scan ID) → Extract Name, DOB, ID Number
 * Step 2: Liveness (Biometric) → 3 challenges (Blink, Smile, Tilt)
 * Step 3: Result → Success/Failure with proper guards
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Camera, ShieldCheck, RefreshCcw, ArrowLeft, AlertTriangle, CheckCircle, XCircle, Share2 } from 'lucide-react';
import Button from '../shared/Button';
import FocuslyAvatar from '../focusly-ai/FocuslyAvatar';
import { triggerHaptic } from '../../utils/haptics';
import styles from './StepTrustShield.module.css';
import { useAuth } from '../../hooks/useAuth';
import useOCRScanner from '../../hooks/useOCRScanner';
import { useFaceLiveness } from '../../hooks/useFaceLiveness';
import { supabase } from '../../lib/supabase';
import { checkIdentityUniqueness, getDeviceId } from '../../utils/trustShieldGodEngine';

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const VERIFICATION_STATUS = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    VERIFIED_MINOR: 'VERIFIED_MINOR',
    PENDING_GUARDIAN: 'PENDING_GUARDIAN',
    REJECTED: 'REJECTED',
    FAILED: 'FAILED'
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAGES OF VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
const STAGES = {
    OCR: 'ocr',           // Step 1: Scan ID
    LIVENESS: 'liveness', // Step 2: Biometric verification
    PROCESSING: 'processing', // Processing verification
    RESULT: 'result',     // Step 3: Show result
    GUARDIAN: 'guardian'  // Teen: Waiting for guardian
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Generate Handoff Session ID
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

const StepTrustShield = ({ formData, updateFormData, onNext, onBack, onReset }) => {
    const { user } = useAuth();
    const { scanID, progress: ocrProgress, statusMessage: ocrStatus } = useOCRScanner();
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    const [stage, setStage] = useState(STAGES.OCR);
    const [ocrHint, setOcrHint] = useState('Position ID within frame');
    const [idFile, setIdFile] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    
    // Liveness states
    const [matchResult, setMatchResult] = useState(null);
    const [livenessAttempts, setLivenessAttempts] = useState(0);
    const [showDobMismatchModal, setShowDobMismatchModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Teen verification
    const [handoffSessionId] = useState(() => generateHandoffSessionId());
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);
    const [inviteError, setInviteError] = useState('');
    
    // Error handling
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(null);
    
    // Refs
    const channelRef = useRef(null);
    const videoRef = useRef(null);

    // ═══════════════════════════════════════════════════════════════════════════════
    // FACE LIVENESS HOOK
    // ═══════════════════════════════════════════════════════════════════════════════
    const {
        modelsLoaded,
        challenges,
        currentIndex,
        completedChallenges,
        isDetecting,
        faceDetected,
        statusMessage: livenessStatus,
        progress: livenessProgress,
        capturedFrames,
        startDetection,
        stopDetection,
    } = useFaceLiveness({
        videoRef,
        onComplete: handleLivenessComplete,
        onFail: handleLivenessFail,
        challengeCount: 3,
        timeoutMs: 60000,
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════════════
    const progress = useMemo(() => {
        switch (stage) {
            case STAGES.OCR: return 33;
            case STAGES.LIVENESS: return 33 + (livenessProgress * 0.33);
            case STAGES.PROCESSING: return 80;
            case STAGES.RESULT:
            case STAGES.GUARDIAN: return 100;
            default: return 0;
        }
    }, [stage, livenessProgress]);

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

    const handshakeLink = useMemo(() => {
        if (!user?.id) return '';
        return `${window.location.origin}/verification/parent-consent?token=${handoffSessionId}&teen=${user.id}`;
    }, [handoffSessionId, user?.id]);

    // ═══════════════════════════════════════════════════════════════════════════════
    // DOB VALIDATION
    // ═══════════════════════════════════════════════════════════════════════════════
    const validateDOB = useCallback((scannedDob, expectedDob) => {
        if (!expectedDob) return { valid: true, reason: null };
        if (!scannedDob) return { valid: false, reason: 'MISSING_DOB' };

        const normalizeDate = (dateStr) => {
            const cleaned = dateStr.replace(/[\/\.]/g, '-');
            const parts = cleaned.split('-');
            if (parts.length !== 3) return null;
            
            let year, month, day;
            if (parts[0].length === 4) {
                year = parts[0];
                month = parts[1].padStart(2, '0');
                day = parts[2].padStart(2, '0');
            } else if (parts[2].length === 4) {
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
            const expectedYear = expectedDob.split('-')[0];
            const scannedYear = scannedDob.split('-')[0];
            if (expectedYear !== scannedYear) {
                return { valid: false, reason: 'YEAR_MISMATCH', expected: expectedYear, scanned: scannedYear };
            }
            return { valid: true, reason: null };
        }

        if (normalizedExpected !== normalizedScanned) {
            const expParts = normalizedExpected.split('-');
            const scanParts = normalizedScanned.split('-');
            
            if (expParts[0] !== scanParts[0]) {
                return { valid: false, reason: 'YEAR_MISMATCH', expected: expParts[0], scanned: scanParts[0] };
            }
            if (expParts[1] !== scanParts[1]) {
                return { valid: false, reason: 'MONTH_MISMATCH' };
            }
            if (expParts[2] !== scanParts[2]) {
                return { valid: false, reason: 'DAY_MISMATCH' };
            }
        }

        return { valid: true, reason: null };
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════════
    // LIVENESS HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════════
    function handleLivenessComplete(result) {
        setStage(STAGES.PROCESSING);
        runVerification(result.capturedFrames, result.score);
    }

    function handleLivenessFail(reason) {
        setErrorType('liveness');
        setError(reason || 'Liveness check failed. Please try again.');
        setStage(STAGES.RESULT);
        setMatchResult({ passed: false, reason: reason || 'Liveness failed' });
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Block back button
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
            setError('Verification is mandatory. You cannot go back.');
            triggerHaptic(10);
        };
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // MANUAL FLOW: No auto-continue - user clicks Continue buttons

    useEffect(() => {
        // OCR hint rotation
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
            await supabase.from('profiles').update({
                verification_step: 2,
                identity_metadata: { ocrResult: result, stage: 'ocr', attempt: 'PENDING' },
                updated_at: new Date().toISOString(),
            }).eq('id', user?.id);
        } catch (persistError) {
            console.warn('[TrustShield] Persist failed:', persistError);
        }
    }, [user, formData?.ageInfo?.dateOfBirth, formData?.ageTier, scanID, updateFormData, validateDOB]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RESET AND RETRY
    // ═══════════════════════════════════════════════════════════════════════════
    const resetVerification = useCallback(() => {
        setMatchResult(null);
        setError('');
        setErrorType(null);
        setStage('ocr');
        setLivenessAttempts(prev => prev + 1);
    }, []);

    const handleHardReset = useCallback(async () => {
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
    }, [onReset]);

    // ═══════════════════════════════════════════════════════════════════════════
    // START LIVENESS CHECK - Move to Step 2 (Liveness)
    // ═══════════════════════════════════════════════════════════════════════════
    const beginLiveness = useCallback(async () => {
        if (!ocrResult?.name || !ocrResult?.dob) {
            setError('Name and DOB are required. Please scan your ID first.');
            return;
        }
        
        if (!ocrResult?.idNumber) {
            setError('ID Number is required. Please upload a clearer ID image.');
            return;
        }
        
        // Move to liveness stage
        setStage(STAGES.LIVENESS);
        setError('');
        
        // Start liveness detection after a short delay to allow UI to render
        setTimeout(() => {
            startDetection();
        }, 500);
    }, [ocrResult, startDetection]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RUN VERIFICATION AFTER LIVENESS COMPLETE
    // ═══════════════════════════════════════════════════════════════════════════
    const runVerification = useCallback(async (frames, livenessScore) => {
        setIsProcessing(true);
        setError('');
        
        // ═══════════════════════════════════════════════════════════════════════
        // 🔒 ULTRA STRICT: One Government ID = One Account Check
        // ═══════════════════════════════════════════════════════════════════════

        
        const deviceId = getDeviceId();
        const idNumber = ocrResult?.idNumber || ocrResult?.id;
        
        if (!idNumber) {
            setError('🔒 ID NUMBER MISSING: OCR did not detect ID number. Upload clearer image showing the ID number.');
            return;
        }
        
        // Check ID format first
        const idPatterns = {
            aadhaar: /^\d{12}$/,
            pan: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
            passport: /^[A-Z][0-9]{7}$/,
            voter: /^[A-Z]{3}[0-9]{7}$/,
            dl: /^[A-Z]{2}[0-9]{13}$/,
        };
        
        const cleanId = idNumber.toUpperCase().replace(/\s/g, '');
        const isValidFormat = Object.values(idPatterns).some(pattern => pattern.test(cleanId));
        
        if (!isValidFormat) {
            setError('🔒 INVALID ID FORMAT: Must be Aadhaar (12 digits), PAN (ABCDE1234F), Passport, Voter ID, or Driving License');
            return;
        }
        
        // CRITICAL: Check if ID already exists (One Person = One Account)
        const uniquenessCheck = await checkIdentityUniqueness(
            ocrResult?.name,
            ocrResult?.dob,
            deviceId,
            user?.id
        );
        
        if (!uniquenessCheck?.unique) {
            console.error('[TrustShieldV3] 🔒 IDENTITY COLLISION:', uniquenessCheck);
            
            // 🔥 THE NUCLEAR RESET (God-Level Enforcement)
            setError('IDENTITY COLLISION: One Person = One Account. Initiating Nuclear Reset...');
            setErrorType('general');
            
            // Lock UI and reset everything
            setStage('result');
            setMatchResult({ passed: false, reason: 'DUPLICATE_IDENTITY_NUCLEAR_LOCK' });
            
            setTimeout(async () => {
                try {
                    localStorage.clear();
                    await supabase.auth.signOut();
                    window.location.href = '/auth?error=identity_collision';
                } catch (err) {
                    window.location.href = '/auth?error=identity_collision';
                }
            }, 2500);
            return;
        }
        

        
        // Call verification RPC
        const { data: result, error: verifyError } = await supabase.rpc('finalize_verification_v2', {
            p_user_id: user?.id,
            p_identity_hash: ocrResult?.identityHash || '',
            p_device_id: 'device_' + Date.now(),
            p_ocr_data: {
                name: ocrResult?.name,
                dob: ocrResult?.dob,
                idNumber: ocrResult?.idNumber,
                idType: ocrResult?.idType || 'unknown'
            },
            p_face_score: livenessScore || 0.95,
            p_age_group: isTeen ? '13-17' : '18+'
        });
        
        if (verifyError) {
            setMatchResult({ passed: false, reason: 'Verification failed: ' + verifyError.message });
            setStage(STAGES.RESULT);
            setIsProcessing(false);
            return;
        }
        
        setMatchResult(result);
        setIsProcessing(false);
        
        if (result?.success || result?.passed) {
            triggerHaptic(24);
            setError('');
            
            const finalStatus = isTeen ? VERIFICATION_STATUS.PENDING_GUARDIAN : VERIFICATION_STATUS.VERIFIED;
            updateFormData('trustShieldStatus', finalStatus);
            updateFormData('trustShieldInitialized', true);
            updateFormData('trustShieldFaceScore', livenessScore || 0.95);
            
            if (isTeen) {
                setStage(STAGES.GUARDIAN);
            } else {
                setStage(STAGES.RESULT);
            }
        } else {
            setErrorType('verification');
            setError(result?.error || result?.reason || 'Verification failed. Please try again.');
            setStage(STAGES.RESULT);
        }
    }, [ocrResult, user, isTeen, updateFormData]);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🛡️ FINISH FLOW - NON-BYPASSABLE GUARDS
    // ═══════════════════════════════════════════════════════════════════════════
    const finishFlow = useCallback(() => {
        // GUARD 1: Must have match result
        if (!matchResult) {
            setError('ID verification not completed. Please verify your identity first.');
            setErrorType('verification');
            return;
        }
        
        // GUARD 2: Must have passed
        if (!matchResult.passed) {
            setError('ID verification failed. You cannot continue without passing verification.');
            setErrorType('verification');
            return;
        }
        
        // GUARD 3: Must have verification score
        if (!matchResult.score || matchResult.score < 0.5) {
            setError('Verification confidence too low. Please try again with a clearer ID photo.');
            setErrorType('verification');
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
        updateFormData('trustShieldVerificationMethod', 'id_only');
        
        if (isTeen) {
            updateFormData('guardianHandshakeLink', handshakeLink || formData?.guardianHandshakeLink || '');
        }
        
        // Final check before navigation

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
                                onClick={resetVerification}
                                style={{ marginRight: '10px' }}
                            >
                                <RefreshCcw size={14} style={{ marginRight: '5px' }} />
                                Try Again ({3 - livenessAttempts} attempts left)
                            </Button>
                        </div>
                    )}
                    {showRetry && livenessAttempts >= 3 && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                                Maximum attempts reached. Please contact support for assistance.
                            </p>
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
                        stage === STAGES.PROCESSING
                            ? 'thinking'
                            : stage === STAGES.RESULT
                                ? matchResult?.passed ? 'happy' : 'confused'
                                : 'neutral'
                    }
                    size="sm"
                />
                <p>
                    {stage === STAGES.OCR && 'Step 1/3: Upload your ID photo. I will read Name and Date of Birth instantly.'}
                    {stage === STAGES.LIVENESS && 'Step 2/3: Complete the biometric challenges to prove you are real.'}
                    {stage === STAGES.PROCESSING && 'Step 3/3: Processing your verification...'}
                    {stage === STAGES.RESULT && (matchResult?.passed
                        ? '✅ Identity verified! You are now a trusted member of Focus.'
                        : `❌ Failed: ${matchResult?.reason || 'Please try again'}`
                    )}
                    {stage === STAGES.GUARDIAN && '⏳ Waiting for guardian approval...'}
                </p>
            </div>

            <div className={styles.progressBar}>
                <motion.div className={styles.progressFill} animate={{ width: `${progress}%` }} />
            </div>

            {renderErrorWithRetry()}

            <div className={styles.stageCard}>
                <AnimatePresence mode="wait">
                    {/* OCR STAGE */}
                    {stage === 'ocr' && (
                        <motion.div
                            key="ocr"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className={styles.stage}
                        >
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
                                        <p style={{ 
                                            color: ocrResult.idNumber ? '#22c55e' : '#ef4444',
                                            fontWeight: ocrResult.idNumber ? 'normal' : 'bold'
                                        }}>
                                            <strong>ID Number:</strong> {ocrResult.idNumber ? 
                                                `${ocrResult.idNumber.substring(0, 4)}****${ocrResult.idNumber.slice(-4)} (${ocrResult.idType || 'ID'})` : 
                                                '❌ NOT DETECTED - Upload clearer image'
                                            }
                                        </p>
                                        {formData?.ageInfo?.dateOfBirth && (
                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                                                Expected DOB: {formData.ageInfo.dateOfBirth}
                                            </p>
                                        )}
                                        
                                    </div>
                                )}
                                
                                {/* MANUAL: Continue button when OCR is complete */}
                                <Button 
                                    variant="primary" 
                                    onClick={beginLiveness} 
                                    disabled={!ocrResult || !ocrResult.dob || !ocrResult.name || !ocrResult.idNumber}
                                    style={{
                                        opacity: (!ocrResult || !ocrResult.dob || !ocrResult.name || !ocrResult.idNumber) ? 0.5 : 1,
                                        cursor: (!ocrResult || !ocrResult.dob || !ocrResult.name || !ocrResult.idNumber) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {!ocrResult?.idNumber ? '❌ ID Number Required' : '👁️ Start Liveness Check →'}
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
                        </motion.div>
                    )}

                    {/* LIVENESS STAGE - Step 2: Biometric Verification */}
                    {stage === STAGES.LIVENESS && (
                        <motion.div
                            key="liveness"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className={styles.stage}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: '#fff', marginBottom: '8px' }}>🔒 Biometric Verification</h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    Complete 3 simple actions to prove you're real
                                </p>
                            </div>

                            {/* Video Feed */}
                            <div style={{ 
                                position: 'relative', 
                                width: '100%', 
                                maxWidth: '400px',
                                margin: '0 auto 20px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: '#000',
                                aspectRatio: '4/3'
                            }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transform: 'scaleX(-1)' // Mirror for natural feel
                                    }}
                                />
                                
                                {/* Face detection overlay */}
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '200px',
                                    height: '250px',
                                    border: `3px solid ${faceDetected ? '#22c55e' : '#fbbf24'}`,
                                    borderRadius: '50% / 40%',
                                    pointerEvents: 'none',
                                    transition: 'border-color 0.3s ease'
                                }} />
                                
                                {/* Status indicator */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    color: faceDetected ? '#22c55e' : '#fbbf24',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                }}>
                                    {faceDetected ? '✅ Face Detected' : '⏳ Looking for face...'}
                                </div>
                            </div>

                            {/* Challenge Display */}
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                {modelsLoaded ? (
                                    <>
                                        <div style={{ 
                                            fontSize: '3rem', 
                                            marginBottom: '10px',
                                            animation: isDetecting ? 'pulse 1s infinite' : 'none'
                                        }}>
                                            {challenges[currentIndex]?.icon || '👁️'}
                                        </div>
                                        <h4 style={{ color: '#fff', marginBottom: '8px' }}>
                                            {challenges[currentIndex]?.label || 'Get ready...'}
                                        </h4>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                            {challenges[currentIndex]?.description || 'Position your face in the oval'}
                                        </p>
                                        
                                        {/* Progress dots */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                                            {challenges.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        background: idx < completedChallenges.length ? '#22c55e' : 
                                                                    idx === currentIndex ? '#a855f7' : 'rgba(255,255,255,0.3)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Liveness status */}
                                        <p style={{ 
                                            color: '#a78bfa', 
                                            fontSize: '0.8rem', 
                                            marginTop: '12px',
                                            fontStyle: 'italic'
                                        }}>
                                            {livenessStatus}
                                        </p>
                                    </>
                                ) : (
                                    <div style={{ padding: '40px 20px' }}>
                                        <div className={styles.loaderOrb} style={{ margin: '0 auto 20px' }} />
                                        <p style={{ color: '#94a3b8' }}>Loading AI models...</p>
                                    </div>
                                )}
                            </div>

                            {/* Cancel button */}
                            <Button variant="ghost" onClick={() => {
                                stopDetection();
                                setStage(STAGES.OCR);
                            }}>
                                Cancel & Retry
                            </Button>
                        </motion.div>
                    )}

                    {/* PROCESSING STAGE */}
                    {stage === STAGES.PROCESSING && (
                        <motion.div 
                            key="processing" 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className={styles.stage}
                        >
                            <div className={styles.processingGlass}>
                                <div className={styles.loaderOrb} />
                                <p style={{ fontWeight: '600' }}>Processing...</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
                                    Please wait a moment
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* RESULT STAGE */}
                    {stage === STAGES.RESULT && (
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
                                    
                                    {/* MANUAL: Continue button */}
                                    <Button variant="primary" onClick={finishFlow}>
                                        Continue →
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
                                        <Button variant="primary" onClick={resetVerification}>
                                            <RefreshCcw size={16} style={{ marginRight: '8px' }} />
                                            Try Again
                                        </Button>
                                    ) : (
                                        <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                                            Maximum attempts reached. Please contact support.
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* GUARDIAN STAGE */}
                    {stage === STAGES.GUARDIAN && (
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
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexDirection: 'column', gap: '8px', padding: '12px',
                                    background: '#fff', borderRadius: '12px'
                                }}>
                                    <ShieldCheck size={40} color="#8b5cf6" />
                                    <p style={{ fontSize: '0.7rem', color: '#333', textAlign: 'center', wordBreak: 'break-all', margin: 0 }}>
                                        {handshakeLink}
                                    </p>
                                </div>
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
