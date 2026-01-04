import React, { useState, useRef, useEffect } from 'react';
import { useVideoNotes } from '../../hooks/useVideoNotes';
import Button from '../ui/Button';
import styles from './VideoNoteRecorder.module.css';

const VideoNoteRecorder = ({ conversationId, senderId, receiverId, onClose, onSent }) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const { recording, duration, startRecording, stopRecording, sendVideoNote, maxDuration } = useVideoNotes();
    const [countdown, setCountdown] = useState(3);
    const [showCountdown, setShowCountdown] = useState(false);

    useEffect(() => {
        initCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const initCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 720, height: 720 },
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    const handleStartRecording = () => {
        setShowCountdown(true);
        let count = 3;
        const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
                clearInterval(interval);
                setShowCountdown(false);
                startRecording();
            }
        }, 1000);
    };

    const handleStopAndSend = async () => {
        stopRecording();
        const result = await sendVideoNote(conversationId, senderId, receiverId);
        if (result) {
            onSent?.();
            onClose();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Video Note</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.videoContainer}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={styles.video}
                    />

                    {showCountdown && (
                        <div className={styles.countdown}>{countdown}</div>
                    )}

                    {recording && (
                        <div className={styles.recordingIndicator}>
                            <div className={styles.recordingDot}></div>
                            <span>{formatTime(duration)} / {formatTime(maxDuration)}</span>
                        </div>
                    )}
                </div>

                <div className={styles.controls}>
                    {!recording ? (
                        <Button
                            variant="primary"
                            onClick={handleStartRecording}
                            fullWidth
                            disabled={!stream}
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="8" fill="currentColor" />
                            </svg>
                            Start Recording
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            onClick={handleStopAndSend}
                            fullWidth
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="4" y="4" width="12" height="12" rx="2" fill="currentColor" />
                            </svg>
                            Stop & Send
                        </Button>
                    )}
                </div>

                <div className={styles.info}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M8 4v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Video notes are limited to {maxDuration} seconds</span>
                </div>
            </div>
        </div>
    );
};

export default VideoNoteRecorder;
