import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CallControls from './CallControls';
import './ActiveCallModal.css';

export default function ActiveCallModal({
  call,
  localStream,
  remoteStream,
  callStatus,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onSwitchCamera,
}) {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, fair, poor
  const [isPiPMode, setIsPiPMode] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const isVideo = call?.call_type === 'video';
  const otherUser = call?.caller_id === call?.currentUserId ? call?.receiver : call?.caller;

  // Setup video streams
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideo) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideo]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle toggle audio
  const handleToggleAudio = () => {
    const newMutedState = onToggleAudio();
    setIsAudioMuted(newMutedState);
  };

  // Handle toggle video
  const handleToggleVideo = () => {
    const newVideoOffState = onToggleVideo();
    setIsVideoOff(newVideoOffState);
  };

  // Handle switch camera
  const handleSwitchCamera = async () => {
    try {
      await onSwitchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  // Picture-in-Picture mode
  const togglePiP = async () => {
    if (!remoteVideoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPMode(false);
      } else {
        await remoteVideoRef.current.requestPictureInPicture();
        setIsPiPMode(true);
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // Monitor PiP state
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiPMode(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, []);

  // Simulate connection quality monitoring
  useEffect(() => {
    const checkQuality = () => {
      // In a real implementation, this would check actual connection stats
      const qualities = ['good', 'fair', 'poor'];
      const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
      setConnectionQuality(randomQuality);
    };

    const qualityInterval = setInterval(checkQuality, 5000);
    return () => clearInterval(qualityInterval);
  }, []);

  if (!call) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="active-call-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {isVideo ? (
          // Video Call UI
          <div className="video-call-container">
            {/* Remote video (full screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />

            {/* Local video (picture-in-picture) */}
            {!isVideoOff && (
              <motion.div
                className="local-video-container"
                drag
                dragConstraints={{
                  top: 0,
                  left: 0,
                  right: window.innerWidth - 150,
                  bottom: window.innerHeight - 200,
                }}
                dragElastic={0.1}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="local-video"
                />
              </motion.div>
            )}

            {/* Call info overlay */}
            <div className="call-info-overlay">
              <div className="call-info-header">
                <div className="user-info">
                  <h3>{otherUser?.full_name || otherUser?.username}</h3>
                  <div className="call-status-info">
                    <span className="call-duration">{formatDuration(callDuration)}</span>
                    <span className="connection-quality">
                      <span className={`quality-indicator ${connectionQuality}`}></span>
                      {connectionQuality === 'good' && 'HD'}
                      {connectionQuality === 'fair' && 'SD'}
                      {connectionQuality === 'poor' && 'Poor'}
                    </span>
                  </div>
                </div>

                {/* PiP button */}
                {document.pictureInPictureEnabled && (
                  <button className="pip-btn" onClick={togglePiP} title="Picture-in-Picture">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Audio Call UI
          <div className="audio-call-container">
            <div className="audio-call-content">
              <motion.div
                className="caller-avatar-large"
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={otherUser?.avatar_url || `https://ui-avatars.com/api/?name=${otherUser?.username}&size=300`}
                  alt={otherUser?.username}
                />
              </motion.div>

              <h2 className="caller-name">{otherUser?.full_name || otherUser?.username}</h2>
              <p className="caller-username">@{otherUser?.username}</p>

              <div className="call-status-display">
                <span className={`status-text ${callStatus}`}>
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'ringing' && 'Ringing...'}
                  {callStatus === 'connected' && formatDuration(callDuration)}
                </span>
                <span className="connection-quality-text">
                  <span className={`quality-dot ${connectionQuality}`}></span>
                  {connectionQuality === 'good' && 'Excellent connection'}
                  {connectionQuality === 'fair' && 'Fair connection'}
                  {connectionQuality === 'poor' && 'Poor connection'}
                </span>
              </div>

              {/* Audio visualizer placeholder */}
              <div className="audio-visualizer">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="visualizer-bar"
                    animate={{
                      height: ['20%', '80%', '20%'],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <CallControls
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          callType={call.call_type}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onSwitchCamera={handleSwitchCamera}
          onEndCall={onEndCall}
          showSwitchCamera={isVideo && 'mediaDevices' in navigator}
        />
      </motion.div>
    </AnimatePresence>
  );
}
