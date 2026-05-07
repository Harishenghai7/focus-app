import React from 'react';
import styles from './NightLockOverlay.module.css';

const NightLockOverlay = ({ visible }) => {
    if (!visible) return null;

    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <div className={styles.card}>
                <div className={styles.mascot}>🦁</div>
                <div className={styles.title}>Focusly AI</div>
                <div className={styles.message}>
                    "Macha, your safety is my priority. The Shield is active."
                </div>
                <div className={styles.sub}>
                    Its Night Lock time (10 PM  6 AM). Rest is power.
                </div>
            </div>
        </div>
    );
};

export default NightLockOverlay;
