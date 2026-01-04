// src/pages/Home.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // 🎬 Added for pro animations
import { RefreshCw } from 'lucide-react'; // 💎 Pro icons

import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Components
import FlashStories from '../components/FlashStories';
import PostCard from '../components/PostCard.new';
import NewPostsBanner from '../components/NewPostsBanner';
import LoadingSkeleton from '../components/LoadingSkeleton'; // Ensure this component exists
import EmptyState from '../components/EmptyState'; // Ensure this component exists
import EndOfFeed from '../components/EndOfFeed'; // Ensure this component exists
import CommentsModal from '../components/CommentsModal'; // Ensure this component exists
import ErrorBanner from '../components/ErrorBanner';

import './Home.css';

const POSTS_PER_PAGE = 10;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interaction State
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);

  // Refs
  const observerTarget = useRef(null);
  const realtimeChannelRef = useRef(null);

  // ========== FETCH STORIES ==========
  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flash_stories')
        .select(`
          id, user_id, media_url, created_at,
          users!flash_stories_user_id_fkey (
            id, username, display_name, avatar_url, verified
          )
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err) {
      console.warn('Error fetching stories:', err); // Warn instead of error to not block feed
    }
  }, []);

  // ========== FETCH POSTS ==========
  const fetchPosts = useCallback(async (pageNum = 0, resetFeed = false) => {
    try {
      if (resetFeed || pageNum === 0) {
        if (!resetFeed) setLoading(true); // Only show full loader on initial mount
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const offset = pageNum * POSTS_PER_PAGE;

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, user_id, caption, media_urls, media_type, location, created_at,
          users!posts_user_id_fkey (
            id, username, display_name, avatar_url, verified
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (postsError) throw postsError;

      // Enhance posts with engagement data (Likes/Comments/Saved)
      // In a larger app, consider using an RPC function for performance
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesRes, commentsRes, userLikeRes, userSaveRes] = await Promise.all([
            supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            user ? supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle() : { data: null },
            user ? supabase.from('saved_posts').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle() : { data: null }
          ]);

          return {
            ...post,
            likesCount: likesRes.count || 0,
            commentsCount: commentsRes.count || 0,
            isLiked: !!userLikeRes.data,
            isSaved: !!userSaveRes.data
          };
        })
      );

      if (resetFeed || pageNum === 0) {
        setPosts(postsWithData);
      } else {
        setPosts(prev => [...prev, ...postsWithData]);
      }

      setHasMore(postsWithData.length === POSTS_PER_PAGE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Unable to load feed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // ========== ACTIONS (Optimistic UI) ==========

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Small artificial delay for UX so the user sees the refresh spin
    setTimeout(() => {
      fetchStories();
      fetchPosts(0, true);
    }, 800);
  };

  const handleLike = async (postId, isLiked) => {
    // Optimistic Update
    setPosts(prev => prev.map(p => p.id === postId ? { 
      ...p, 
      isLiked: !isLiked, 
      likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1 
    } : p));

    try {
      const query = supabase.from('post_likes');
      if (isLiked) {
        await query.delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await query.insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('Like error:', err);
      // Revert if failed
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        isLiked: isLiked, 
        likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1 
      } : p));
    }
  };

  const handleSave = async (postId, isSaved) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !isSaved } : p));
    try {
      const query = supabase.from('saved_posts');
      if (isSaved) {
        await query.delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await query.insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('Save error:', err);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: isSaved } : p));
    }
  };

  // ========== OBSERVERS & SUBSCRIPTIONS ==========

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  useEffect(() => {
    const channel = supabase.channel('home-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
        () => setNewPostsAvailable(true)
      )
      .subscribe();
    realtimeChannelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, []);

  // Initial Load
  useEffect(() => {
    if (user) {
      fetchStories();
      fetchPosts(0);
    }
  }, [user, fetchStories, fetchPosts]);


  // ========== RENDER ==========

  // 1. Full Loading State (Initial)
  if (loading && posts.length === 0) {
    return (
      <div className="home-page">
        <div className="home-container">
           {/* Skeleton for Stories */}
          <div className="skeleton-stories" style={{height: 100, marginBottom: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 16}} />
          <LoadingSkeleton count={2} />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error && posts.length === 0) {
    return (
      <div className="home-page">
        <div className="home-container">
          <ErrorBanner 
            message={error} 
            actionLabel="Retry" 
            onRetry={() => fetchPosts(0, true)} 
          />
        </div>
      </div>
    );
  }

  // 3. Main Feed
  return (
    <div className="home-page">
      <div className="home-container">
        
        {/* 📸 Stories Section */}
        {stories.length > 0 && (
          <section className="stories-section" aria-label="Stories">
            <FlashStories 
              stories={stories} 
              currentUser={user}
              onAddStory={() => navigate('/create')}
            />
          </section>
        )}

        {/* 📢 New Posts Banner */}
        <AnimatePresence>
          {newPostsAvailable && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NewPostsBanner onClick={() => {
                setNewPostsAvailable(false);
                handleRefresh();
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📰 Feed */}
        <div className="posts-feed" role="feed">
          {posts.length === 0 ? (
            <EmptyState
              icon="👋"
              title="Your feed is quiet"
              message="Follow some creators to see their moments here."
              actionLabel="Find People"
              onAction={() => navigate('/explore')}
            />
          ) : (
            <>
              <AnimatePresence mode='popLayout'>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index < 3 ? index * 0.1 : 0 }}
                  >
                    <PostCard
                      post={post}
                      currentUser={user}
                      onLike={handleLike}
                      onSave={handleSave}
                      onComment={() => {
                        setSelectedPost(post);
                        setShowComments(true);
                      }}
                      onShare={() => console.log("Share logic here")}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 🔄 Loading More */}
              {loadingMore && (
                <div className="loading-more-container">
                  <RefreshCw className="spinner-icon" size={24} />
                </div>
              )}

              {/* 🛑 End of Feed */}
              {!hasMore && posts.length > 5 && <EndOfFeed />}
              
              {/* 🕵️ Observer Target */}
              <div ref={observerTarget} className="feed-observer" />
            </>
          )}
        </div>
      </div>

      {/* 💬 Modals */}
      <AnimatePresence>
        {showComments && selectedPost && (
          <CommentsModal
            post={selectedPost}
            onClose={() => {
              setShowComments(false);
              setSelectedPost(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;