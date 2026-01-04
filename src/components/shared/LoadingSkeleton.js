import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const LoadingSkeleton = ({ count = 1, height, width, circle, className, style }) => {
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
