/**
 * Feed Component — Production v3
 * Uses usePosts (React Query) with IntersectionObserver infinite scroll.
 * No Virtuoso dependency — simple, stable, performant.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from '../post/PostCard';
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

  const sentinelRef = useRef(null);

  // ── IntersectionObserver for infinite scroll ───────────────────────
  const handleIntersect = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Prefetch when we have posts loaded
  useEffect(() => {
    if (posts.length > 3) prefetchNextPage();
  }, [posts.length, prefetchNextPage]);

  // ── Loading state ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.feed}>
        {[...Array(3)].map((_, i) => (
          <SkeletonPost key={i} />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>Failed to load posts</p>
        {error?.message && (
          <p className={styles.errorMessage}>{error.message}</p>
        )}
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✨</div>
        <h3>No posts yet</h3>
        <p>
          {feedType === 'following'
            ? 'Start following people to see their posts here!'
            : 'Be the first to share something!'}
        </p>
      </div>
    );
  }

  // ── Posts list ─────────────────────────────────────────────────────
  return (
    <div className={styles.feed}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className={styles.loadTrigger}>
        {isFetchingNextPage && (
          <div className={styles.spinner}>
            <div className={styles.spinnerRing} />
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className={styles.endOfFeed}>
            <p>You're all caught up! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Skeleton loader ────────────────────────────────────────────────────
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

export default Feed;
