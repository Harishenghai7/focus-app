import React from 'react';
import styles from './PinnedChatIndicator.module.css';

const PinnedChatIndicator = () => {
    return (
        <div className={styles.indicator} title="Pinned">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    transform="rotate(45 8 8)" />
            </svg>
        </div>
    );
};

export default PinnedChatIndicator;
