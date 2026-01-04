import React, { forwardRef, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Lightweight vertical reel player used by Boltz page
// - forwards ref to the underlying <video>
// - supports swipe up/down detection and delegates to onSwipe('up'|'down')
// - delegates double-tap detection to parent via onClick/onTouchEnd
// - plays inline, autoPlay, muted, loop for mobile compatibility
const ReelPlayer = forwardRef(function ReelPlayer(
  {
    src,
    poster,
    isMuted = true,
    isPlaying = true,
    loop = true,
    onSwipe,
    onDoubleTap,
    onLoadStart,
    onCanPlay,
    onError,
    className,
    ...rest
  },
  ref
) {
  const localRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  // Keep ref pointing to the video element
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === 'function') {
      ref(localRef.current);
    } else {
      ref.current = localRef.current;
    }
  }, [ref]);

  // React to play/pause changes
  useEffect(() => {
    const video = localRef.current;
    if (!video) return;

    video.muted = !!isMuted;
    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay might be blocked; ignore, parent may toggle mute
        });
      }
    } else {
      video.pause();
    }
  }, [isMuted, isPlaying]);

  // Touch handlers for swipe detection
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartY.current = t.clientY;
    touchStartX.current = t.clientX;
  };

  const handleTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dy = t.clientY - touchStartY.current;
    const dx = t.clientX - touchStartX.current;

    // If parent provided double-tap handler, delegate the gesture event
    if (onDoubleTap) onDoubleTap(e);

    // Basic swipe threshold and direction filtering (vertical priority)
    const absDy = Math.abs(dy);
    const absDx = Math.abs(dx);
    if (absDy > 50 && absDy > absDx) {
      // Swipe up (finger moves up => next item) => 'down'
      if (dy < 0 && onSwipe) onSwipe('down');
      // Swipe down (finger moves down => previous item) => 'up'
      if (dy > 0 && onSwipe) onSwipe('up');
    }
  };

  const handleClick = (e) => {
    // Delegate to parent so it can implement single vs double-tap
    if (onDoubleTap) onDoubleTap(e);
  };

  return (
    <video
      ref={localRef}
      src={src}
      poster={poster}
      className={className}
      playsInline
      webkit-playsinline="true"
      muted={isMuted}
      autoPlay={isPlaying}
      loop={loop}
      preload="auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
      onError={onError}
      {...rest}
    />
  );
});

ReelPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  poster: PropTypes.string,
  isMuted: PropTypes.bool,
  isPlaying: PropTypes.bool,
  loop: PropTypes.bool,
  onSwipe: PropTypes.func,
  onDoubleTap: PropTypes.func,
  onLoadStart: PropTypes.func,
  onCanPlay: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string,
};

export default React.memo(ReelPlayer);
