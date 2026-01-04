import React from 'react';
import styles from './NotificationsSkeleton.module.css';

const NotificationsSkeleton = ({ count = 5 }) => {
    return (
        <div className={styles.container}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={styles.card}>
                    <div className={styles.avatar} />
                    <div className={styles.content}>
                        <div className={styles.textLine} />
                        <div className={styles.textLineShort} />
                    </div>
                    <div className={styles.media} />
                </div>
            ))}
        </div>
    );
};

export default NotificationsSkeleton;
