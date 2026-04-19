import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import { supabase } from '../../lib/supabase';

const VerifyMobile = () => {
    const [searchParams] = useSearchParams();
    const uid = searchParams.get('uid');
    
    // Core state
    const [status, setStatus] = useState('initializing'); // initializing, models_loading, ready, verifying, success, error, permission_denied
    const [message, setMessage] = useState('Initializing Focus Bridge...');
    const [currentStep, setCurrentStep] = useState(0); // 0 = smile, 1 = blink
    
    // Config: Dual-Challenge Thresholds
    const SMILE_THRESHOLD = 0.35;
    const BLINK_THRESHOLD = 0.25;
    
    // Refs
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);
    const timeoutRef = useRef(null);
    const lastDetectionTimeRef = useRef(Date.now());
    // Rolling blink detection: 15-frame baseline calibration + 3-frame rolling avg
    const earBufferRef = useRef([]);
    const baselineEARRef = useRef(null);
    
    // Helper to calculate Eye Aspect Ratio for Blink Detection
    const getEAR = (eye) => {
        if (!eye || eye.length !== 6) return 1.0;
        const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const width = dist(eye[0], eye[3]);
        const height1 = dist(eye[1], eye[5]);
        const height2 = dist(eye[2], eye[4]);
        if (width === 0) return 1.0;
        return (height1 + height2) / (2.0 * width);
    };
    
    // Initializer
    useEffect(() => {
        const init = async () => {
            if (!uid) {
                setStatus('error');
                setMessage('Invalid or missing Focus Bridge link. No UID found.');
                return;
            }
            // Start Loading Models
            loadModels();
        };
        init();
        
        return () => stopAll();
        // eslint-disable-next-line
    }, [uid]);
    
    const loadModels = async () => {
        try {
            setStatus('models_loading');
            setMessage('Loading Native AI Modules...');
            
            // Loading models from Global CDN to ensure fastest speed for mobile CPU
            const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);
            
            setStatus('ready');
            setMessage('Tap Start. Make sure your face is clearly visible.');
        } catch (e) {
            console.error('Model load failed', e);
            setStatus('error');
            setMessage('Failed to load Face AI Models. Ensure stable connection.');
        }
    };
    
    const startVerification = async () => {
        try {
            setStatus('verifying');
            setMessage('Accessing Camera securely...');
            
            // Forced User-Facing camera for Auto-Centering logic
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
                audio: false 
            });
            
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            // Reset calibration for fresh session
            earBufferRef.current = [];
            baselineEARRef.current = null;
            
            setCurrentStep(0);
            setMessage('Challenge 1: Please SMILE broadly 😊');
            startDetectionLoop();
            
            timeoutRef.current = setTimeout(() => {
                stopAll();
                setStatus('error');
                setMessage('Verification timed out. Reload to try again.');
            }, 45000); // 45s max
            
        } catch (e) {
            // Hardware Fallback Logic
            setStatus('permission_denied');
            setMessage('Camera permission blocked by your device.');
        }
    };
    
    const startDetectionLoop = () => {
        const detect = async () => {
            if (!videoRef.current || videoRef.current.paused || status === 'success' || status === 'error') {
                return; 
            }
            
            try {
                // Throttle detection slightly for mobile CPU performance
                const now = Date.now();
                if (now - lastDetectionTimeRef.current > 150) {
                    lastDetectionTimeRef.current = now;

                    const detection = await faceapi
                        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();
                        
                    if (detection) {
                        setCurrentStep((step) => {
                            let nextStep = step;
                            if (step === 0) {
                                // Challenge 1: Smile — threshold 0.35
                                const happy = detection.expressions.happy;
                                if (happy > SMILE_THRESHOLD) {
                                    setMessage('Challenge 2: Please BLINK deliberately 👁️👁️');
                                    nextStep = 1;
                                    // Reset blink calibration for fresh start
                                    earBufferRef.current = [];
                                    baselineEARRef.current = null;
                                    if (navigator?.vibrate) navigator.vibrate(100);
                                }
                            } else if (step === 1) {
                                // Challenge 2: Blink — rolling avg of 3 frames, 40% drop from baseline
                                const leftEye = detection.landmarks.getLeftEye();
                                const rightEye = detection.landmarks.getRightEye();
                                const currentEAR = (getEAR(leftEye) + getEAR(rightEye)) / 2.0;

                                if (baselineEARRef.current === null) {
                                    // Calibration phase: collect 15 frames of open-eye EAR
                                    earBufferRef.current.push(currentEAR);
                                    if (earBufferRef.current.length >= 15) {
                                        const sum = earBufferRef.current.reduce((a, b) => a + b, 0);
                                        baselineEARRef.current = sum / earBufferRef.current.length;
                                        earBufferRef.current = []; // Start rolling window fresh
                                        setMessage('Baseline set. NOW blink 👁️');
                                    }
                                } else {
                                    // Detection phase: rolling average of last 3 frames
                                    earBufferRef.current.push(currentEAR);
                                    if (earBufferRef.current.length > 3) earBufferRef.current.shift();
                                    const rollingAvg = earBufferRef.current.reduce((a, b) => a + b, 0) / earBufferRef.current.length;

                                    // 40% drop from calibrated open-eye baseline = blink
                                    if (rollingAvg < baselineEARRef.current * 0.60) {
                                        completeHandoff();
                                        nextStep = 2; // completed
                                    }
                                }
                            }
                            return nextStep;
                        });
                    } else {
                        // Hint for overlay auto-centering
                        setMessage('Searching for face in the Safe Zone...');
                    }
                }
            } catch (e) {}
            
            animationFrameRef.current = requestAnimationFrame(detect);
        };
        animationFrameRef.current = requestAnimationFrame(detect);
    };
    
    const completeHandoff = async () => {
        stopAll();
        setStatus('success');
        setMessage('Authenticating connection...');
        
        try {
            if (uid) {
                await supabase
                    .from('profiles')
                    .update({ 
                        verification_status: 'VERIFIED',
                        trust_shield_status: 'VERIFIED'
                    })
                    .eq('id', uid);
            }

            setMessage('Ritual Complete. Your Desktop is unlocking now.');
            if (navigator?.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) {
            setStatus('error');
            setMessage('Failed to synchronize status to Desktop.');
        }
    };
    
    const stopAll = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
    
    // Minimalist Mobile Battle-Station UI
    const pageStyle = {
        minHeight: '100vh',
        backgroundColor: '#050510',
        color: '#f3e8ff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
    };

    return (
        <div style={pageStyle}>
            <div style={{ padding: '30px', background: 'rgba(15,10,30,0.7)', borderRadius: '25px', width: '100%', maxWidth: '380px', border: '1px solid rgba(168,85,247,0.2)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <h1 style={{ margin: '0 0 15px 0', fontSize: '1.8rem', color: '#d8b4fe', letterSpacing: '1px' }}>Focus Bridge</h1>
                
                <p style={{ minHeight: '50px', fontSize: '1.05rem', marginBottom: '20px', color: '#a78bfa', fontWeight: '500' }}>{message}</p>
                
                {status === 'models_loading' && (
                    <div style={{ width: '100%', height: '6px', background: '#221', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '50%', height: '100%', background: '#a855f7', animation: 'pulse 1s infinite alternate' }} />
                    </div>
                )}
                
                {(status === 'ready' || status === 'verifying') && (
                    <div style={{ position: 'relative', width: '260px', height: '320px', margin: '0 auto 20px', borderRadius: '130px', overflow: 'hidden', border: `3px solid ${currentStep === 1 ? '#4ade80' : '#a855f7'}`, boxShadow: '0 0 30px rgba(168,85,247,0.4)', transition: 'border-color 0.4s ease' }}>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                        />
                        {/* Auto-Centering Safe Zone CSS Overlay */}
                        <div style={{
                            position: 'absolute',
                            top: '5%', left: '10%', right: '10%', bottom: '15%',
                            border: '2px dashed rgba(255,255,255,0.4)',
                            borderRadius: '100px',
                            pointerEvents: 'none'
                        }} />
                    </div>
                )}
                
                {status === 'ready' && (
                    <button 
                        onClick={startVerification}
                        style={{ background: '#a855f7', color: 'white', border: 'none', padding: '16px 30px', fontSize: '1.15rem', borderRadius: '30px', fontWeight: '700', width: '100%', cursor: 'pointer', boxShadow: '0 5px 15px rgba(168,85,247,0.4)' }}
                    >
                        START VERIFICATION
                    </button>
                )}
                
                {status === 'success' && (
                    <div style={{ margin: '30px 0', animation: 'pulse 1.5s infinite alternate' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 30px rgba(74,222,128,0.5)' }}>
                            <span style={{ fontSize: '2.5rem', transform: 'translateY(2px)' }}>✓</span>
                        </div>
                    </div>
                )}
                
                {status === 'permission_denied' && (
                    <div style={{ marginTop: '20px', background: 'rgba(200,50,50,0.1)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,100,100,0.3)', textAlign: 'left' }}>
                        <h3 style={{ color: '#fca5a5', marginTop: 0 }}>Camera Access Required</h3>
                        <p style={{ fontSize: '0.95rem' }}>We need hardware camera permissions for biometrics.</p>
                        <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#ddd' }}>
                            <li style={{ marginBottom: '8px' }}>Tap <strong>Aa</strong> or <strong>🔒 Lock</strong> icon in your browser's address bar.</li>
                            <li>Go to Settings and toggle <strong>Camera</strong> to <strong>Allow</strong>.</li>
                        </ul>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{ width: '100%', marginTop: '15px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '12px', borderRadius: '20px', fontSize: '1rem' }}
                        >
                            I've enabled it — Retry
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ marginTop: '20px' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            style={{ background: '#333', color: 'white', border: '1px solid #555', padding: '12px 25px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            RELOAD SYSTEM
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes pulse {
                    from { transform: scale(1); opacity: 0.8; }
                    to { transform: scale(1.05); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default VerifyMobile;
