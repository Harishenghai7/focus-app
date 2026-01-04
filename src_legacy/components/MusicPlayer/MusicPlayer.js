import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MusicIcon, PlayIcon, PauseIcon } from '../icons';

/**
 * MusicPlayer Component
 * Compact audio player for posts / boltz.
 * Props:
 *  - musicTitle
 *  - musicArtist
 *  - musicUrl (audio stream URL)
 *  - musicLicense (license URL or text)
 *  - compact (boolean) => smaller layout
 */
function MusicPlayer({
  musicTitle,
  musicArtist,
  musicUrl,
  musicLicense,
  compact = true
}) {
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // seconds
  const [duration, setDuration] = useState(0);
  const [hovering, setHovering] = useState(false);

  // Load metadata
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => {
      setDuration(audio.duration || 0);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    return () => audio.removeEventListener('loadedmetadata', onLoaded);
  }, [musicUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      cancelAnimationFrame(rafRef.current);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(updateProgress);
      } catch (e) {
        console.error('Audio play failed', e);
      }
    }
  };

  const updateProgress = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    if (!audio.paused) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleSeek = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const audio = audioRef.current;
    if (audio && duration) {
      audio.currentTime = ratio * duration;
      setProgress(audio.currentTime);
    }
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  if (!musicUrl) return null;

  return (
    <div 
      className={`music-player ${compact ? 'compact' : 'full'}`} 
      onMouseEnter={() => setHovering(true)} 
      onMouseLeave={() => setHovering(false)}
    >
      <div className="mp-left">
        <div className="mp-icon" aria-hidden="true"><MusicIcon size={16} /></div>
        <div className="mp-meta">
          <div className="mp-title" title={musicTitle}>{musicTitle || 'Untitled'}</div>
          <div className="mp-artist" title={musicArtist}>{musicArtist || 'Unknown Artist'}</div>
        </div>
      </div>

      <div className="mp-controls">
        <button
          className="mp-play-btn"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <div
          className="mp-progress"
          ref={progressRef}
          onClick={handleSeek}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={progress}
          aria-label="Audio progress"
        >
          <div className="mp-progress-track">
            <div className="mp-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="mp-time">
          {formatTime(progress)} / {formatTime(duration)}
        </div>
      </div>

      {musicLicense && (
        <a
          href={musicLicense}
          className="mp-license"
          target="_blank"
          rel="noopener noreferrer"
          title="View license"
        >
          License
        </a>
      )}

      <audio
        ref={audioRef}
        src={musicUrl}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        aria-label={`Audio preview for ${musicTitle} by ${musicArtist}`}
      />

      <style>{`
        .music-player { 
          display:flex; flex-direction:column; gap:6px; 
          background:rgba(17,17,17,0.85); color:#eee; 
          border:1px solid #222; border-radius:12px; 
          padding:10px 12px; font-size:12px; width:100%; 
          max-width: 420px; box-shadow:0 4px 12px rgba(0,0,0,0.4);
        }
        .music-player.compact { flex-direction:column; }
        .mp-left { display:flex; align-items:center; gap:10px; }
        .mp-icon { background:#222; padding:6px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#9fa8ff; }
        .mp-meta { display:flex; flex-direction:column; min-width:0; }
        .mp-title { font-weight:600; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mp-artist { font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mp-controls { display:flex; align-items:center; gap:10px; }
        .mp-play-btn { background:#2b2b2b; border:1px solid #333; color:#eee; width:32px; height:32px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .mp-play-btn:hover { background:#3a3a3a; }
        .mp-progress { flex:1; cursor:pointer; }
        .mp-progress-track { position:relative; width:100%; height:6px; background:#262626; border-radius:4px; overflow:hidden; }
        .mp-progress-fill { position:absolute; left:0; top:0; bottom:0; background:#4f46e5; width:0; transition:width 0.15s linear; }
        .mp-time { font-size:10px; color:#bbb; min-width:70px; text-align:right; }
        .mp-license { font-size:10px; color:#4f82ff; text-decoration:none; align-self:flex-end; }
        .mp-license:hover { text-decoration:underline; }
        @media (max-width:600px){
          .music-player { padding:8px 10px; }
          .mp-play-btn { width:28px; height:28px; }
          .mp-time { font-size:9px; }
        }
      `}</style>
    </div>
  );
}

export default MusicPlayer;
