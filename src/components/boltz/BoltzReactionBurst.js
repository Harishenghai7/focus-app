/**
 * BoltzReactionBurst — Full-screen floating emoji reactions
 * Physics-based float-up with scale bounce
 */
import React from 'react';
import styles from './BoltzReactionBurst.module.css';

const BoltzReactionBurst = ({ reactions = [] }) => {
  if (!reactions.length) return null;

  return (
    <div className={styles.container}>
      {reactions.map((r) => (
        <div
          key={r.id}
          className={styles.floatingEmoji}
          style={{
            left: `${r.x}%`,
            animationDelay: `${r.delay || 0}s`,
          }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
};

export default BoltzReactionBurst;
