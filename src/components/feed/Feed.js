/**
 * Feed Component
 * Infinite scroll feed with React Query
 */

import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePosts } from '../../hooks/usePosts';
import PostCard from '../posts/PostCard';
import styles from './Feed.module.css';

const Feed = ({ feedType = 'home' }) => {
    const {
        posts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        prefetchNextPage,
    } = usePosts(feedType);

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    // Fetch next page when scrolling near bottom
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Prefetch when user scrolls
    useEffect(() => {
        if (posts.length > 3) {
            prefetchNextPage();
        }
    }, [posts.length, prefetchNextPage]);

    if (isLoading) {
        return (
            <div className={styles.feed}>
                {[...Array(3)].map((_, i) => (
                    <SkeletonPost key={i} />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className={styles.error}>
                <p>Failed to load posts</p>
                <p className={styles.errorMessage}>{error?.message}</p>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className={styles.empty}>
                <h3>No posts yet</h3>
                <p>Start following people to see their posts here!</p>
            </div>
        );
    }

    return (
        <div className={styles.feed}>
            {posts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={ref} className={styles.loadTrigger}>
                {isFetchingNextPage && <LoadingSpinner />}
            </div>

            {!hasNextPage && posts.length > 0 && (
                <div className={styles.endOfFeed}>
                    <p>You're all caught up! 🎉</p>
                </div>
            )}
        </div>
    );
};

// Skeleton loader
const SkeletonPost = () => (
    <div className={styles.skeleton}>
        <div className={styles.skeletonHeader}>
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonText} />
        </div>
        <div className={styles.skeletonMedia} />
        <div className={styles.skeletonActions}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonIcon} />
        </div>
    </div>
);

// Loading spinner
const LoadingSpinner = () => (
    <div className={styles.spinner}>
        <div className={styles.spinnerRing} />
    </div>
);

export default Feed;
