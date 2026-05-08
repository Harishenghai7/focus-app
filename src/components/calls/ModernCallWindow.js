import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Monitor, MonitorOff, Smile } from 'lucide-react';
import { useModernCall } from '../../hooks/useModernCall';
import styles from './ModernCallWindow.module.css';

// Connection Quality Indicator
const QualityIndicator = ({ quality, stats }) => {
    const bars = quality === 'excellent' ? 3 : quality === 'good' ? 2 : quality === 'poor' ? 1 : 0;
    const color = quality === 'excellent' ? '#10B981' : quality === 'good' ? '#F59E0B' : '#ef4444';
    return (
        <div className={styles.qualityIndicator} title={`RTT: ${stats.rtt}ms · Loss: ${stats.packetLoss}%`}>
            {[1, 2, 3].map(i => (
                <div key={i} className={styles.qualityBar} style={{
                    height: `${i * 5 + 3}px`,
                    background: i <= bars ? color : 'rgba(255,255,255,0.2)',
                    transition: 'background 300ms ease'
                }} />
            ))}
        </div>
    );
};

// Floating Reaction
const FloatingReaction = ({ emoji }) => (
    <div className={styles.floatingReaction}>{emoji}</div>
);

// Reaction Picker
const CALL_REACTIONS = ['❤️', '👍', '😂', '🎉', '👏', '🔥'];

const ModernCallWindow = ({ callId, userId, otherUser, isInitiator, audioOnly, onEndCall }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localContainerRef = useRef(null);
    const dragStateRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isEnding, setIsEnding] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [localReactions, setLocalReactions] = useState([]);
    const [pipOffset, setPipOffset] = useState({ right: 24, bottom: 120 });

    const {
        localStream, remoteStream, isConnected, isConnecting,
        isMuted, isVideoOff, remoteEnded, videoDowngraded,
        isScreenSharing, connectionQuality, qualityStats, incomingReactions,
        startCall, answerCall, endCall, toggleMute, toggleVideo,
        startScreenShare, stopScreenShare, sendReaction
    } = useModernCall(userId, callId);

    // Initialize call
    useEffect(() => {
        if (isInitiator) startCall(audioOnly);
        else answerCall(audioOnly);
        return () => { endCall(); };
    }, [callId, isInitiator, audioOnly]);

    // Handle Remote End
    useEffect(() => {
        if (remoteEnded) {
            const timer = setTimeout(() => handleEndCall(), 1500);
            return () => clearTimeout(timer);
        }
    }, [remoteEnded]);

    // Call Duration Timer
    useEffect(() => {
        let interval;
        if (isConnected && !remoteEnded) {
            interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isConnected, remoteEnded]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusText = () => {
        if (remoteEnded) return 'Call Ended';
        if (isEnding) return 'Ending...';
        if (isConnecting) return 'Connecting...';
        if (isConnected) {
            const time = formatDuration(callDuration);
            if (isScreenSharing) return `Screen Sharing · ${time}`;
            return videoDowngraded ? `Audio Only · ${time}` : time;
        }
        return 'Calling...';
    };

    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    // PiP drag handlers
    const handlePipPointerDown = (e) => {
        if (!localContainerRef.current) return;
        const rect = localContainerRef.current.getBoundingClientRect();
        dragStateRef.current = { startX: e.clientX, startY: e.clientY, startRight: pipOffset.right, startBottom: pipOffset.bottom, width: rect.width, height: rect.height };
        try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const handlePipPointerMove = (e) => {
        const s = dragStateRef.current;
        if (!s) return;
        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;
        setPipOffset({
            right: Math.max(8, Math.min(window.innerWidth - s.width - 8, s.startRight - dx)),
            bottom: Math.max(8, Math.min(window.innerHeight - s.height - 8, s.startBottom - dy))
        });
    };
    const handlePipPointerUp = (e) => {
        dragStateRef.current = null;
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    const handleEndCall = () => { setIsEnding(true); endCall(); if (onEndCall) onEndCall(); };

    const handleReaction = useCallback((emoji) => {
        sendReaction(emoji);
        const id = Date.now();
        setLocalReactions(prev => [...prev, { id, emoji }]);
        setTimeout(() => setLocalReactions(prev => prev.filter(r => r.id !== id)), 3000);
        setShowReactionPicker(false);
    }, [sendReaction]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
        else { document.exitFullscreen?.(); setIsFullscreen(false); }
    };

    const handleScreenShare = () => {
        if (isScreenSharing) stopScreenShare();
        else startScreenShare();
    };

    if (isEnding) return null;

    const allReactions = [...incomingReactions, ...localReactions];

    return (
        <div className={styles.callContainer}>
            {/* Floating Reactions */}
            {allReactions.length > 0 && (
                <div className={styles.reactionsContainer}>
                    {allReactions.map(r => <FloatingReaction key={r.id} emoji={r.emoji} />)}
                </div>
            )}

            {/* Audio Call UI */}
            {audioOnly ? (
                <div className={styles.audioContainer}>
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatarPulse} />
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
                        <div className={styles.callStatus}>{getStatusText()}</div>
                        {isConnected && <QualityIndicator quality={connectionQuality} stats={qualityStats} />}
                    </div>
                    {remoteStream && <audio ref={remoteVideoRef} autoPlay />}
                </div>
            ) : (
                <div className={styles.videoGrid}>
                    <div className={styles.remoteVideoContainer}>
                        {remoteStream ? (
                            <video ref={remoteVideoRef} autoPlay playsInline className={styles.remoteVideo} />
                        ) : (
                            <div className={styles.audioContainer}>
                                <div className={styles.avatarWrapper}>
                                    <div className={styles.avatarPulse} />
                                    <div className={styles.avatarPlaceholder}>
                                        {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <h2 className={styles.userName}>Waiting for video...</h2>
                            </div>
                        )}
                        {/* Overlay info */}
                        {isConnected && (
                            <div className={styles.callOverlay}>
                                <div className={styles.overlayInfo}>
                                    <span className={styles.overlayName}>{otherUser?.full_name || otherUser?.username}</span>
                                    <span className={styles.overlayTime}>{getStatusText()}</span>
                                </div>
                                <QualityIndicator quality={connectionQuality} stats={qualityStats} />
                            </div>
                        )}
                    </div>

                    {localStream && (
                        <div
                            ref={localContainerRef}
                            className={styles.localVideoContainer}
                            style={{ right: pipOffset.right, bottom: pipOffset.bottom }}
                            onPointerDown={handlePipPointerDown}
                            onPointerMove={handlePipPointerMove}
                            onPointerUp={handlePipPointerUp}
                            onPointerCancel={handlePipPointerUp}
                        >
                            <video ref={localVideoRef} autoPlay playsInline muted className={styles.localVideo} />
                            {isScreenSharing && <div className={styles.screenShareBadge}>Screen</div>}
                        </div>
                    )}
                </div>
            )}

            {/* Encryption Badge */}
            <div className={styles.encryptionBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>E2E Encrypted</span>
            </div>

            {/* Reaction Picker */}
            {showReactionPicker && (
                <div className={styles.reactionPicker}>
                    {CALL_REACTIONS.map(emoji => (
                        <button key={emoji} className={styles.reactionBtn} onClick={() => handleReaction(emoji)}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Controls Bar */}
            <div className={styles.controlsBar}>
                <button className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {!audioOnly && (
                    <button className={`${styles.controlBtn} ${isVideoOff ? styles.active : ''}`} onClick={toggleVideo} title={isVideoOff ? 'Camera on' : 'Camera off'}>
                        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                )}

                {!audioOnly && (
                    <button className={`${styles.controlBtn} ${isScreenSharing ? styles.screenActive : ''}`} onClick={handleScreenShare} title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                        {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
                    </button>
                )}

                <button className={styles.controlBtn} onClick={() => setShowReactionPicker(!showReactionPicker)} title="Reactions">
                    <Smile size={22} />
                </button>

                <button className={styles.controlBtn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                    {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                </button>

                <button className={`${styles.controlBtn} ${styles.endCallBtn}`} onClick={handleEndCall} title="End call">
                    <PhoneOff size={28} />
                </button>
            </div>
        </div>
    );
};

export default ModernCallWindow;
