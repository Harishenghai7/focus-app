import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import styles from './LoadingSkeleton.module.css';

const LoadingSkeleton = ({ type, count = 1, height, width, circle, className, style }) => {
    if (type === 'grid') {
        return (
            <div className={styles.gridWrap}>
                {Array.from({ length: count }).map((_, index) => (
                    <div key={`grid-skeleton-${index}`} className={styles.gridItem} />
                ))}
            </div>
        );
    }

    if (type === 'profile') {
        return (
            <div className={styles.profileWrap}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarShimmer} />
                    <div className={styles.profileLines}>
                        <div className={styles.lineLarge} />
                        <div className={styles.lineMedium} />
                        <div className={styles.lineSmall} />
                    </div>
                </div>
                <div className={styles.gridWrap}>
                    {Array.from({ length: 9 }).map((_, index) => (
                        <div key={`profile-grid-${index}`} className={styles.gridItem} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <SkeletonTheme baseColor="#2A1F4D" highlightColor="#362861">
            <Skeleton
                count={count}
                height={height}
                width={width}
                circle={circle}
                className={className}
                style={style}
            />
        </SkeletonTheme>
    );
};

export default LoadingSkeleton;
