import React, { useState, useRef } from 'react';
import './AudioPlayer.css';

export default function AudioPlayer({ audioUrl, duration }) {
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
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <button className="play-btn" onClick={togglePlay}>
        {isPlaying ? '⏸️' : '▶️'}
      </button>

      <div className="audio-progress-container" onClick={handleSeek}>
        <div
          className="audio-progress-bar"
          style={{ width: `${(currentTime / audioRef.current?.duration || 0) * 100}%` }}
        ></div>
      </div>

      <span className="audio-time">
        {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || duration)}
      </span>
    </div>
  );
}
