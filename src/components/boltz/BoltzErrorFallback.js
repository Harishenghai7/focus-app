import React from 'react';
import styles from './BoltzErrorFallback.module.css';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const BoltzErrorFallback = ({ onRetry, retryCount }) => (
    <div className={styles.container}>
        <div className={styles.iconContainer}>
            <AlertTriangle size={32} className={styles.icon} />
        </div>
        <h3 className={styles.title}>Playback Error</h3>
        <p className={styles.message}>
            We couldn't load this video. Please check your connection.
        </p>
        <button
            className={styles.retryBtn}
            onClick={(e) => { e.stopPropagation(); onRetry(); }}
            disabled={retryCount >= 3}
        >
            <RefreshCw size={16} className={retryCount > 0 ? styles.spin : ''} />
            {retryCount >= 3 ? 'Failed' : 'Try Again'}
        </button>
    </div>
);

export default BoltzErrorFallback;
