import React from 'react';
import styles from './ReadReceipt.module.css';

const ReadReceipt = ({ status, readAt }) => {
    const getIcon = () => {
        switch (status) {
            case 'sending':
                return (
                    <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 8 8"
                                to="360 8 8"
                                dur="1s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </svg>
                );
            case 'sent':
                return (
                    <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'delivered':
                return (
                    <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8l3 3 7-7M6 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'read':
                return (
                    <svg className={`${styles.icon} ${styles.read}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8l3 3 7-7M6 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.readReceipt} title={readAt ? `Read ${new Date(readAt).toLocaleString()}` : status}>
            {getIcon()}
        </div>
    );
};

export default ReadReceipt;
