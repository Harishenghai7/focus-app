import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'md', color = 'var(--primary-lavender)' }) => {
    return (
        <div
            className={`${styles.spinner} ${styles[size]}`}
            style={{ borderTopColor: color }}
        />
    );
};

export default LoadingSpinner;
