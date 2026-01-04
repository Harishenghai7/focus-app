import React from 'react';
import styles from './DraftIndicator.module.css';

const DraftIndicator = ({ draftText }) => {
    if (!draftText) return null;

    const truncated = draftText.length > 30 ? draftText.substring(0, 30) + '...' : draftText;

    return (
        <div className={styles.indicator}>
            <span className={styles.label}>Draft:</span>
            <span className={styles.text}>{truncated}</span>
        </div>
    );
};

export default DraftIndicator;
