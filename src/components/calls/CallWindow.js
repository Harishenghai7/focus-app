import React, { useEffect, useRef } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import styles from './CallWindow.module.css';

const CallWindow = ({
    localStream,
    remoteStream,
    isConnected,
    otherUser,
    callType,
    onEndCall,
    onToggleAudio,
    onToggleVideo
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isAudioEnabled, setIsAudioEnabled] = React.useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = React.useState(callType === 'video');

    // Attach local stream to video element
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const handleToggleAudio = () => {
        const enabled = onToggleAudio();
        setIsAudioEnabled(enabled);
    };

    const handleToggleVideo = () => {
        const enabled = onToggleVideo();
        setIsVideoEnabled(enabled);
    };

    return (
        <div className={styles.callWindow}>
            {/* Remote video (full screen) */}
            <div className={styles.remoteVideoContainer}>
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={styles.remoteVideo}
                    />
                ) : (
                    <div className={styles.waitingState}>
                        <div className={styles.avatar}>
                            {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.username} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {otherUser?.username?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <h2>{otherUser?.full_name || otherUser?.username}</h2>
                        <p className={styles.status}>
                            {isConnected ? 'Connected' : 'Connecting...'}
                        </p>
                    </div>
                )}
            </div>

            {/* Local video (picture-in-picture) */}
            {callType === 'video' && localStream && (
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

            {/* Call controls */}
            <div className={styles.controls}>
                <button
                    className={`${styles.controlBtn} ${!isAudioEnabled ? styles.disabled : ''}`}
                    onClick={handleToggleAudio}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                    {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>

                {callType === 'video' && (
                    <button
                        className={`${styles.controlBtn} ${!isVideoEnabled ? styles.disabled : ''}`}
                        onClick={handleToggleVideo}
                        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                )}

                <button
                    className={`${styles.controlBtn} ${styles.endCall}`}
                    onClick={onEndCall}
                    title="End call"
                >
                    <PhoneOff size={24} />
                </button>
            </div>

            {/* Connection status indicator */}
            {!isConnected && (
                <div className={styles.connectionStatus}>
                    <div className={styles.spinner}></div>
                    <span>Connecting...</span>
                </div>
            )}
        </div>
    );
};

export default CallWindow;
