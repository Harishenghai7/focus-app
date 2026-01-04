/**
 * ContentWarning Component
 * Blur sensitive content with warning overlay
 */

import React, { useState } from 'react';
import styles from './ContentWarning.module.css';

const ContentWarning = ({
    children,
    warningType = 'sensitive',
    customMessage,
    showByDefault = false
}) => {
    const [isRevealed, setIsRevealed] = useState(showByDefault);

    const warnings = {
        sensitive: {
            icon: '⚠️',
            title: 'Sensitive Content',
            message: 'This post may contain sensitive content.'
        },
        violence: {
            icon: '🚫',
            title: 'Violent Content',
            message: 'This post contains violent or graphic content.'
        },
        adult: {
            icon: '🔞',
            title: 'Adult Content',
            message: 'This post contains adult content.'
        },
        spoiler: {
            icon: '👁️',
            title: 'Spoiler Warning',
            message: 'This post contains spoilers.'
        }
    };

    const warning = warnings[warningType] || warnings.sensitive;

    if (isRevealed) {
        return <>{children}</>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.blurredContent}>
                {children}
            </div>
            <div className={styles.overlay}>
                <div className={styles.warning}>
                    <div className={styles.icon}>{warning.icon}</div>
                    <h3 className={styles.title}>{warning.title}</h3>
                    <p className={styles.message}>
                        {customMessage || warning.message}
                    </p>
                    <button
                        className={styles.revealBtn}
                        onClick={() => setIsRevealed(true)}
                    >
                        Show Content
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContentWarning;
