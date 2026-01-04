import React from 'react';
import styles from './CatchUpBanner.module.css';
import Icon from '../ui/Icon';

const CatchUpBanner = () => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Icon name="Check" size={32} className={styles.icon} />
            </div>
            <h3 className={styles.title}>You're All Caught Up</h3>
            <p className={styles.subtitle}>
                You've seen all new posts from the past 48 hours.
            </p>
            <div className={styles.divider} />
            <p className={styles.suggestedLabel}>Suggested for you</p>
        </div>
    );
};

export default CatchUpBanner;
