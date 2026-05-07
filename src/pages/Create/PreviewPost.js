import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PreviewPost.module.css';
import Button from '../../components/ui/Button';
import { ArrowLeft, Calendar, Music, Play, Pause, ShieldAlert, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { usePublish } from '../../hooks/usePublish';
import { useNavigate } from 'react-router-dom';
import { useSovereignForge } from '../../context/SovereignForgeContext';
import { useSovereignGuard } from '../../hooks/useSovereignGuard';
import { SovereignGuardAlert } from '../../components/moderation';
import { motion, AnimatePresence } from 'framer-motion';

// Purity Gate Status Component
const PurityGateStatus = ({ status, violations, warnings, onDismiss }) => {
    if (status === 'scanning') {
        return (
            <motion.div
                className={styles.purityGate}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.purityScanning}>
                    <Loader2 size={24} className={styles.spinIcon} />
                    <span>Running Purity Check...</span>
                </div>
            </motion.div>
        );
    }

    if (status === 'blocked') {
        return (
            <motion.div
                className={`${styles.purityGate} ${styles.purityBlocked}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className={styles.purityIcon}>
                    <ShieldAlert size={32} />
                </div>
                <div className={styles.purityContent}>
                    <h4>Content Blocked</h4>
                    <p>Your content violates our community guidelines.</p>
                    {violations.length > 0 && (
                        <ul className={styles.violationList}>
                            {violations.map((v, i) => (
                                <li key={i}>
                                    <AlertTriangle size={14} />
                                    {v.type.replace(/_/g, ' ')}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </motion.div>
        );
    }

    if (status === 'warning' && warnings.length > 0) {
        return (
            <motion.div
                className={`${styles.purityGate} ${styles.purityWarning}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={styles.purityIcon}>
                    <AlertTriangle size={24} />
                </div>
                <div className={styles.purityContent}>
                    <h4>Content Warning</h4>
                    <ul className={styles.warningList}>
                        {warnings.map((w, i) => (
                            <li key={i}>{w.type.replace(/_/g, ' ')}</li>
                        ))}
                    </ul>
                </div>
                <button className={styles.dismissBtn} onClick={onDismiss}>Dismiss</button>
            </motion.div>
        );
    }

    if (status === 'passed') {
        return (
            <motion.div
                className={`${styles.purityGate} ${styles.purityPassed}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ShieldCheck size={20} />
                <span>Purity Verified</span>
            </motion.div>
        );
    }

    return null;
};

const PreviewPost = ({ mediaFiles, details, music, createMode, onBack, onUpdateDetails, shadowUploadUrls }) => {
    const navigate = useNavigate();
    const { publish, loading: publishLoading, error: publishError } = usePublish();
    const { runPurityCheck } = useSovereignForge();
    const { moderateContent, showIntervention, interventionData, closeIntervention } = useSovereignGuard();

    const [showConfetti, setShowConfetti] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(null);
    const [purityStatus, setPurityStatus] = useState('idle');
    const [purityViolations, setPurityViolations] = useState([]);
    const [purityWarnings, setPurityWarnings] = useState([]);
    const [canPublish, setCanPublish] = useState(false);

    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const purityChecked = useRef(false);

    const currentMedia = mediaFiles[0];
    const isVideo = currentMedia?.type === 'video';
    const edits = currentMedia?.edits || {};

    // Cleanup audio/video on unmount
    useEffect(() => {
        const currentVideo = videoRef.current;
        const currentAudio = audioRef.current;
        return () => {
            try {
                if (currentVideo) {
                    currentVideo.pause();
                    currentVideo.currentTime = 0;
                }
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            } catch (err) {

            }
        };
    }, []);

    // Sync audio with video time (only while playing)
    useEffect(() => {
        const currentVideo = videoRef.current;
        const currentAudio = audioRef.current;
        if (!currentVideo || !currentAudio || !music || !isPlaying) return;

        let syncTimeout;

        const handleTimeUpdate = () => {
            if (currentAudio && currentVideo && isPlaying) {
                const timeDiff = Math.abs(currentAudio.currentTime - currentVideo.currentTime);
                // Resync if drift is more than 1 second
                if (timeDiff > 1) {
                    try {
                        currentAudio.currentTime = currentVideo.currentTime;
                    } catch (err) {
                        // Ignore sync errors
                    }
                }
            }
        };

        currentVideo.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            if (currentVideo) {
                currentVideo.removeEventListener('timeupdate', handleTimeUpdate);
            }
            if (syncTimeout) {
                clearTimeout(syncTimeout);
            }
        };
    }, [music?.id, isPlaying]);

    // Handle video loading
    useEffect(() => {
        const currentVideo = videoRef.current;
        if (currentVideo && isVideo) {

            const handleLoadedData = () => {



            };

            const handleError = (e) => {
                console.error('Video loading error:', e);
                console.error('Video error details:', currentVideo.error);
                setVideoError('Failed to load video. The exported file may be corrupted.');
            };

            const handleCanPlay = () => {

            };

            currentVideo.addEventListener('loadeddata', handleLoadedData);
            currentVideo.addEventListener('error', handleError);
            currentVideo.addEventListener('canplay', handleCanPlay);

            return () => {
                currentVideo.removeEventListener('loadeddata', handleLoadedData);
                currentVideo.removeEventListener('error', handleError);
                currentVideo.removeEventListener('canplay', handleCanPlay);
            };
        }
    }, [currentMedia, edits.file, isVideo]);

    // Check if video has been exported (edits baked in)
    const hasExportedFile = edits.file && edits.isEdited;

    // Get the video source - use edited file if available, otherwise original preview
    const getVideoSource = () => {
        if (edits.file) {

            const url = URL.createObjectURL(edits.file);

            return url;
        }

        return currentMedia.preview;
    };

    // Build filter string from edits (only apply if not already baked into exported file)
    const getFilterStyle = () => {
        if (hasExportedFile || !edits.filters) return 'none';
        const { brightness = 100, contrast = 100, saturate = 100, hueRotate = 0, sepia = 0, blur = 0 } = edits.filters;
        return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%) blur(${blur}px)`;
    };

    // Build crop clip-path from edits (only apply if not already baked into exported file)
    const getCropStyle = () => {
        if (hasExportedFile || !edits.crop) return 'none';
        const { x = 0, y = 0, width = 100, height = 100 } = edits.crop;
        return `inset(${y}% ${100 - x - width}% ${100 - y - height}% ${x}%)`;
    };

    const togglePlay = () => {
        if (!videoRef.current) {

            return;
        }





        try {
            if (isPlaying) {
                // Pause both

                videoRef.current.pause();
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
            } else {
                // Play both - with minimal delay

                const videoPromise = videoRef.current.play();

                if (videoPromise) {
                    videoPromise.then(() => {

                        setIsPlaying(true);
                    }).catch(err => {
                        console.error('Video play failed:', err);
                        setIsPlaying(false);
                    });
                }

                if (audioRef.current && music) {

                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(err => {

                    });
                }
            }
        } catch (err) {
            console.error('Toggle play error:', err);
        }
    };

    // Purity Gate Check - Run once on mount
    useEffect(() => {
        if (purityChecked.current) return;
        purityChecked.current = true;

        const runCheck = async () => {
            setPurityStatus('scanning');

            const content = {
                mediaFiles: mediaFiles.map(m => m.file).filter(Boolean),
                caption: details.caption,
                type: createMode
            };

            const results = await runPurityCheck(content);

            if (results.blocked) {
                setPurityStatus('blocked');
                setPurityViolations(results.violations || []);
                setCanPublish(false);
            } else if (results.warnings && results.warnings.length > 0) {
                setPurityStatus('warning');
                setPurityWarnings(results.warnings);
                setCanPublish(true);
            } else if (results.passed) {
                setPurityStatus('passed');
                setCanPublish(true);
            } else {
                setPurityStatus('error');
                setCanPublish(false);
            }
        };

        runCheck();
    }, [mediaFiles, details.caption, createMode, runPurityCheck]);

    const handleDismissWarning = () => {
        setPurityStatus('passed');
    };

    const handlePublish = async () => {
        if (!canPublish) return;

        const guard = await moderateContent({
            text: details?.caption || '',
            mediaFiles: mediaFiles.map(m => m.file).filter(Boolean),
            contentType: createMode || 'post',
        });

        if (guard?.blocked) {
            return;
        }

        // Use shadow uploaded URLs if available
        const mediaWithUrls = mediaFiles
            .filter(file => file != null)
            .map((file, index) => ({
                ...file,
                shadowUrl: shadowUploadUrls?.[index]?.publicUrl
            }));

        const success = await publish(mediaWithUrls, details, music, createMode);
        if (success) {
            setShowConfetti(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        }
    };

    const getPublishButtonState = () => {
        if (publishLoading) return { text: 'Publishing...', disabled: true, className: '' };
        if (purityStatus === 'scanning') return { text: 'Verifying...', disabled: true, className: styles.verifyingBtn };
        if (purityStatus === 'blocked') return { text: 'Cannot Publish', disabled: true, className: styles.blockedBtn };
        if (purityStatus === 'warning') return { text: 'Publish Anyway', disabled: false, className: styles.warningBtn };
        if (!canPublish) return { text: 'Share', disabled: true, className: '' };
        return { text: 'Share', disabled: false, className: styles.publishBtn };
    };

    const publishButtonState = getPublishButtonState();

    return (
        <div className={styles.sovereignPreview}>
            {/* Purity Gate Status */}
            <AnimatePresence>
                {purityStatus !== 'idle' && (
                    <PurityGateStatus
                        status={purityStatus}
                        violations={purityViolations}
                        warnings={purityWarnings}
                        onDismiss={handleDismissWarning}
                    />
                )}
            </AnimatePresence>

            <div className={styles.header}>
                <Button variant="ghost" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <h2>Preview & Share ({createMode || 'unknown'})</h2>
                <Button
                    onClick={handlePublish}
                    disabled={publishButtonState.disabled}
                    className={publishButtonState.className}
                >
                    {publishButtonState.text}
                </Button>
            </div>

            <div className={styles.content}>
                <div className={styles.previewCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatar} />
                        <div className={styles.headerInfo}>
                            <span className={styles.username}>You</span>
                            {music && (music.name || music.artist_name) && (
                                <div className={styles.musicTag}>
                                    <Music size={12} />
                                    <span>{music.name || 'Unknown Track'} • {music.artist_name || 'Unknown Artist'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.mediaWrapper}>
                        {videoError ? (
                            <div className={styles.errorContainer}>
                                <p className={styles.errorText}>{videoError}</p>
                                <button
                                    className={styles.retryBtn}
                                    onClick={() => {
                                        setVideoError(null);
                                        if (videoRef.current) {
                                            videoRef.current.load();
                                        }
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : isVideo ? (
                            <div className={styles.videoContainer}>
                                <video
                                    ref={videoRef}
                                    src={getVideoSource()}
                                    className={styles.media}
                                    style={{
                                        filter: getFilterStyle(),
                                        clipPath: getCropStyle()
                                    }}
                                    onEnded={() => {

                                        setIsPlaying(false);
                                        if (audioRef.current) {
                                            audioRef.current.pause();
                                        }
                                    }}
                                    onPlay={() => {

                                        setIsPlaying(true);
                                    }}
                                    onPause={() => {

                                        setIsPlaying(false);
                                    }}
                                    onError={(e) => {
                                        console.error('Video element error:', e);
                                    }}
                                    onLoadStart={() => {

                                    }}
                                    preload="metadata"
                                    playsInline
                                    muted={!music} // Only mute if no music
                                />
                                <div className={styles.playOverlay} onClick={togglePlay}>
                                    {isPlaying ? <Pause size={48} /> : <Play size={48} fill="white" />}
                                </div>
                                {music && (
                                    <audio
                                        ref={audioRef}
                                        src={music.audio}
                                        loop
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>
                        ) : (
                            <img
                                src={currentMedia.preview}
                                className={styles.media}
                                style={{
                                    filter: edits.filter !== 'none'
                                        ? `url(#${edits.filter})`
                                        : 'none'
                                }}
                                alt="Preview"
                            />
                        )}
                    </div>

                    <div className={styles.captionInput}>
                        <textarea
                            className={styles.captionTextarea}
                            placeholder="Write a caption..."
                            value={details.caption || ''}
                            onChange={(e) => {
                                onUpdateDetails({ ...details, caption: e.target.value });
                            }}
                            maxLength={2200}
                            rows={3}
                        />
                        <div className={styles.captionCount}>
                            {(details.caption || '').length}/2200
                        </div>
                    </div>

                    <div className={styles.cardFooter}>
                        {details.caption && (
                            <p className={styles.caption}>
                                <span className={styles.username}>You</span> {details.caption}
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button variant="secondary" className={styles.actionBtn}>
                        <Calendar size={18} /> Schedule
                    </Button>
                    <Button variant="secondary" className={styles.actionBtn}>
                        Save Draft
                    </Button>
                </div>

                {publishError && <p className={styles.error}>{publishError}</p>}
            </div>

            <SovereignGuardAlert
                isOpen={showIntervention}
                onClose={closeIntervention}
                onEdit={closeIntervention}
                violations={interventionData?.violations || purityViolations}
                purityScore={interventionData?.purityScore || 0}
                strikeNumber={interventionData?.strikeNumber || 0}
            />
        </div>
    );
};

export default PreviewPost;
