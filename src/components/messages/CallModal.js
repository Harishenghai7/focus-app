import React, { useState, useEffect, useRef } from 'react';
import { focusToast } from '../../utils/focusToast';
import styles from './CallModal.module.css';

const CallModal = ({ type = 'audio', user, onClose, onAnswer, onDecline, isIncoming = false }) => {
    const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isIncoming) {
            initializeCall();
        }

        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [callStatus]);

    const initializeCall = async () => {
        try {
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });

            localStreamRef.current = stream;

            if (type === 'video' && localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Initialize WebRTC peer connection
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            };

            peerConnectionRef.current = new RTCPeerConnection(configuration);

            // Add local stream to peer connection
            stream.getTracks().forEach(track => {
                peerConnectionRef.current.addTrack(track, stream);
            });

            // Handle remote stream
            peerConnectionRef.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
                setCallStatus('connected');
            };

            // Handle ICE candidates
            peerConnectionRef.current.onicecandidate = (event) => {
                if (event.candidate) {
                    // Send ICE candidate to remote peer via signaling server

                }
            };

            // Create and send offer
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);

            // Send offer to remote peer via signaling server


            // Simulate connection for demo
            setTimeout(() => {
                setCallStatus('connected');
            }, 2000);

        } catch (error) {
            console.error('Error initializing call:', error);
            focusToast.error('Failed to access camera/microphone');
            onClose();
        }
    };

    const handleAnswer = async () => {
        setCallStatus('connecting');
        await initializeCall();
        onAnswer?.();
    };

    const handleDecline = () => {
        cleanup();
        onDecline?.();
        onClose();
    };

    const handleEndCall = () => {
        cleanup();
        onClose();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current && type === 'video') {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div className={styles.overlay}>
            <div className={`${styles.modal} ${type === 'video' ? styles.videoCall : styles.audioCall}`}>
                {type === 'video' && callStatus === 'connected' && (
                    <div className={styles.videoContainer}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={styles.remoteVideo}
                        />
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.localVideo}
                        />
                    </div>
                )}

                <div className={styles.callInfo}>
                    <div className={styles.avatar}>
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>

                    <h3 className={styles.username}>{user?.username}</h3>

                    <div className={styles.status}>
                        {callStatus === 'incoming' && <span>Incoming {type} call...</span>}
                        {callStatus === 'connecting' && (
                            <>
                                <div className={styles.pulseRing}></div>
                                <span>Connecting...</span>
                            </>
                        )}
                        {callStatus === 'connected' && (
                            <span className={styles.duration}>{formatDuration(duration)}</span>
                        )}
                    </div>
                </div>

                <div className={styles.controls}>
                    {callStatus === 'incoming' ? (
                        <>
                            <button className={styles.declineButton} onClick={handleDecline}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                                </svg>
                                Decline
                            </button>
                            <button className={styles.answerButton} onClick={handleAnswer}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                                </svg>
                                Answer
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
                                onClick={toggleMute}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    {isMuted ? (
                                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                                    ) : (
                                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                                    )}
                                </svg>
                            </button>

                            {type === 'video' && (
                                <button
                                    className={`${styles.controlButton} ${isVideoOff ? styles.active : ''}`}
                                    onClick={toggleVideo}
                                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        {isVideoOff ? (
                                            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                                        ) : (
                                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                                        )}
                                    </svg>
                                </button>
                            )}

                            <button className={styles.endCallButton} onClick={handleEndCall}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                                </svg>
                                End Call
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallModal;
