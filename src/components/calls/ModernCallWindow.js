import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { useModernCall } from '../../hooks/useModernCall';
import styles from './ModernCallWindow.module.css';

/**
 * Modern Call Window - Lavender Design System
 * Beautiful, professional 1-on-1 call interface
 */
const ModernCallWindow = ({
    callId,
    userId,
    otherUser,
    isInitiator,
    audioOnly,
    onEndCall
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localContainerRef = useRef(null);
    const dragStateRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    // Draggable PiP: percentage offsets from bottom-right
    const [pipOffset, setPipOffset] = useState({ right: 24, bottom: 120 });

    const {
        localStream,
        remoteStream,
        isConnected,
        isConnecting,
        isMuted,
        isVideoOff,
        remoteEnded,
        videoDowngraded,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo
    } = useModernCall(userId, callId);

    // Initialize call
    useEffect(() => {


        if (isInitiator) {

            startCall(audioOnly);
        } else {

            answerCall(audioOnly);
        }

        return () => {

            endCall();
        };
    }, [callId, isInitiator, audioOnly]);

    // Handle Remote End
    useEffect(() => {
        if (remoteEnded) {

            // Wait 1.5s to show "Call Ended" status, then close
            const timer = setTimeout(() => {
                handleEndCall();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [remoteEnded]);

    // Call Duration Timer
    useEffect(() => {
        let interval;
        if (isConnected && !remoteEnded) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isConnected, remoteEnded]);

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get Status Text
    const getStatusText = () => {
        if (remoteEnded) return 'Call Ended';
        if (isEnding) return 'Ending...';
        if (isConnecting) return 'Connecting...';
        if (isConnected) {
            const time = formatDuration(callDuration);
            return videoDowngraded ? `Audio Only · ${time}` : time;
        }
        return 'Calling...';
    };

    // Set local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Set remote video stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {

            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Draggable PiP — pointer-driven, clamps to viewport
    const handlePipPointerDown = (e) => {
        if (!localContainerRef.current) return;
        const rect = localContainerRef.current.getBoundingClientRect();
        dragStateRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startRight: pipOffset.right,
            startBottom: pipOffset.bottom,
            width: rect.width,
            height: rect.height
        };
        try { e.target.setPointerCapture(e.pointerId); } catch (_) { }
    };

    const handlePipPointerMove = (e) => {
        const s = dragStateRef.current;
        if (!s) return;
        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;
        const maxRight = window.innerWidth - s.width - 8;
        const maxBottom = window.innerHeight - s.height - 8;
        const nextRight = Math.max(8, Math.min(maxRight, s.startRight - dx));
        const nextBottom = Math.max(8, Math.min(maxBottom, s.startBottom - dy));
        setPipOffset({ right: nextRight, bottom: nextBottom });
    };

    const handlePipPointerUp = (e) => {
        dragStateRef.current = null;
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) { }
    };

    const handleEndCall = () => {

        setIsEnding(true); // Hide immediately
        endCall();
        if (onEndCall) onEndCall();
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    if (isEnding) return null;

    return (
        <div className={styles.callContainer}>
            {/* Audio Call UI */}
            {audioOnly ? (
                <div className={styles.audioContainer}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatarPulse}></div>
                        {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt={otherUser.username} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>
                    <div className={styles.userInfo}>
                        <h2 className={styles.userName}>{otherUser?.full_name || otherUser?.username || 'User'}</h2>
                        <div className={styles.callStatus}>
                            {getStatusText()}
                        </div>
                    </div>
                    {/* Hidden audio element for remote stream */}
                    {remoteStream && (
                        <audio ref={remoteVideoRef} autoPlay />
                    )}
                </div>
            ) : (
                /* Video Call UI */
                <div className={styles.videoGrid}>
                    {/* Remote Video (Full Screen) */}
                    <div className={styles.remoteVideoContainer}>
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className={styles.remoteVideo}
                            />
                        ) : (
                            <div className={styles.audioContainer}>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.avatarPulse}></div>
                                    <div className={styles.avatarPlaceholder}>
                                        {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <h2 className={styles.userName}>Waiting for video...</h2>
                            </div>
                        )}
                    </div>

                    {/* Local Video (PiP — draggable) */}
                    {localStream && (
                        <div
                            ref={localContainerRef}
                            className={styles.localVideoContainer}
                            style={{ right: pipOffset.right, bottom: pipOffset.bottom }}
                            onPointerDown={handlePipPointerDown}
                            onPointerMove={handlePipPointerMove}
                            onPointerUp={handlePipPointerUp}
                            onPointerCancel={handlePipPointerUp}
                            role="button"
                            aria-label="Drag your video preview"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={styles.localVideo}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Controls Bar */}
            <div className={styles.controlsBar}>
                {/* Mute Button */}
                <button
                    className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {/* Video Toggle (if not audio-only) */}
                {!audioOnly && (
                    <button
                        className={`${styles.controlBtn} ${isVideoOff ? styles.active : ''}`}
                        onClick={toggleVideo}
                        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                )}

                {/* Fullscreen Toggle */}
                <button
                    className={styles.controlBtn}
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                </button>

                {/* End Call Button */}
                <button
                    className={`${styles.controlBtn} ${styles.endCallBtn}`}
                    onClick={handleEndCall}
                    title="End call"
                >
                    <PhoneOff size={32} />
                </button>
            </div>
        </div>
    );
};

export default ModernCallWindow;
