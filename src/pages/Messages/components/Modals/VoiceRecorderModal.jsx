/* ═══════════════════════════════════════════════════════════════════════
   VOICE RECORDER MODAL - Record voice messages with waveform
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useRef } from 'react';
import VoiceRecorder, { uploadVoiceMessage } from '../../utils/voiceRecorder';
import { formatVoiceDuration } from '../../utils/messageHelpers';
import styles from './VoiceRecorderModal.module.css';

const VoiceRecorderModal = ({ onClose, onSend, currentUserId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const recorderRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        recorderRef.current = new VoiceRecorder();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (recorderRef.current) recorderRef.current.cancelRecording();
        };
    }, []);

    const startRecording = async () => {
        try {
            await recorderRef.current.startRecording();
            setIsRecording(true);

            // Update duration every second
            intervalRef.current = setInterval(() => {
                setDuration(recorderRef.current.getDuration());
            }, 100);
        } catch (error) {
            alert(error.message);
        }
    };

    const stopRecording = async () => {
        try {
            const result = await recorderRef.current.stopRecording();
            setAudioBlob(result.blob);
            setAudioUrl(result.url);
            setDuration(result.duration);
            setIsRecording(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
        } catch (error) {
            console.error('Error stopping recording:', error);
        }
    };

    const cancelRecording = () => {
        recorderRef.current.cancelRecording();
        if (intervalRef.current) clearInterval(intervalRef.current);
        onClose();
    };

    const handleSend = async () => {
        if (!audioBlob) return;

        try {
            setUploading(true);
            const messageId = crypto.randomUUID();

            const { url, duration: voiceDuration } = await uploadVoiceMessage(
                audioBlob,
                currentUserId,
                messageId,
                duration
            );

            await onSend(null, {
                type: 'voice',
                voice_url: url,
                voice_duration: voiceDuration
            });

            onClose();
        } catch (error) {
            console.error('Error sending voice message:', error);
            alert('Failed to send voice message');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={cancelRecording}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>Voice Message</h2>
                    <button onClick={cancelRecording} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                {/* Recording Area */}
                <div className={styles.recordingArea}>
                    {/* Waveform Visualization */}
                    <div className={styles.waveform}>
                        {isRecording ? (
                            <div className={styles.recordingAnimation}>
                                <div className={styles.wave}></div>
                                <div className={styles.wave}></div>
                                <div className={styles.wave}></div>
                                <div className={styles.wave}></div>
                                <div className={styles.wave}></div>
                            </div>
                        ) : audioUrl ? (
                            <audio src={audioUrl} controls className={styles.audioPlayer} />
                        ) : (
                            <div className={styles.micIcon}>
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="currentColor" strokeWidth="2" />
                                    <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Duration */}
                    <div className={styles.duration}>
                        {formatVoiceDuration(duration)}
                    </div>

                    {/* Status Text */}
                    <p className={styles.statusText}>
                        {isRecording ? 'Recording...' : audioUrl ? 'Preview your recording' : 'Tap to start recording'}
                    </p>
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    {!audioUrl ? (
                        <>
                            {!isRecording ? (
                                <button onClick={startRecording} className={styles.recordButton}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                                    </svg>
                                    <span>Start Recording</span>
                                </button>
                            ) : (
                                <>
                                    <button onClick={cancelRecording} className={styles.cancelButton}>
                                        Cancel
                                    </button>
                                    <button onClick={stopRecording} className={styles.stopButton}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <rect x="6" y="6" width="12" height="12" fill="currentColor" />
                                        </svg>
                                        <span>Stop</span>
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <button onClick={() => {
                                setAudioBlob(null);
                                setAudioUrl(null);
                                setDuration(0);
                            }} className={styles.retryButton}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <span>Re-record</span>
                            </button>
                            <button onClick={handleSend} className={styles.sendButton} disabled={uploading}>
                                {uploading ? 'Sending...' : 'Send'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceRecorderModal;
