import React from 'react';
import styles from './BoltzOverlay.module.css';

const BoltzOverlay = () => (
    <div className={styles.overlay}>
        <div className={styles.topGradient} />
        <div className={styles.bottomGradient} />
        <div className={styles.vignette} />
    </div>
);

export default BoltzOverlay;
