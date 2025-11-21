import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './CountdownTimer.module.css';

/**
 * CountdownTimer
 * Displays a countdown timer with progress bar
 * Supports both simple countdown (seconds) and quiz mode (startTime + duration)
 * @param {number} seconds - Initial seconds (simple mode)
 * @param {string} startTime - ISO timestamp when timer started (quiz mode)
 * @param {number} duration - Duration in seconds (quiz mode)
 * @param {Function} onComplete - Callback when timer ends (simple mode)
 * @param {Function} onExpire - Callback when timer expires (quiz mode)
 * @example <CountdownTimer seconds={60} onComplete={handleEnd} />
 * @example <CountdownTimer startTime={isoString} duration={60} onExpire={handleExpire} />
 */
const CountdownTimer = ({ seconds, startTime, duration, onComplete, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(seconds || duration);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);

  // Quiz mode with startTime and duration
  useEffect(() => {
    if (!startTime || !duration) return;

    const calculateTimeLeft = () => {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 1000);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      return remaining;
    };

    const updateTimer = () => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        if (onExpire) onExpire();
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, duration, onExpire]);

  // Simple mode with seconds countdown
  useEffect(() => {
    if (startTime) return; // Skip if in quiz mode

    if (timeLeft <= 0) {
      if (onComplete) onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(t => t - 1);
      setProgress((timeLeft - 1) / (seconds || 1) * 100);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete, startTime, seconds]);

  const formatTimeRemaining = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return mins > 0 
      ? `${mins}:${remainingSecs.toString().padStart(2, '0')}`
      : `${secs}s`;
  };

  const getTimerClass = () => {
    if (timeLeft <= 10) return styles.critical;
    if (timeLeft <= 30) return styles.warning;
    return styles.normal;
  };

  // Quiz mode display
  if (startTime && duration) {
    return (
      <div className={`${styles.container} ${getTimerClass()}`}>
        <div className={styles.timeDisplay}>
          <span className={styles.icon}>⏱️</span>
          <span className={styles.time} aria-live="polite">
            {formatTimeRemaining(timeLeft)}
          </span>
        </div>
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`${timeLeft} seconds remaining`}
          />
        </div>
      </div>
    );
  }

  // Simple mode display
  return (
    <div className={styles.container} aria-label="Countdown timer">
      <span className={styles.time}>{timeLeft}s</span>
    </div>
  );
};

CountdownTimer.propTypes = {
  seconds: PropTypes.number,
  startTime: PropTypes.string,
  duration: PropTypes.number,
  onComplete: PropTypes.func,
  onExpire: PropTypes.func
};

export default React.memo(CountdownTimer);
