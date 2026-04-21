/**
 * FocuslyToastLayer.jsx
 * =====================
 * 🦁  Global glassmorphic toast surface bound to FocuslyContext.
 *
 * Fixed to the bottom-left on desktop (top-right on mobile). Renders the
 * mascot in its current emotional state + the spoken line. Exit on X, tap
 * outside, or auto-timeout set by the provider.
 */

import React from 'react';
import { useFocusly } from '../../context/FocuslyContext';
import FocuslyMascot from './FocuslyMascot';
import styles from './FocuslyToastLayer.module.css';

// Inline state labels to avoid circular import with FocuslyContext
const STATE_LABEL = {
    idle:          'Focusly',
    thinking:      'Focusly is thinking',
    motivational:  'Focusly',
    disappointed:  'Focusly is concerned',
    celebrating:  'Focusly is celebrating',
};

const STATE_ACCENT = {
    idle:          'var(--focus-cyan, #00c3ff)',
    thinking:      '#9678ff',
    motivational:  '#00ffaa',
    disappointed:  '#ff5050',
    celebrating:  '#ffdc00',
};

const FocuslyToastLayer = () => {
    const { state, message, isVisible, hush } = useFocusly();

    if (!isVisible || !message) return null;

    return (
        <div
            className={styles.anchor}
            role="status"
            aria-live="polite"
            data-testid="focusly-toast-layer"
        >
            <div
                className={`${styles.card} ${styles[`card_${state}`] || ''}`}
                style={{ '--focusly-accent': STATE_ACCENT[state] || STATE_ACCENT.idle }}
            >
                <div className={styles.mascotSlot}>
                    <FocuslyMascot state={state} size={88} />
                </div>
                <div className={styles.body}>
                    <div className={styles.header}>
                        <span className={styles.name}>{STATE_LABEL[state] || 'Focusly'}</span>
                        <button
                            type="button"
                            onClick={hush}
                            className={styles.closeBtn}
                            aria-label="Dismiss Focusly"
                            data-testid="focusly-toast-dismiss"
                        >
                            ×
                        </button>
                    </div>
                    <p className={styles.message}>{message}</p>
                </div>
            </div>
        </div>
    );
};

export default FocuslyToastLayer;
