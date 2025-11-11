import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import PostCard from "../components/PostCard";
import Stories from "../components/Stories";
import { feedCache } from "../utils/feedCache";
import "./Home.css";

export default function Home({ user, userProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const mounted = useRef(true);

  const touchStartY = useRef(0);
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const PULL_THRESHOLD = 80;

  useEffect(() => {
    mounted.current = true;
    loadFeedWithCache();
    return () => { mounted.current = false; };
  }, [user?.id]);

  // Load feed with cache support
  const loadFeedWithCache = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    
    // Try to load from cache first
    const cachedPosts = await feedCache.getFeed(user.id);
    if (cachedPosts.length > 0) {
      setPosts(cachedPosts);
      setLoading(false);
      // Fetch fresh data in background
      fetchInitialFeed(true);
    } else {
      // No cache, fetch normally
      await fetchInitialFeed(false);
    }
  }, [user?.id]);

  // Realtime subscriptions for new posts and boltz
  useEffect(() => {
    if (!user?.id) return;

    const postsChannel = supabase
      .channel('home_feed_posts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          const { data: isFollowing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', payload.new.user_id)
            .maybeSingle();

          if (isFollowing || payload.new.user_id === user.id) {
            const { data: fullPost } = await supabase
              .from('posts')
              .select(`*, profiles!posts_user_id_fkey(id, username, full_name, avatar_url, bio)`)
              .eq('id', payload.new.id)
              .single();

            if (fullPost && mounted.current) {
              setPosts(prev => [{ ...fullPost, content_type: 'post' }, ...prev]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              );
            }
          }
        }
      )
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
      .subscribe();

    const boltzChannel = supabase
      .channel('home_feed_boltz')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'boltz' },
        async (payload) => {
          const { data: isFollowing } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', payload.new.user_id)
            .maybeSingle();

          if (isFollowing || payload.new.user_id === user.id) {
            const { data: fullBoltz } = await supabase
              .from('boltz')
              .select(`*, profiles!boltz_user_id_fkey(id, username, full_name, avatar_url, bio)`)
              .eq('id', payload.new.id)
              .single();

            if (fullBoltz && mounted.current) {
              setPosts(prev => [{ ...fullBoltz, content_type: 'boltz' }, ...prev]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              );
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

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(boltzChannel);
    };
  }, [user?.id]);

  const fetchInitialFeed = async (isBackgroundRefresh = false) => {
    if (!user) return;
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    try {
      // First get the users that current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Include own user ID to see own posts
      const userIdsToShow = [...followingIds, user.id];

      // Fetch posts from followed users + own posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url, bio)
        `)
        .in('user_id', userIdsToShow)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (postsError) throw postsError;

      // Fetch boltz from followed users + own boltz
      const { data: boltzData, error: boltzError } = await supabase
        .from('boltz')
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url, bio)
        `)
        .in('user_id', userIdsToShow)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (boltzError) throw boltzError;

      // Combine and sort by created_at
      const combinedFeed = [
        ...(postsData || []).map(post => ({ ...post, content_type: 'post' })),
        ...(boltzData || []).map(boltz => ({ ...boltz, content_type: 'boltz' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
       .slice(0, PAGE_SIZE);

      if (mounted.current) {
        setPosts(combinedFeed);
        if (combinedFeed.length) {
          setCursor(combinedFeed[combinedFeed.length - 1].created_at);
        }
        setHasMore(combinedFeed.length === PAGE_SIZE);
        
        // Save to cache
        await feedCache.saveFeed(user.id, combinedFeed);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      if (mounted.current && !isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };

  const fetchMorePosts = useCallback(async () => {
    if (fetchingMore || !cursor || !hasMore || !user) return;

    setFetchingMore(true);
    try {
      // First get the users that current user follows
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Include own user ID
      const userIdsToShow = [...followingIds, user.id];

      // Fetch more posts from followed users + own posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, username, full_name, avatar_url, bio)
        `)
        .in('user_id', userIdsToShow)
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (postsError) throw postsError;

      // Fetch more boltz from followed users + own boltz
      const { data: boltzData, error: boltzError} = await supabase
        .from('boltz')
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url, bio)
        `)
        .in('user_id', userIdsToShow)
        .lt('created_at', cursor)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (boltzError) throw boltzError;

      // Combine and sort
      const moreFeed = [
        ...(postsData || []).map(post => ({ ...post, content_type: 'post' })),
        ...(boltzData || []).map(boltz => ({ ...boltz, content_type: 'boltz' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
       .slice(0, PAGE_SIZE);

      if (mounted.current && moreFeed.length) {
        setPosts(prev => [...prev, ...moreFeed]);
        setCursor(moreFeed[moreFeed.length - 1].created_at);
        setHasMore(moreFeed.length === PAGE_SIZE);
        
        // Update cache with new posts
        await feedCache.saveFeed(user.id, [...posts, ...moreFeed]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more posts:", error);
      setHasMore(false);
    } finally {
      if (mounted.current) setFetchingMore(false);
    }
  }, [fetchingMore, cursor, hasMore, user?.id, posts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCursor(null);
    setHasMore(true);
    
    // Clear cache and fetch fresh
    await feedCache.clearUserFeed(user.id);
    await fetchInitialFeed(false);
    
    window.dispatchEvent(new CustomEvent('refreshStories'));
    setRefreshing(false);
  };

  // Pull-to-refresh handlers
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
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      await handleRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, handleRefresh]);

  // Add touch event listeners
  useEffect(() => {
    const container = document.querySelector('.page-home');
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const handlePostUpdate = async (updatedPost) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? { ...post, ...updatedPost } : post
    ));
    
    // Update cache
    await feedCache.updatePost(updatedPost.id, updatedPost);
  };

  const handlePostDelete = async (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    
    // Remove from cache
    await feedCache.deletePost(postId);
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 1000) {
      fetchMorePosts();
    }
  }, [fetchMorePosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

        {/* Focus Flash Stories */}
        {user && <Stories key="stories" user={user} userProfile={userProfile} />}

        <div data-testid="home-feed">

        {/* Manual Refresh Button */}
        <div className="refresh-container">
          <motion.button
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            whileTap={{ scale: 0.95 }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24"
              className={refreshing ? 'spinning' : ''}
            >
              <path d="M23 12c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12c2.21 0 4.21.895 5.657 2.343l-2.829 2.829c-.895-.895-2.132-1.172-2.828-1.172-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4h3z"/>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>
        
        {/* Posts Feed */}
        <AnimatePresence>
          {loading ? (
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
              {/* Posts List */}
              <div className="posts-list">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    data-testid="post-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <PostCard 
                      post={post} 
                      user={user} 
                      userProfile={userProfile}
                      onUpdate={handlePostUpdate}
                      onDelete={handlePostDelete}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Infinite Scroll Loading */}
              {fetchingMore && (
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