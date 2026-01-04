import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import styles from './GovernmentIDVerification.module.css';

/**
 * Government ID + Face Verification Component
 * Implements DigiLocker verification + face liveness detection + face matching
 */
const GovernmentIDVerification = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Step management
    const [step, setStep] = useState(1); // 1: age, 2: digilocker, 3: liveness, 4: matching, 5: success
    const [age, setAge] = useState(null);

    // DigiLocker data
    const [digilockerPhotoUrl, setDigilockerPhotoUrl] = useState(null);
    const [verifiedName, setVerifiedName] = useState('');

    // Face detection
    const [liveSelfie, setLiveSelfie] = useState(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [blinkDetected, setBlinkDetected] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);

    // Device fingerprint
    const [deviceFingerprint, setDeviceFingerprint] = useState(null);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Load face-api.js models on mount
    useEffect(() => {
        const loadModels = async () => {
            try {
                setLoadingMessage('Loading face detection models...');
                const MODEL_URL = '/models';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                setModelsLoaded(true);
                setLoadingMessage('');
                console.log('Face detection models loaded successfully');
            } catch (error) {
                console.error('Error loading face detection models:', error);
                toast.error('Failed to load face detection models. Please refresh the page.');
            }
        };

        loadModels();

        // Generate device fingerprint
        const getFingerprint = async () => {
            try {
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setDeviceFingerprint(result.visitorId);
                console.log('Device fingerprint generated');
            } catch (error) {
                console.error('Error generating device fingerprint:', error);
            }
        };

        getFingerprint();
    }, []);

    // STEP 1: Age declaration
    const handleAgeSelect = (selectedAge) => {
        setAge(selectedAge);
        if (selectedAge >= 18) {
            setStep(2); // Proceed to DigiLocker
        } else {
            // Redirect to parent consent flow
            toast.info('You need parent/guardian consent to proceed');
            navigate('/verification/parent-consent');
        }
    };

    // STEP 2: DigiLocker OAuth
    const initiateDigiLocker = () => {
        const state = Math.random().toString(36).substring(7);
        localStorage.setItem('digilocker_state', state);
        localStorage.setItem('digilocker_user_id', user.id);

        const clientId = process.env.REACT_APP_DIGILOCKER_CLIENT_ID || 'your_client_id';
        const redirectUri = `${window.location.origin}/auth/digilocker/callback`;

        const authUrl = `https://api.digilocker.gov.in/public/oauth2/1/authorize?` +
            `response_type=code&` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `state=${state}`;

        window.location.href = authUrl;
    };

    // STEP 3: Handle DigiLocker callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
            const savedState = localStorage.getItem('digilocker_state');
            const savedUserId = localStorage.getItem('digilocker_user_id');

            if (state === savedState && savedUserId) {
                handleDigiLockerCallback(code, state, savedUserId);
            } else {
                toast.error('Invalid verification state. Please try again.');
            }
        }
    }, []);

    const handleDigiLockerCallback = async (code, state, userId) => {
        try {
            setLoading(true);
            setLoadingMessage('Verifying your identity with DigiLocker...');

            // Call Edge Function to exchange code for Aadhaar data
            const { data, error } = await supabase.functions.invoke('digilocker-verify', {
                body: { code, userId, state }
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'DigiLocker verification failed');
            }

            if (data.requiresParentConsent) {
                toast.info('Parent consent required to complete verification');
                navigate('/verification/parent-consent');
                return;
            }

            setDigilockerPhotoUrl(data.photoUrl);
            setVerifiedName(data.verifiedName);
            setStep(3); // Proceed to liveness check

            // Clear URL parameters
            window.history.replaceState({}, document.title, '/verification/government-id');

            // Clear localStorage
            localStorage.removeItem('digilocker_state');
            localStorage.removeItem('digilocker_user_id');

            toast.success('DigiLocker verification successful!');

        } catch (error) {
            console.error('DigiLocker callback error:', error);
            toast.error(error.message || 'DigiLocker verification failed');
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // STEP 4: Face liveness detection
    const startLivenessCheck = async () => {
        try {
            setLoading(true);
            setLoadingMessage('Starting camera...');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            setLoadingMessage('Position your face in the camera and blink once');
            setLoading(false);

            // Start blink detection
            detectBlink();

        } catch (error) {
            console.error('Camera access error:', error);
            toast.error('Failed to access camera. Please allow camera permissions.');
            setLoading(false);
        }
    };

    const detectBlink = () => {
        const checkInterval = setInterval(async () => {
            if (!videoRef.current || !modelsLoaded) return;

            try {
                const detections = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks();

                if (detections) {
                    setFaceDetected(true);
                    const landmarks = detections.landmarks;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();

                    // Calculate Eye Aspect Ratio (EAR)
                    const leftEAR = calculateEAR(leftEye);
                    const rightEAR = calculateEAR(rightEye);

                    // Blink detected when both eyes have low EAR
                    if (leftEAR < 0.2 && rightEAR < 0.2) {
                        setBlinkDetected(true);
                        clearInterval(checkInterval);
                        setTimeout(() => captureSelfie(), 500); // Capture after blink
                    }
                } else {
                    setFaceDetected(false);
                }
            } catch (error) {
                console.error('Face detection error:', error);
            }
        }, 100);
    };

    const calculateEAR = (eye) => {
        const vertical1 = distance(eye[1], eye[5]);
        const vertical2 = distance(eye[2], eye[4]);
        const horizontal = distance(eye[0], eye[3]);
        return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const distance = (p1, p2) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const captureSelfie = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const selfieDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setLiveSelfie(selfieDataUrl);

        // Stop video stream
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        setStep(4); // Proceed to face matching
        toast.success('Liveness check passed! Matching your face...');
    };

    // STEP 5: Face matching
    useEffect(() => {
        if (step === 4 && digilockerPhotoUrl && liveSelfie && modelsLoaded) {
            performFaceMatch();
        }
    }, [step, digilockerPhotoUrl, liveSelfie, modelsLoaded]);

    const performFaceMatch = async () => {
        try {
            setLoading(true);
            setLoadingMessage('Matching your face with ID photo...');

            // Convert base64 to Image element
            const img1 = await loadImage(digilockerPhotoUrl);
            const img2 = await loadImage(liveSelfie);

            // Detect faces and get descriptors
            const detection1 = await faceapi
                .detectSingleFace(img1)
                .withFaceLandmarks()
                .withFaceDescriptor();

            const detection2 = await faceapi
                .detectSingleFace(img2)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection1 || !detection2) {
                throw new Error('Face not detected in one or both images. Please try again.');
            }

            // Calculate similarity using Euclidean distance
            const distance = faceapi.euclideanDistance(
                detection1.descriptor,
                detection2.descriptor
            );

            // Convert distance to confidence percentage (lower distance = higher confidence)
            const confidence = Math.max(0, Math.min(100, (1 - distance) * 100));

            console.log(`Face match confidence: ${confidence.toFixed(2)}%`);

            if (confidence >= 95) {
                // Call Edge Function to complete verification
                const { data, error } = await supabase.functions.invoke('verify-face-match', {
                    body: {
                        userId: user.id,
                        matchConfidence: confidence,
                        deviceFingerprint,
                        livenessPassed: true
                    }
                });

                if (error) throw error;

                if (!data.success) {
                    throw new Error(data.error || 'Face verification failed');
                }

                setStep(5); // Success!
                toast.success(data.message);

            } else {
                throw new Error(`Face match confidence too low (${confidence.toFixed(1)}%). Please ensure good lighting and try again.`);
            }

        } catch (error) {
            console.error('Face matching error:', error);
            toast.error(error.message || 'Face matching failed');
            setStep(3); // Retry liveness check
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    // Render UI based on step
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/verification-center')}>
                    ← Back
                </button>
                <h1 className={styles.title}>Government ID Verification</h1>
                <div className={styles.stepIndicator}>
                    Step {step} of 5
                </div>
            </div>

            {loading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                    <p>{loadingMessage}</p>
                </div>
            )}

            {/* STEP 1: Age Selection */}
            {step === 1 && (
                <div className={styles.stepContent}>
                    <div className={styles.icon}>🎂</div>
                    <h2>Select Your Age Group</h2>
                    <p>This helps us determine the verification process for you</p>

                    <div className={styles.ageButtons}>
                        <button
                            className={styles.ageBtn}
                            onClick={() => handleAgeSelect(18)}
                        >
                            <span className={styles.ageBtnIcon}>👤</span>
                            <span className={styles.ageBtnText}>18 or above</span>
                            <span className={styles.ageBtnDesc}>Direct verification</span>
                        </button>

                        <button
                            className={styles.ageBtn}
                            onClick={() => handleAgeSelect(15)}
                        >
                            <span className={styles.ageBtnIcon}>👨‍👩‍👦</span>
                            <span className={styles.ageBtnText}>13-17 years</span>
                            <span className={styles.ageBtnDesc}>Requires parent consent</span>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: DigiLocker */}
            {step === 2 && (
                <div className={styles.stepContent}>
                    <div className={styles.icon}>🏛️</div>
                    <h2>Verify with DigiLocker</h2>
                    <p>You will be redirected to the government DigiLocker portal to verify your Aadhaar</p>

                    <div className={styles.infoBox}>
                        <h3>What is DigiLocker?</h3>
                        <ul>
                            <li>✅ Official Indian government service</li>
                            <li>✅ Secure and encrypted</li>
                            <li>✅ Instant verification</li>
                            <li>✅ No documents needed</li>
                        </ul>
                    </div>

                    <button
                        className={styles.primaryBtn}
                        onClick={initiateDigiLocker}
                    >
                        Continue to DigiLocker →
                    </button>
                </div>
            )}

            {/* STEP 3: Liveness Check */}
            {step === 3 && (
                <div className={styles.stepContent}>
                    <div className={styles.icon}>📸</div>
                    <h2>Face Liveness Check</h2>
                    <p>Position your face in the camera and blink once</p>

                    <div className={styles.videoContainer}>
                        <video
                            ref={videoRef}
                            className={styles.video}
                            autoPlay
                            playsInline
                            muted
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        {faceDetected && (
                            <div className={styles.faceOverlay}>
                                <div className={styles.faceCircle}></div>
                            </div>
                        )}

                        {blinkDetected && (
                            <div className={styles.successOverlay}>
                                ✓ Blink detected!
                            </div>
                        )}
                    </div>

                    <div className={styles.instructions}>
                        <p>
                            {!faceDetected && '👀 Position your face in the frame'}
                            {faceDetected && !blinkDetected && '😊 Great! Now blink once'}
                            {blinkDetected && '✅ Perfect! Capturing...'}
                        </p>
                    </div>

                    {!videoRef.current?.srcObject && modelsLoaded && (
                        <button
                            className={styles.primaryBtn}
                            onClick={startLivenessCheck}
                        >
                            Start Camera
                        </button>
                    )}
                </div>
            )}

            {/* STEP 4: Face Matching */}
            {step === 4 && (
                <div className={styles.stepContent}>
                    <div className={styles.icon}>🔍</div>
                    <h2>Verifying Your Face...</h2>
                    <p>Please wait while we match your face with your ID photo</p>

                    <div className={styles.matchingAnimation}>
                        <div className={styles.spinner}></div>
                    </div>
                </div>
            )}

            {/* STEP 5: Success */}
            {step === 5 && (
                <div className={styles.stepContent}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2>Verification Complete!</h2>
                    <p className={styles.successMessage}>
                        Congratulations, {verifiedName}! You have earned the "Verified Human" badge
                    </p>

                    <div className={styles.rewardsBox}>
                        <div className={styles.reward}>
                            <span className={styles.rewardIcon}>🛡️</span>
                            <span className={styles.rewardText}>Verified Human Badge</span>
                        </div>
                        <div className={styles.reward}>
                            <span className={styles.rewardIcon}>⭐</span>
                            <span className={styles.rewardText}>+50 Trust Score</span>
                        </div>
                    </div>

                    <button
                        className={styles.primaryBtn}
                        onClick={() => navigate('/verification-center')}
                    >
                        Back to Verification Center
                    </button>
                </div>
            )}
        </div>
    );
};

export default GovernmentIDVerification;
