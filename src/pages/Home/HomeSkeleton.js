import React from 'react';
import styles from './HomeSkeleton.module.css';

const HomeSkeleton = () => {
    return (
        <div className={styles.skeletonContainer}>
            {/* Story Bar Skeleton */}
            <div className={styles.storyBar}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={styles.storyCircle}></div>
                ))}
            </div>

            {/* Post Card Skeleton (Repeat 2 times) */}
            {[1, 2].map((i) => (
                <div key={i} className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.avatar}></div>
                        <div className={styles.meta}>
                            <div className={styles.lineLg}></div>
                            <div className={styles.lineSm}></div>
                        </div>
                    </div>
                    <div className={styles.media}></div>
                    <div className={styles.actions}></div>
                </div>
            ))}
        </div>
    );
};

export default HomeSkeleton;