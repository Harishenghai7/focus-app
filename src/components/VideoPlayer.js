import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VideoPlayer.css';

/**
 * VideoPlayer Component
 * Displays live video stream
 */
const VideoPlayer = ({ stream, isLive = false, isBroadcaster = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-player-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isBroadcaster} // Mute own video to prevent echo
        className={`video-player ${isLive ? 'live' : ''}`}
      />
      {!stream && (
        <div className="video-placeholder">
          <i className="fas fa-video-slash"></i>
          <p>Waiting for stream...</p>
        </div>
      )}
    </div>
  );
};

VideoPlayer.propTypes = {
  stream: PropTypes.object,
  isLive: PropTypes.bool,
  isBroadcaster: PropTypes.bool
};

export default VideoPlayer;
