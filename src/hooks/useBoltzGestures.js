/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * useBoltzGestures — Advanced Gesture Detection for Boltz
 * Double-tap, long-press, swipe direction, velocity tracking
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useRef, useCallback, useEffect } from 'react';

const DOUBLE_TAP_DELAY = 300;
const LONG_PRESS_DELAY = 500;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export const useBoltzGestures = (handlers = {}, enabled = true) => {
  const {
    onDoubleTap,
    onSingleTap,
    onLongPress,
    onLongPressEnd,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
  } = handlers;

  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const lastTap = useRef(0);
  const tapTimeout = useRef(null);
  const longPressTimeout = useRef(null);
  const isLongPress = useRef(false);

  const cleanup = useCallback(() => {
    if (tapTimeout.current) clearTimeout(tapTimeout.current);
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const onTouchStart = useCallback((e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    touchEnd.current = null;
    isLongPress.current = false;

    longPressTimeout.current = setTimeout(() => {
      isLongPress.current = true;
      if (navigator.vibrate) navigator.vibrate(30);
      onLongPress?.({ x: touch.clientX, y: touch.clientY });
    }, LONG_PRESS_DELAY);
  }, [enabled, onLongPress]);

  const onTouchMove = useCallback((e) => {
    if (!enabled || !touchStart.current) return;
    const touch = e.touches[0];
    touchEnd.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };

    const dx = Math.abs(touch.clientX - touchStart.current.x);
    const dy = Math.abs(touch.clientY - touchStart.current.y);

    // Cancel long press if finger moves too much
    if (dx > 10 || dy > 10) {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    }
  }, [enabled]);

  const onTouchEnd = useCallback((e) => {
    if (!enabled) return;
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

    if (isLongPress.current) {
      onLongPressEnd?.();
      isLongPress.current = false;
      return;
    }

    const end = touchEnd.current || {
      x: touchStart.current?.x || 0,
      y: touchStart.current?.y || 0,
      time: Date.now()
    };

    if (!touchStart.current) return;

    const dx = end.x - touchStart.current.x;
    const dy = end.y - touchStart.current.y;
    const dt = (end.time - touchStart.current.time) / 1000;
    const vx = Math.abs(dx) / Math.max(dt, 0.01);
    const vy = Math.abs(dy) / Math.max(dt, 0.01);

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Detect swipes
    if (absDx > SWIPE_THRESHOLD || absDy > SWIPE_THRESHOLD) {
      if (absDx > absDy && vx > SWIPE_VELOCITY_THRESHOLD) {
        if (dx > 0) onSwipeRight?.({ velocity: vx, distance: dx });
        else onSwipeLeft?.({ velocity: vx, distance: Math.abs(dx) });
      } else if (absDy > absDx && vy > SWIPE_VELOCITY_THRESHOLD) {
        if (dy > 0) onSwipeDown?.({ velocity: vy, distance: dy });
        else onSwipeUp?.({ velocity: vy, distance: Math.abs(dy) });
      }
      return;
    }

    // Detect taps (no significant movement)
    const now = Date.now();
    const tapDelta = now - lastTap.current;

    if (tapDelta < DOUBLE_TAP_DELAY && tapDelta > 0) {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
      if (navigator.vibrate) navigator.vibrate(50);
      onDoubleTap?.({ x: end.x, y: end.y });
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      tapTimeout.current = setTimeout(() => {
        onSingleTap?.({ x: end.x, y: end.y });
      }, DOUBLE_TAP_DELAY);
    }
  }, [enabled, onDoubleTap, onSingleTap, onLongPress, onLongPressEnd, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  const gestureHandlers = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return gestureHandlers;
};

export default useBoltzGestures;
