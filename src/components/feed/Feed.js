/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Feed Component — Cinematic Universe Edition v3
 * Uses usePosts (React Query) with IntersectionObserver infinite scroll.
 * Includes staggered entrance animations & content diversity injection.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { usePosts } from '../../hooks/usePosts';
import PostCard from '../post/PostCard';
import ContentDiversityCard from '../home/ContentDiversityCard';
import WellnessNudge from '../home/WellnessNudge';
import styles from './Feed.module.css';

const DIVERSITY_VARIANTS = ['discover', 'community', 'learn', 'inspire'];
const DIVERSITY_INTERVAL = 5; // inject diversity card every N posts
const WELLNESS_THRESHOLD = 15; // show wellness nudge after N posts

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
  const sessionStartRef = useRef(Date.now());
  const [wellnessDismissed, setWellnessDismissed] = useState(false);

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
      rootMargin: '400px',
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  // Prefetch when we have posts loaded
  useEffect(() => {
    if (posts.length > 3) prefetchNextPage();
  }, [posts.length, prefetchNextPage]);

  const getScrollMinutes = () => Math.round((Date.now() - sessionStartRef.current) / 60000);

  // ── Loading state ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.feed}>
        {[...Array(4)].map((_, i) => (
          <SkeletonPost key={i} delay={i * 0.1} />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3 className={styles.errorTitle}>Something went wrong</h3>
        <p className={styles.errorMessage}>{error?.message || 'Failed to load your feed. Please try again.'}</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────
  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✨</div>
        <h3>Your feed awaits</h3>
        <p>
          {feedType === 'following'
            ? 'Follow trusted creators to see their posts here.'
            : 'Be the first to share something real.'}
        </p>
      </div>
    );
  }

  // ── Build feed items with diversity injection ──────────────────────
  const feedItems = [];
  let diversityIndex = 0;

  posts.forEach((post, i) => {
    // Add the post with stagger index
    feedItems.push(
      <div
        key={post.id}
        className={styles.postWrapper}
        style={{ '--stagger': `${Math.min(i, 5) * 0.06}s` }}
      >
        <PostCard post={post} />
      </div>
    );

    // Inject diversity card every DIVERSITY_INTERVAL posts
    if ((i + 1) % DIVERSITY_INTERVAL === 0 && i < posts.length - 1) {
      const variant = DIVERSITY_VARIANTS[diversityIndex % DIVERSITY_VARIANTS.length];
      feedItems.push(
        <div key={`diversity-${i}`} className={styles.diversityWrapper}>
          <ContentDiversityCard variant={variant} />
        </div>
      );
      diversityIndex++;
    }

    // Show wellness nudge after threshold
    if (i === WELLNESS_THRESHOLD - 1 && !wellnessDismissed) {
      feedItems.push(
        <div key="wellness" className={styles.wellnessWrapper}>
          <WellnessNudge
            type="time"
            scrollMinutes={getScrollMinutes()}
            onDismiss={() => setWellnessDismissed(true)}
          />
        </div>
      );
    }
  });

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className={styles.feed}>
      {feedItems}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className={styles.loadTrigger}>
        {isFetchingNextPage && (
          <div className={styles.spinner}>
            <div className={styles.spinnerRing} />
            <span className={styles.spinnerLabel}>Loading more...</span>
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <div className={styles.endOfFeed}>
            <div className={styles.endIcon}>🌿</div>
            <h3 className={styles.endTitle}>You're all caught up</h3>
            <p className={styles.endMessage}>
              Focus prioritizes quality over quantity. Come back later for fresh, meaningful content.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Skeleton loader with stagger ────────────────────────────────────
const SkeletonPost = ({ delay = 0 }) => (
  <div className={styles.skeleton} style={{ animationDelay: `${delay}s` }}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonMeta}>
        <div className={styles.skeletonName} />
        <div className={styles.skeletonTime} />
      </div>
    </div>
    <div className={styles.skeletonCaption} />
    <div className={styles.skeletonMedia} />
    <div className={styles.skeletonActions}>
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonIcon} />
      <div className={styles.skeletonIconRight} />
    </div>
  </div>
);

export default Feed;
