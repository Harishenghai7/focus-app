import React from 'react';
import styles from './Badge.module.css';

const Badge = ({ children, variant = 'primary', className = '' }) => {
    return (
        <span className={`${styles.badge} ${styles[`badge-${variant}`]} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
