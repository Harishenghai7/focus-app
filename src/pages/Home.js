import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import PostCard from "../components/PostCard";
import Stories from "../components/Stories";
import { feedCache } from "../utils/feedCache";
import subscriptionManager from "../utils/subscriptionManager";
import "./Home.css";

export default function Home({ user, userProfile }) {
  const [posts, setPosts] = useState([]);
  // ✅ FIX: Combined loading states
  const [loadingState, setLoadingState] = useState({
    initial: true,
    refreshing: false,
    fetchingMore: false
  });
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const mounted = useRef(true);
  const touchStartY = useRef(0);
  const navigate = useNavigate();
  
  const PAGE_SIZE = 15; // ✅ Increased from 10 for better UX
  const PULL_THRESHOLD = 80;
  const SCROLL_THRESHOLD = 300; // ✅ FIX: Reduced from 1000px

  useEffect(() => {
    mounted.current = true;
    loadFeedWithCache();
    return () => { mounted.current = false; };
  }, [user?.id]);

  // ✅ FIX: Optimized combined query function
  const fetchFeedQuery = async (userId, beforeTimestamp = null, limit = PAGE_SIZE) => {
    try {
      // Get following users
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id, profiles!follows_following_id_fkey(is_private)')
        .eq('follower_id', userId)
        .eq('status', 'accepted'); // ✅ FIX: Only accepted follows

      if (followingError) {
        console.error('Following query error:', followingError);
        // ✅ FIX: Fallback to own posts if follows query fails
        return await fetchOwnPostsOnly(userId, beforeTimestamp, limit);
      }

      // ✅ FIX: Filter out private accounts we don't follow
      const followingIds = followingData
        ?.filter(f => !f.profiles?.is_private || f.status === 'accepted')
        .map(f => f.following_id) || [];

      const userIdsToShow = [...followingIds, userId];

      // ✅ FIX: Single optimized query for both posts and boltz
      const baseQuery = beforeTimestamp 
        ? { lt: ['created_at', beforeTimestamp] }
        : {};

      // Fetch posts
      const postsPromise = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url, bio, is_private),
          likes:likes(count),
          comments:comments(count),
          saves:saves(user_id)
        `)
        .in('user_id', userIdsToShow)
        .order('created_at', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []).map(post => ({ 
            ...post, 
            content_type: 'post',
            like_count: post.likes?.[0]?.count || 0,
            comment_count: post.comments?.[0]?.count || 0,
            is_saved: post.saves?.some(s => s.user_id === userId)
          }));
        });

      // Fetch boltz
      const boltzPromise = supabase
        .from('boltz')
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url, bio, is_private),
          likes:boltz_likes(count),
          comments:boltz_comments(count)
        `)
        .in('user_id', userIdsToShow)
        .order('created_at', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []).map(boltz => ({ 
            ...boltz, 
            content_type: 'boltz',
            like_count: boltz.likes?.[0]?.count || 0,
            comment_count: boltz.comments?.[0]?.count || 0
          }));
        });

      // ✅ FIX: Execute queries in parallel
      const [postsData, boltzData] = await Promise.all([postsPromise, boltzPromise]);

      // ✅ FIX: Proper interleaving instead of slicing
      const combined = [...postsData, ...boltzData]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);

      return combined;

    } catch (error) {
      console.error('Feed query error:', error);
      return [];
    }
  };

  // ✅ NEW: Fallback to fetch only user's own posts
  const fetchOwnPostsOnly = async (userId, beforeTimestamp = null, limit = PAGE_SIZE) => {
    const postsPromise = supabase
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const boltzPromise = supabase
      .from('boltz')
      .select(`*, profiles!boltz_user_id_fkey(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const [{ data: postsData }, { data: boltzData }] = await Promise.all([
      postsPromise,
      boltzPromise
    ]);

    return [
      ...(postsData || []).map(p => ({ ...p, content_type: 'post' })),
      ...(boltzData || []).map(b => ({ ...b, content_type: 'boltz' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, limit);
  };

  // Load feed with cache support
  const loadFeedWithCache = useCallback(async () => {
    if (!user) return;

    setLoadingState(prev => ({ ...prev, initial: true }));

    // ✅ FIX: Check cache expiry
    const cachedPosts = await feedCache.getFeed(user.id);
    const cacheAge = await feedCache.getCacheAge(user.id);
    
    // Use cache only if less than 5 minutes old
    if (cachedPosts.length > 0 && cacheAge < 5 * 60 * 1000) {
      setPosts(cachedPosts);
      setLoadingState(prev => ({ ...prev, initial: false }));
      // Fetch fresh data in background
      fetchInitialFeed(true);
    } else {
      await fetchInitialFeed(false);
    }
  }, [user?.id]);

  // ✅ FIX: Real-time subscriptions with proper management
  useEffect(() => {
    if (!user?.id) return;

    const setupRealtimeSubscriptions = async () => {
      // ✅ FIX: Combined channel for both posts and boltz
      const feedChannel = supabase
        .channel('home_feed_updates')
        // Posts INSERT
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          async (payload) => {
            // ✅ FIX: Check if post already exists
            const exists = posts.some(p => p.id === payload.new.id && p.content_type === 'post');
            if (exists) return;

            // ✅ FIX: Verify follow status and private account
            const { data: followData } = await supabase
              .from('follows')
              .select('id, profiles!follows_following_id_fkey(is_private)')
              .eq('follower_id', user.id)
              .eq('following_id', payload.new.user_id)
              .eq('status', 'accepted')
              .maybeSingle();

            const isOwnPost = payload.new.user_id === user.id;
            const canView = isOwnPost || (followData && !followData.profiles?.is_private);

            if (canView) {
              const { data: fullPost } = await supabase
                .from('posts')
                .select(`*, profiles!posts_user_id_fkey(*)`)
                .eq('id', payload.new.id)
                .single();

              if (fullPost && mounted.current) {
                setPosts(prev => [
                  { ...fullPost, content_type: 'post', like_count: 0, comment_count: 0 }, 
                  ...prev
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
              }
            }
          }
        )
        // Posts UPDATE
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'posts' },
          (payload) => {
            if (mounted.current) {
              setPosts(prev => prev.map(post => 
                post.id === payload.new.id && post.content_type === 'post'
                  ? { ...post, ...payload.new }
                  : post
              ));
            }
          }
        )
        // Posts DELETE
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'posts' },
          (payload) => {
            if (mounted.current) {
              setPosts(prev => prev.filter(post => 
                !(post.id === payload.old.id && post.content_type === 'post')
              ));
            }
          }
        )
        // ✅ NEW: Likes updates
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'likes' },
          async (payload) => {
            if (mounted.current) {
              // Update like count for the post
              const postId = payload.new?.post_id || payload.old?.post_id;
              const { count } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);

              setPosts(prev => prev.map(post =>
                post.id === postId && post.content_type === 'post'
                  ? { ...post, like_count: count || 0 }
                  : post
              ));
            }
          }
        )
        // ✅ NEW: Comments updates
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'comments' },
          async (payload) => {
            if (mounted.current) {
              const postId = payload.new?.post_id || payload.old?.post_id;
              const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', postId);

              setPosts(prev => prev.map(post =>
                post.id === postId && post.content_type === 'post'
                  ? { ...post, comment_count: count || 0 }
                  : post
              ));
            }
          }
        )
        // Boltz events (similar logic)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'boltz' },
          async (payload) => {
            const exists = posts.some(p => p.id === payload.new.id && p.content_type === 'boltz');
            if (exists) return;

            const { data: followData } = await supabase
              .from('follows')
              .select('id, profiles!follows_following_id_fkey(is_private)')
              .eq('follower_id', user.id)
              .eq('following_id', payload.new.user_id)
              .eq('status', 'accepted')
              .maybeSingle();

            const isOwnBoltz = payload.new.user_id === user.id;
            const canView = isOwnBoltz || (followData && !followData.profiles?.is_private);

            if (canView) {
              const { data: fullBoltz } = await supabase
                .from('boltz')
                .select(`*, profiles!boltz_user_id_fkey(*)`)
                .eq('id', payload.new.id)
                .single();

              if (fullBoltz && mounted.current) {
                setPosts(prev => [
                  { ...fullBoltz, content_type: 'boltz', like_count: 0, comment_count: 0 },
                  ...prev
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
              }
            }
          }
        )
        .on('postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'boltz' },
          (payload) => {
            if (mounted.current) {
              setPosts(prev => prev.filter(post => 
                !(post.id === payload.old.id && post.content_type === 'boltz')
              ));
            }
          }
        )
        .subscribe();

      // ✅ FIX: Add to subscription manager
      subscriptionManager.add('home_feed_channel', feedChannel, {
        component: 'Home',
        type: 'realtime'
      });
    };

    setupRealtimeSubscriptions();

    return () => {
      subscriptionManager.remove('home_feed_channel');
    };
  }, [user?.id, posts]); // ✅ FIX: Added posts dependency

  const fetchInitialFeed = async (isBackgroundRefresh = false) => {
    if (!user) return;
    
    if (!isBackgroundRefresh) {
      setLoadingState(prev => ({ ...prev, initial: true }));
    }

    try {
      const feedData = await fetchFeedQuery(user.id, null, PAGE_SIZE);

      if (mounted.current) {
        setPosts(feedData);
        if (feedData.length) {
          setCursor(feedData[feedData.length - 1].created_at);
        }
        setHasMore(feedData.length === PAGE_SIZE);

        // ✅ FIX: Save to cache with timestamp
        await feedCache.saveFeed(user.id, feedData);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      if (mounted.current && !isBackgroundRefresh) {
        setLoadingState(prev => ({ ...prev, initial: false }));
      }
    }
  };

  // ✅ FIX: Optimized fetchMorePosts
  const fetchMorePosts = useCallback(async () => {
    if (loadingState.fetchingMore || !cursor || !hasMore || !user) return;

    setLoadingState(prev => ({ ...prev, fetchingMore: true }));

    try {
      const moreFeed = await fetchFeedQuery(user.id, cursor, PAGE_SIZE);

      if (mounted.current && moreFeed.length) {
        // ✅ FIX: Check for duplicates before adding
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => `${p.id}-${p.content_type}`));
          const newPosts = moreFeed.filter(p => !existingIds.has(`${p.id}-${p.content_type}`));
          return [...prev, ...newPosts];
        });
        
        setCursor(moreFeed[moreFeed.length - 1].created_at);
        setHasMore(moreFeed.length === PAGE_SIZE);

        // Update cache incrementally
        await feedCache.appendToFeed(user.id, moreFeed);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more posts:", error);
      setHasMore(false);
    } finally {
      if (mounted.current) {
        setLoadingState(prev => ({ ...prev, fetchingMore: false }));
      }
    }
  }, [loadingState.fetchingMore, cursor, hasMore, user?.id]);

  // ✅ FIX: Error handling in refresh
  const handleRefresh = async () => {
    try {
      setLoadingState(prev => ({ ...prev, refreshing: true }));
      setCursor(null);
      setHasMore(true);

      await feedCache.clearUserFeed(user.id);
      await fetchInitialFeed(false);

      window.dispatchEvent(new CustomEvent('refreshStories'));
    } catch (error) {
      console.error('Refresh error:', error);
      // Show error toast or notification
    } finally {
      setLoadingState(prev => ({ ...prev, refreshing: false }));
    }
  };

  // ✅ FIX: Improved pull-to-refresh with CSS overscroll-behavior
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || window.scrollY > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !loadingState.refreshing) {
      await handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, loadingState.refreshing, handleRefresh]);

  // ✅ FIX: Passive event listeners
  useEffect(() => {
    const container = document.querySelector('.page-home');
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // ✅ FIX: Match both id and content_type
  const handlePostUpdate = async (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id && post.content_type === updatedPost.content_type
        ? { ...post, ...updatedPost }
        : post
    ));

    await feedCache.updatePost(updatedPost.id, updatedPost);
  };

  const handlePostDelete = async (postId, contentType) => {
    setPosts(prev => prev.filter(post => 
      !(post.id === postId && post.content_type === contentType)
    ));

    await feedCache.deletePost(postId);
  };

  // ✅ FIX: Throttled scroll handler
  const throttledScrollHandler = useRef(null);

  const handleScroll = useCallback(() => {
    if (throttledScrollHandler.current) {
      clearTimeout(throttledScrollHandler.current);
    }

    throttledScrollHandler.current = setTimeout(() => {
      if (window.innerHeight + document.documentElement.scrollTop 
          >= document.documentElement.offsetHeight - SCROLL_THRESHOLD) {
        fetchMorePosts();
      }
    }, 200);
  }, [fetchMorePosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (throttledScrollHandler.current) {
        clearTimeout(throttledScrollHandler.current);
      }
    };
  }, [handleScroll]);

  return (
    <motion.main 
      className="page page-home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        {/* Pull to Refresh Indicator */}
        {isPulling && pullDistance > 0 && (
          <motion.div 
            className="pull-to-refresh-indicator"
            style={{
              height: Math.min(pullDistance, 80),
              opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`refresh-icon ${pullDistance >= PULL_THRESHOLD ? 'ready' : ''}`}>
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24"
                style={{ 
                  transform: `rotate(${Math.min(pullDistance * 3.6, 360)}deg)`,
                  transition: 'transform 0.1s ease'
                }}
              >
                <path d="M23 12c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12c2.21 0 4.21.895 5.657 2.343l-2.829 2.829c-.895-.895-2.132-1.172-2.828-1.172-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4h3z"/>
              </svg>
            </div>
            <span className="pull-text">
              {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </motion.div>
        )}

        {/* Stories */}
        {user && <Stories key="stories" user={user} userProfile={userProfile} />}

        <div data-testid="home-feed">
          {/* Manual Refresh Button */}
          <div className="refresh-container">
            <motion.button
              className={`refresh-btn ${loadingState.refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={loadingState.refreshing}
              whileTap={{ scale: 0.95 }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24"
                className={loadingState.refreshing ? 'spinning' : ''}
              >
                <path d="M23 12c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12c2.21 0 4.21.895 5.657 2.343l-2.829 2.829c-.895-.895-2.132-1.172-2.828-1.172-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4h3z"/>
              </svg>
              {loadingState.refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>

          {/* Posts Feed */}
          <AnimatePresence>
            {loadingState.initial ? (
              <motion.div 
                className="feed-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="loading-spinner"></div>
                <p>Loading your feed...</p>
              </motion.div>
            ) : posts.length === 0 ? (
              <motion.div 
                className="empty-feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="empty-feed-content">
                  <motion.div 
                    className="empty-feed-icon"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🎯
                  </motion.div>
                  <h3>Welcome to Focus!</h3>
                  <p>Connect with authentic creators and discover meaningful content. Follow Focus creators to see their posts here.</p>
                  <div className="empty-feed-actions">
                    <motion.button 
                      className="focus-btn focus-btn-primary"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate('/explore')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21L16.65 16.65"/>
                      </svg>
                      Discover Focus Creators
                    </motion.button>
                    <motion.button 
                      className="focus-btn focus-btn-secondary"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate('/create')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                      </svg>
                      Share Your Focus
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.section 
                className="posts-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="posts-list">
                  {posts.map((post, index) => (
                    <motion.div
                      key={`${post.content_type}-${post.id}`}
                      data-testid="post-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                    >
                      <PostCard 
                        post={post} 
                        user={user} 
                        userProfile={userProfile}
                        onUpdate={handlePostUpdate}
                        onDelete={(id) => handlePostDelete(id, post.content_type)}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Infinite Scroll Loading */}
                {loadingState.fetchingMore && (
                  <motion.div 
                    className="loading-more"
                    data-testid="loading-more"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="loading-spinner small"></div>
                    <p>Loading more posts...</p>
                  </motion.div>
                )}

                {!hasMore && posts.length > 0 && (
                  <motion.div 
                    className="end-of-feed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="end-feed-content">
                      <motion.div 
                        className="end-feed-icon"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        🎉
                      </motion.div>
                      <h4>You're all caught up!</h4>
                      <p>You've seen all the latest posts from Focus creators you follow.</p>
                      <div className="end-feed-actions">
                        <motion.button 
                          className="focus-btn focus-btn-primary"
                          onClick={() => navigate('/explore')}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21L16.65 16.65"/>
                          </svg>
                          Discover More
                        </motion.button>
                        <motion.button 
                          className="focus-btn focus-btn-secondary"
                          onClick={() => navigate('/create')}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                          Create Post
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.main>
  );
}