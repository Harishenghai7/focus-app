/**
 * BoltzSessionAwareness — Mindful Consumption Break Overlay
 * Gentle, non-intrusive break suggestions between videos
 */
import React from 'react';
import styles from './BoltzSessionAwareness.module.css';

const BoltzSessionAwareness = ({ suggestion, onDismiss, onTakeBreak, sessionMinutes, videosWatched }) => {
  if (!suggestion) return null;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.glow} />
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{suggestion.icon}</span>
        </div>
        <h3 className={styles.title}>{suggestion.title}</h3>
        <p className={styles.message}>{suggestion.message}</p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{Math.floor(sessionMinutes)}</span>
            <span className={styles.statLabel}>minutes</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{videosWatched}</span>
            <span className={styles.statLabel}>videos</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.breakBtn} onClick={onTakeBreak}>
            Take a Break
          </button>
          <button className={styles.continueBtn} onClick={onDismiss}>
            Continue Watching
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoltzSessionAwareness;
