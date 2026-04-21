/**
 * FocuslyMascot.jsx
 * =================
 * 🦁  The physical living companion — pure CSS/SVG animations keyed by state.
 * State contract exactly matches FocuslyContext.FOCUSLY_STATES.
 */

import React from 'react';
import styles from './FocuslyMascot.module.css';

const STATE_CLASS = {
    idle:          styles.stateIdle,
    thinking:      styles.stateThinking,
    motivational:  styles.stateMotivational,
    disappointed:  styles.stateDisappointed,
    celebrating:   styles.stateCelebrating,
};

const FocuslyMascot = ({ state = 'idle', size = 72 }) => {
    return (
        <div
            className={`${styles.mascot} ${STATE_CLASS[state] || styles.stateIdle}`}
            style={{ width: size, height: size }}
            data-testid={`focusly-mascot-${state}`}
            aria-hidden="true"
        >
            <span className={styles.aura} />
            <span className={styles.sparkle} style={{ top: '8%',  left: '12%' }} />
            <span className={styles.sparkle} style={{ top: '20%', left: '82%' }} />
            <span className={styles.sparkle} style={{ top: '74%', left: '18%' }} />
            <span className={styles.sparkle} style={{ top: '64%', left: '88%' }} />
            <img
                src="/focusly-lion.png"
                alt="Focusly"
                className={styles.lion}
                loading="eager"
                draggable="false"
            />
        </div>
    );
};

export default FocuslyMascot;
