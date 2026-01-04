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
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

    const {
        localStream,
        remoteStream,
        isConnected,
        isConnecting,
        isMuted,
        isVideoOff,
        remoteEnded,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleVideo
    } = useModernCall(userId, callId);

    // Initialize call
    useEffect(() => {
        console.log('🎬 ModernCallWindow mounted', { callId, isInitiator });

        if (isInitiator) {
            console.log('📞 Starting call as initiator...');
            startCall(audioOnly);
        } else {
            console.log('📞 Answering call...');
            answerCall(audioOnly);
        }

        return () => {
            console.log('🧹 ModernCallWindow unmounting');
            endCall();
        };
    }, [callId, isInitiator, audioOnly]);

    // Handle Remote End
    useEffect(() => {
        if (remoteEnded) {
            console.log('👋 Remote ended call, closing window...');
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
        if (isConnected) return formatDuration(callDuration);
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
            console.log('📺 Setting remote stream to video element');
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleEndCall = () => {
        console.log('🛑 End call clicked - hiding window immediately');
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

                    {/* Local Video (PiP) */}
                    {localStream && (
                        <div className={styles.localVideoContainer}>
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
