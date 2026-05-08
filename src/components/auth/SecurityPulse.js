import React, { useState, useEffect } from 'react';
import styles from './SecurityPulse.module.css';

const SecurityPulse = ({ compact = false }) => {
    const [scanPhase, setScanPhase] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanPhase(prev => (prev + 1) % 3);
        }, 2800);
        return () => clearInterval(interval);
    }, []);

    const phases = [
        { label: 'E2E Encryption', status: 'active' },
        { label: 'Session Guard', status: 'active' },
        { label: 'Trust Shield', status: 'active' },
    ];

    if (compact) {
        return (
            <div className={styles.compactPulse}>
                <div className={styles.shieldIconCompact}>
                    <svg viewBox="0 0 24 24" fill="none" className={styles.shieldSvg}>
                        <path
                            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                            fill="url(#shieldGrad)"
                            opacity="0.2"
                        />
                        <path
                            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                            stroke="url(#shieldGrad)"
                            strokeWidth="1.5"
                            fill="none"
                        />
                        <path
                            d="M9 12l2 2 4-4"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.checkPath}
                        />
                        <defs>
                            <linearGradient id="shieldGrad" x1="3" y1="2" x2="21" y2="19">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className={styles.scanLine} />
                </div>
                <span className={styles.compactLabel}>Protected</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.shieldWrapper}>
                <div className={styles.shieldGlow} />
                <div className={styles.shieldIcon}>
                    <svg viewBox="0 0 24 24" fill="none" className={styles.shieldSvg}>
                        <path
                            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                            fill="url(#shieldGradFull)"
                            opacity="0.15"
                        />
                        <path
                            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
                            stroke="url(#shieldGradFull)"
                            strokeWidth="1.5"
                            fill="none"
                        />
                        <path
                            d="M9 12l2 2 4-4"
                            stroke="#10B981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={styles.checkPath}
                        />
                        <defs>
                            <linearGradient id="shieldGradFull" x1="3" y1="2" x2="21" y2="19">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#7c3aed" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className={styles.scanLine} />
                </div>
            </div>
            <div className={styles.statusGrid}>
                {phases.map((phase, i) => (
                    <div
                        key={phase.label}
                        className={`${styles.statusItem} ${scanPhase === i ? styles.statusItemActive : ''}`}
                    >
                        <span className={`${styles.statusDot} ${styles[phase.status]}`} />
                        <span className={styles.statusLabel}>{phase.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SecurityPulse;
