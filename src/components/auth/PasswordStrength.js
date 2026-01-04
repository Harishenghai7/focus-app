import React from 'react';
import styles from './PasswordStrength.module.css';

const PasswordStrength = ({ strength, score }) => {
    if (!score) return null;

    const getLabel = () => {
        switch (strength) {
            case 'weak': return 'Weak';
            case 'medium': return 'Medium';
            case 'strong': return 'Strong';
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bars}>
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`${styles.bar} ${i <= score ? styles[strength] : ''}`}
                    />
                ))}
            </div>
            <span className={`${styles.label} ${styles[strength]}`}>
                {getLabel()}
            </span>
        </div>
    );
};

export default PasswordStrength;
