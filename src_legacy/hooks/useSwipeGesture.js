import { useState, useCallback } from 'react';

export const useSwipeGesture = ({ onSwipeUp, onSwipeDown, threshold = 50 }) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > threshold;
    const isSwipeDown = distance < -threshold;

    if (isSwipeUp && onSwipeUp) {
      onSwipeUp();
    }

    if (isSwipeDown && onSwipeDown) {
      onSwipeDown();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};
