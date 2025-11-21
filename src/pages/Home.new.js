import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// Components
import Layout from '../components/Layout/Layout';
import StoriesCarousel from '../components/StoriesCarousel';
import PostCard from '../components/PostCard';
import InfiniteScrollLoader from '../components/InfiniteScrollLoader';
import SuggestedUsers from '../components/SuggestedUsers';
import BottomNav from '../components/BottomNav';
import MusicPlayer from '../components/MusicPlayer/MusicPlayer';

// Hooks
import { useAuth } from '../hooks/useAuth';
import usePullToRefresh from '../hooks/usePullToRefresh';
import { useMediaQuery } from 'react-responsive';

// Utils
import { formatDate } from '../utils/formatters/formatDate';
import { trackPageView } from '../utils/analytics/trackPageView';
import { trackEvent } from '../utils/analytics/trackEvent';
import { feedCache } from '../utils/feedCache';
import { subscriptionManager } from '../utils/subscriptionManager';
import { measureLoadTime } from '../utils/performance/measureLoadTime';
import { logPerformance } from '../utils/analytics/logPerformance';

import './Home.css';

const PAGE_SIZE = 15;
const PULL_THRESHOLD = 80;
const SCROLL_THRESHOLD = 300;

function Home({ user, userProfile }) {
  const navigate = useNavigate();
  
  // State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [viewMode, setViewMode] = useState('feed');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Refs
  const mounted = useRef(true);
  const observerRef = useRef();
  const lastPostRef = useRef();
  const realtimeSubscription = useRef(null);
  const throttledScrollHandler = useRef(null);

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });

  // Track page view
  useEffect(() => {
    trackPageView('Home');
  }, []);

  // Measure load time for performance
  useEffect(() => {
    const loadTime = measureLoadTime();
    if (loadTime) logPerformance('home_load_time', loadTime);
  }, []);

  const feedConfig = useMemo(() => ({
    pageSize: PAGE_SIZE,
    pullThreshold: PULL_THRESHOLD,
    scrollThreshold: SCROLL_THRESHOLD,
    cacheAge: 5 * 60 * 1000
  }), []);

  // Fetch posts
  const fetchPosts = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setLoading(true);
        setPage(0);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verified
          ),
          post_likes (
            user_id
          ),
          comments:comments (count)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      if (isRefresh) {
        setPosts(data || []);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
      }

      setHasMore(data && data.length === PAGE_SIZE);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPosts(0, true);
  }, []);

  // Real-time subscription for new posts
  useEffect(() => {
    if (!user?.id) return;

    realtimeSubscription.current = supabase
      .channel('home-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          setNewPostsAvailable(true);
          trackEvent('new_post_notification', { post_id: payload.new.id });
        }
      )
      .subscribe();

    return () => {
      if (realtimeSubscription.current) {
        supabase.removeChannel(realtimeSubscription.current);
      }
    };
  }, [user]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchPosts(0, true);
    setNewPostsAvailable(false);
    trackEvent('feed_refreshed');
  }, [fetchPosts]);

  // Pull to refresh
  const pullToRefreshRef = usePullToRefresh(handleRefresh);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        fetchPosts(page);
      }
    }, options);

    if (lastPostRef.current) {
      observerRef.current.observe(lastPostRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, page, fetchPosts]);

  // Handle double tap to like
  const handleDoubleTap = useCallback((postId) => {
    trackEvent('double_tap_like', { post_id: postId });
  }, []);

  // Handle Focusly button click
  const handleFocuslyClick = () => {
    navigate('/focusly');
    trackEvent('focusly_opened', { source: 'home_button' });
  };

  // Load new posts
  const loadNewPosts = () => {
    handleRefresh();
  };

  return (
    <div className="page-home" ref={pullToRefreshRef}>
      {/* New Posts Notification */}
      <AnimatePresence>
        {newPostsAvailable && (
          <motion.button
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="new-posts-notification"
            onClick={loadNewPosts}
          >
            New posts available • Tap to refresh
          </motion.button>
        )}
      </AnimatePresence>

      {/* Stories Section */}
      <div className="stories-section">
        <StoriesCarousel userId={user?.id} />
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {loading && posts.length === 0 ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="post-skeleton">
              <div className="skeleton-header" />
              <div className="skeleton-image" />
              <div className="skeleton-actions" />
              <div className="skeleton-caption" />
            </div>
          ))
        ) : error ? (
          <div className="error-state">
            <p>Error loading posts: {error}</p>
            <button onClick={handleRefresh} className="retry-button">
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <h3>No Posts Yet</h3>
            <p>Follow people to see their posts here</p>
            <button onClick={() => navigate('/explore')} className="explore-button">
              Explore
            </button>
          </div>
        ) : (
          <>
            {posts.map((post, index) => (
              <div
                key={post.id}
                ref={index === posts.length - 1 ? lastPostRef : null}
              >
                <PostCard
                  post={post}
                  currentUser={user}
                  onDoubleTap={() => handleDoubleTap(post.id)}
                />
              </div>
            ))}
            
            {/* Loading more indicator */}
            {hasMore && <InfiniteScrollLoader />}
          </>
        )}
      </div>

      {/* Focusly AI Floating Button */}
      <motion.button
        className="focusly-button"
        onClick={handleFocuslyClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <span className="focusly-icon">💜</span>
        <span className="focusly-pulse" />
      </motion.button>

      {/* Bottom Navigation */}
      <BottomNav currentPage="home" />
    </div>
  );
}

export default Home;
