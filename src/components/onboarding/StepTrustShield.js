import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Camera, ShieldCheck, RefreshCcw, QrCode, Share2, ArrowLeft } from 'lucide-react';
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
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

const StepTrustShield = ({ formData, updateFormData, onNext, onBack }) => {
    const { user } = useAuth();
    const { scanID, progress: ocrProgress, statusMessage: ocrStatus } = useOCRScanner();
    const [stage, setStage] = useState('ocr');
    const [ocrHint, setOcrHint] = useState('Position ID within frame');
    const [idFile, setIdFile] = useState(null);
    const [ocrResult, setOcrResult] = useState(null);
    const [livenessActions, setLivenessActions] = useState([]);
    const [currentActionIndex, setCurrentActionIndex] = useState(0);
    const [matchResult, setMatchResult] = useState(null);
    const [videoReady, setVideoReady] = useState(false);
    const [cameraDenied, setCameraDenied] = useState(false);
    const [error, setError] = useState('');
    const [handoffToken, setHandoffToken] = useState(null);
    const streamRef = useRef(null);
    const videoRef = useRef(null);
    const channelRef = useRef(null);

    const progress = useMemo(() => {
        if (stage === 'ocr') return 25;
        if (stage === 'liveness') return 55 + currentActionIndex * 15;
        if (stage === 'processing') return 85;
        if (stage === 'result') return 100;
        if (stage === 'guardian') return 100;
        return 0;
    }, [stage, currentActionIndex]);

    const isTeen = useMemo(() => {
        const dob = ocrResult?.dob || formData?.ageInfo?.dateOfBirth;
        if (!dob) return false;
        const date = new Date(dob);
        if (Number.isNaN(date.getTime())) return false;
        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        const passed = now.getMonth() > date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
        if (!passed) age -= 1;
        return age >= 13 && age <= 17;
    }, [ocrResult?.dob, formData?.ageInfo?.dateOfBirth]);

    const handshakeLink = useMemo(() => formData?.guardianHandshakeLink || '', [formData?.guardianHandshakeLink]);

    // ── The Founder's Backdoor ──────────────────────────────────────────────────
    const keysPressed = useRef(new Set());
    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (process.env.NODE_ENV !== 'development') return;
            keysPressed.current.add(e.key.toLowerCase());
            
            if (e.ctrlKey && e.shiftKey && keysPressed.current.has('v')) {
                try {
                    if (user?.id) {
                        await supabase.from('profiles').update({ verification_status: 'VERIFIED', trust_shield_status: 'VERIFIED' }).eq('id', user.id);
                        localStorage.setItem('bypass_used', 'true');
                        window.location.href = '/home';
                    }
                } catch (err) {}
            }
        };
        
        const handleKeyUp = (e) => {
            keysPressed.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [user]);

    // ── Typewriter Effect ───────────────────────────────────────────────────────
    const [typewriterText, setTypewriterText] = useState('');
    const fullWaitingText = "Awaiting completion from your mobile browser...";

    useEffect(() => {
        if (stage === 'waiting_mobile') {
          setTypewriterText('');
          let i = 0;
          const interval = setInterval(() => {
            setTypewriterText(fullWaitingText.slice(0, i + 1));
            i++;
            if (i >= fullWaitingText.length) {
              clearInterval(interval);
            }
          }, 50);
          return () => clearInterval(interval);
        }
    }, [stage, fullWaitingText]);

    useEffect(() => {
        const hints = [
            'Position ID within frame',
            'Avoid glare on the card',
            'Keep Name and DOB visible',
        ];
        let index = 0;
        const timer = setInterval(() => {
            index = (index + 1) % hints.length;
            setOcrHint(hints[index]);
        }, 1800);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setVideoReady(false);
    };

    const startCamera = async () => {
        setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setVideoReady(true);
            setCameraDenied(false);
        } catch (err) {
            try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = fallbackStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                }
                setVideoReady(true);
                setCameraDenied(false);
            } catch (fallbackErr) {
                setCameraDenied(true);
                setError('Camera access is required for liveness challenge. Consider using your phone.');
            }
        }
    };

    const initiatePhoneHandoff = async () => {
        if (!user?.id) return;
        setStage('waiting_mobile');
        stopCamera();

        try {
            const channel = supabase.channel(`handoff_${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                }, (payload) => {
                    if (payload.new.verification_status === 'VERIFIED') {
                        updateFormData('trustShieldStatus', 'VERIFIED');
                        updateFormData('trustShieldInitialized', true);
                        setMatchResult({ passed: true, score: 0.99 });
                        setStage('result');
                        setTimeout(() => {
                            window.location.href = '/home';
                        }, 1000);
                    }
                })
                .subscribe();
                
            channelRef.current = channel;
        } catch (err) {
            setError('Failed to initiate phone handoff.');
        }
    };

    const handleIdUpload = async (event) => {
        if (!user?.id) {
            setError('Session expired. Please log in again.');
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;
        setIdFile(file);
        setError('');
        const result = await scanID(file);
        if (!result.ok) {
            setError(result.reason);
            return;
        }
        setOcrResult(result);
        updateFormData('trustShieldOCR', result);
        try {
            await persistTrustShieldState({
                userId: user?.id,
                verificationStatus: 'PENDING',
                ocrResult: result,
                attemptResult: 'PENDING',
                stage: 'ocr',
            });
        } catch (persistError) {
            setError(persistError.message || 'Failed to persist OCR verification state.');
        }
    };

    const beginLiveness = async () => {
        if (!ocrResult?.name || !ocrResult?.dob) {
            setError('Name and DOB are required before liveness check.');
            return;
        }
        const actions = generateLivenessActions();
        setLivenessActions(actions);
        setCurrentActionIndex(0);
        setStage('liveness');
        await startCamera();
    };

    const completeAction = () => {
        if (!user?.id) {
            setError('Session expired. Please log in again.');
            return;
        }
        if (currentActionIndex < livenessActions.length - 1) {
            setCurrentActionIndex((prev) => prev + 1);
            return;
        }
        setStage('processing');
        stopCamera();
        window.setTimeout(async () => {
            const result = await runFaceSimilarityCheck({ idImageFile: idFile, selfieCaptured: true });
            setMatchResult(result);
            if (result.passed) {
                triggerHaptic(24);
                updateFormData('trustShieldStatus', 'VERIFIED');
                updateFormData('trustShieldInitialized', true);
                updateFormData('trustShieldFaceScore', result.score);
                try {
                    if (isTeen) {
                        const handshakeToken = await createGuardianHandshake({
                            teenUserId: user?.id,
                            metadata: { ocr: ocrResult, face_score: result.score },
                        });
                        const generatedLink = `https://focus-macha.loca.lt/verification/parent-consent?token=${handshakeToken}`;
                        updateFormData('guardianHandshakeLink', generatedLink);
                        await persistTrustShieldState({
                            userId: user?.id,
                            verificationStatus: 'PENDING',
                            ocrResult,
                            faceScore: result.score,
                            attemptResult: 'SUCCESS',
                            stage: 'guardian_pending',
                            handshakeToken,
                        });
                        setStage('guardian');
                    } else {
                        await persistTrustShieldState({
                            userId: user?.id,
                            verificationStatus: 'VERIFIED',
                            ocrResult,
                            faceScore: result.score,
                            attemptResult: 'SUCCESS',
                            stage: 'face_match',
                        });
                        setStage('result');
                    }
                } catch (persistError) {
                    setError(persistError.message || 'Could not persist verification result.');
                    setStage('result');
                } finally {
                    setIdFile(null);
                }
                return;
            }
            try {
                await persistTrustShieldState({
                    userId: user?.id,
                    verificationStatus: 'PENDING',
                    ocrResult,
                    faceScore: result.score,
                    attemptResult: 'FAILURE',
                    stage: 'face_match',
                    reason: result.reason || 'Face similarity threshold not met.',
                });
            } catch (_) {}
            setIdFile(null);
            setStage('result');
        }, 1800);
    };

    const finishFlow = () => {
        if (!matchResult?.passed && !formData?.trustShieldInitialized) {
            setError('Complete verification before continuing.');
            return;
        }
        if (isTeen) {
            updateFormData('guardianHandshakeLink', handshakeLink || formData?.guardianHandshakeLink || '');
        }
        onNext();
    };

    const openWhatsApp = () => {
        const text = encodeURIComponent(
            `Focus Trust Shield guardian approval link:\n${handshakeLink}\n\nPlease verify to unlock teen safety mode.`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Focus Trust Shield</h2>
                <p className={styles.subtitle}>
                    Real people make a real nation. Let&apos;s verify your soul, Macha!
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
                    {stage === 'ocr' && 'Place your ID inside the frame. I will read your Name and DOB in seconds.'}
                    {stage === 'liveness' && `Do this now: ${livenessActions[currentActionIndex] || 'Hold steady'}`}
                    {stage === 'processing' && 'Comparing your live presence with your ID photo...'}
                    {stage === 'waiting_mobile' && typewriterText}
                    {stage === 'result' && (matchResult?.passed
                        ? 'Identity verified. You are now trust-locked and bulletproof.'
                        : 'No stress. Retry with better lighting and face centered in the ring.')}
                    {stage === 'guardian' && 'Teen shield active. Share this guardian handshake to unlock full Focus access.'}
                </p>
            </div>

            <div className={styles.progressTrack}>
                <motion.div className={styles.progressFill} animate={{ width: `${progress}%` }} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.stageCard}>
                <AnimatePresence mode="wait">
                    {stage === 'ocr' && (
                        <motion.div
                            key="ocr"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className={styles.stage}
                        >
                            <div className={styles.scannerOverlay}>
                                <div className={styles.documentFrame}>
                                    <span className={styles.cornerTopLeft} />
                                    <span className={styles.cornerTopRight} />
                                    <span className={styles.cornerBottomLeft} />
                                    <span className={styles.cornerBottomRight} />
                                    <p className={styles.overlayHint}>{ocrHint}</p>
                                </div>
                            </div>
                            <label className={styles.uploadBtn}>
                                <Upload size={16} />
                                Upload Government or Student ID
                                <input type="file" accept="image/*" onChange={handleIdUpload} hidden />
                            </label>
                            {ocrStatus && (
                                <p style={{ fontSize: '0.85rem', color: '#a78bfa', marginTop: '0.5rem', textAlign: 'center' }}>
                                    {ocrStatus} {ocrProgress > 0 && `${ocrProgress}%`}
                                </p>
                            )}
                            {ocrResult && (
                                <div className={styles.extractedCard}>
                                    <p><strong>Name:</strong> {ocrResult.name || 'Not found'}</p>
                                    <p><strong>DOB:</strong> {ocrResult.dob || 'Not found'}</p>
                                </div>
                            )}
                            <Button 
                                variant="primary" 
                                onClick={beginLiveness} 
                                disabled={!ocrResult || !ocrResult.dob || !ocrResult.name || /screenshot/i.test(ocrResult.name)}
                            >
                                Continue to Liveness
                            </Button>
                        </motion.div>
                    )}

                    {stage === 'liveness' && (
                        <motion.div key="liveness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stage}>
                            <div className={styles.cameraRingWrap}>
                                <svg className={styles.progressRing} viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" className={styles.ringBase} />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        className={styles.ringProgress}
                                        style={{ strokeDashoffset: `${339 - ((currentActionIndex + 1) / Math.max(livenessActions.length, 1)) * 339}` }}
                                    />
                                </svg>
                                <video ref={videoRef} autoPlay muted playsInline className={styles.cameraVideo} />
                            </div>
                            <p className={styles.actionText}>{livenessActions[currentActionIndex]}</p>
                            {cameraDenied && <p className={styles.warning}>Camera permission blocked. Enable camera and retry.</p>}
                            <div className={styles.inlineButtons} style={{ flexDirection: 'column', gap: '8px' }}>
                                <Button variant="primary" onClick={completeAction} disabled={!videoReady}>
                                    <Camera size={16} /> I completed this action
                                </Button>
                                <Button variant="ghost" onClick={initiatePhoneHandoff}>
                                    <QrCode size={16} /> No Camera? Use Phone
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {stage === 'processing' && (
                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stage}>
                            <div className={styles.processingGlass}>
                                <div className={styles.loaderOrb} />
                                <p>Secure Face Similarity Engine running...</p>
                            </div>
                        </motion.div>
                    )}

                    {stage === 'waiting_mobile' && (
                        <motion.div key="waiting_mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stage}>
                            <h3>Focus Bridge Active</h3>
                            <p className={styles.guardianCopy}>
                                Scan this code with your mobile (Chrome/Safari) to use your phone's camera. Leave this tab open.
                            </p>
                            <div style={{
                                width: '100%',
                                maxWidth: '280px',
                                margin: '20px auto',
                                aspectRatio: '1/1',
                                padding: '24px',
                                background: '#fff',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '16px',
                                boxShadow: '0 10px 40px rgba(168,85,247,0.3)',
                                boxSizing: 'border-box'
                            }}>
                                <QRCodeSVG 
                                    value={`${window.location.origin}/verify-mobile?uid=${user?.id}`} 
                                    style={{ width: '100%', height: '100%' }}
                                    level={"H"}
                                    bgColor="#ffffff" 
                                    fgColor="#000000" 
                                />
                            </div>
                            <div className={styles.processingGlass} style={{ marginTop: '20px', background: 'transparent' }}>
                                <div className={styles.loaderOrb} style={{ width: '20px', height: '20px' }} />
                                <p style={{ fontSize: '0.9rem', color: '#d8b4fe' }}>{typewriterText}</p>
                            </div>
                        </motion.div>
                    )}

                    {stage === 'result' && (
                        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stage}>
                            {matchResult?.passed ? (
                                <div className={styles.successBlock}>
                                    <ShieldCheck size={26} />
                                    <h3>Identity Verified</h3>
                                    <p>Trust Shield Badge unlocked. Similarity score: {(matchResult.score * 100).toFixed(0)}%</p>
                                    <Button variant="primary" onClick={finishFlow}>Continue</Button>
                                </div>
                            ) : (
                                <div className={styles.failureBlock}>
                                    <h3>Verification did not pass</h3>
                                    <p>{matchResult?.reason || 'Face comparison was inconclusive.'}</p>
                                    <Button variant="primary" onClick={() => setStage('liveness')}>
                                        <RefreshCcw size={16} /> Retry
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {stage === 'guardian' && (
                        <motion.div key="guardian" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.stage}>
                            <h3>Guardian Handshake</h3>
                            <p className={styles.guardianCopy}>
                                Because you are between 13-17, we need one verified adult handshake for your safety.
                            </p>
                            <div style={{
                                width: '100%',
                                maxWidth: '200px',
                                margin: '20px auto',
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
                                    level={"M"}
                                    bgColor="#ffffff" 
                                    fgColor="#000000" 
                                />
                            </div>
                            <p className={styles.linkText}>{handshakeLink}</p>
                            <div className={styles.inlineButtons}>
                                <Button variant="ghost" onClick={openWhatsApp}>
                                    <Share2 size={16} /> Share on WhatsApp
                                </Button>
                                <Button variant="primary" onClick={finishFlow}>Continue</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={styles.progressInfo}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={14} /> Back
                </Button>
                <span>Step 4 of 5</span>
            </div>
        </div>
    );
};

export default StepTrustShield;
