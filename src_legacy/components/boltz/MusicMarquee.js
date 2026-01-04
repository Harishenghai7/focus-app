import React, { useRef, useEffect } from 'react';

const MusicMarquee = ({ music, isPlaying }) => {
  const marqueeRef = useRef(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const textElement = marquee.querySelector('.music-text');
    if (!textElement) return;

    // Calculate if text needs to scroll
    const containerWidth = marquee.offsetWidth;
    const textWidth = textElement.offsetWidth;

    if (textWidth > containerWidth) {
      marquee.classList.add('scrolling');
    } else {
      marquee.classList.remove('scrolling');
    }
  }, [music]);

  const handleMusicClick = () => {
    if (music.url) {
      window.open(music.url, '_blank');
    }
  };

  return (
    <div 
      className="music-marquee"
      onClick={handleMusicClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleMusicClick()}
    >
      {/* Vinyl Record Icon */}
      <div className={`music-icon ${isPlaying ? 'spinning' : ''}`}>
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.9" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="#000" strokeWidth="0.5" />
          <circle cx="12" cy="12" r="4" fill="none" stroke="#000" strokeWidth="0.5" />
          <circle cx="12" cy="12" r="2" fill="#000" />
          <circle cx="12" cy="12" r="0.5" fill="currentColor" />
        </svg>
      </div>

      {/* Marquee Text */}
      <div className="music-marquee-container" ref={marqueeRef}>
        <div className="music-text">
          <span className="music-name">{music.name || 'Original Audio'}</span>
          {music.artist && (
            <>
              <span className="music-separator"> • </span>
              <span className="music-artist">{music.artist}</span>
            </>
          )}
        </div>
        {/* Duplicate for seamless scroll */}
        <div className="music-text duplicate" aria-hidden="true">
          <span className="music-name">{music.name || 'Original Audio'}</span>
          {music.artist && (
            <>
              <span className="music-separator"> • </span>
              <span className="music-artist">{music.artist}</span>
            </>
          )}
        </div>
      </div>

      {/* Music Note Icon */}
      <svg className="music-note-icon" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
        />
      </svg>
    </div>
  );
};

export default MusicMarquee;
