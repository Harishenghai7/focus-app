import React from 'react';
import styles from './EndOfFeed.module.css';
import Icon from '../ui/Icon';

const EndOfFeed = () => {
    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Icon name="Check" size={32} color="var(--primary-lavender)" />
            </div>
            <h3 className={styles.title}>You're all caught up</h3>
            <p className={styles.subtitle}>You've seen all new posts from the past 3 days.</p>
        </div>
    );
};

export default EndOfFeed;
