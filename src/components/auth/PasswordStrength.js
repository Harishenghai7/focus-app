import React from 'react';
import styles from './PasswordStrength.module.css';

const strengthConfig = [
    { label: 'Weak', sublabel: 'Add numbers & symbols', color: '#ef4444', segments: 1 },
    { label: 'Fair', sublabel: 'Getting stronger', color: '#f59e0b', segments: 2 },
    { label: 'Good', sublabel: 'Solid foundation', color: '#10B981', segments: 3 },
    { label: 'Strong', sublabel: 'Excellent choice', color: '#8b5cf6', segments: 4 },
];

const PasswordStrength = ({ strength = '', score = 0 }) => {
    const index = Math.min(Math.max(score - 1, 0), 3);
    const config = score > 0 ? strengthConfig[index] : null;

    if (!strength && score === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.segments}>
                {[1, 2, 3, 4].map(seg => (
                    <div
                        key={seg}
                        className={`${styles.segment} ${seg <= (config?.segments || 0) ? styles.segmentFilled : ''}`}
                        style={{
                            '--fill-color': config?.color || 'rgba(255,255,255,0.1)',
                            '--fill-glow': config?.color ? `${config.color}40` : 'transparent',
                            animationDelay: `${seg * 0.08}s`,
                        }}
                    />
                ))}
            </div>
            {config && (
                <div className={styles.info}>
                    <span className={styles.label} style={{ color: config.color }}>
                        {config.label}
                    </span>
                    <span className={styles.sublabel}>{config.sublabel}</span>
                </div>
            )}
        </div>
    );
};

export default PasswordStrength;
