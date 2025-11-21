import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './AudioPlayer.module.css';

/**
 * AudioPlayer - Plays audio files with play/pause and seek controls.
 * @component
 * @param {string} audioUrl - URL of the audio file
 * @param {number} duration - Duration of the audio
 * @returns {React.ReactElement}
 */
const AudioPlayer = React.memo(function AudioPlayer({ audioUrl, duration }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.audioPlayer}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      <div className={styles.audioProgressContainer} onClick={handleSeek} role="slider" aria-label="Audio progress" tabIndex={0}>
        <div
          className={styles.audioProgressBar}
          style={{ width: `${(currentTime / audioRef.current?.duration || 0) * 100}%` }}
        ></div>
      </div>

      <span className={styles.audioTime}>
        {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || duration)}
      </span>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';
AudioPlayer.propTypes = {
  audioUrl: PropTypes.string.isRequired,
  duration: PropTypes.number.isRequired
};

export default AudioPlayer;
