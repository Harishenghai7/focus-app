// src/pages/Home.js - MASTER REBUILD
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import FlashStories from '../components/FlashStories';
import PostCard from '../components/PostCard.new';
import NewPostsBanner from '../components/NewPostsBanner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import EndOfFeed from '../components/EndOfFeed';
import CommentsModal from '../components/CommentsModal';
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
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  
  const observerTarget = useRef(null);
  const realtimeChannelRef = useRef(null);

  // Fetch stories/flash
  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('flash_stories')
        .select(`
          id,
          user_id,
          media_url,
          created_at,
          users!flash_stories_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            verified
          )
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err) {
      console.error('Error fetching stories:', err);
    }
  }, []);

  // ========== FETCH POSTS ==========
  const fetchPosts = useCallback(async (pageNum = 0, resetFeed = false) => {
    try {
      if (resetFeed || pageNum === 0) {
        setLoading(true);
        if (resetFeed) setPosts([]);
      } else {
        setLoadingMore(true);
      }

      const offset = pageNum * POSTS_PER_PAGE;
      
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          caption,
          media_urls,
          media_type,
          location,
          created_at,
          users!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            verified
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (postsError) throw postsError;

      // Get likes, comments, and user interactions for each post
      const postsWithData = await Promise.all(
        (postsData || []).map(async (post) => {
          const [likesRes, commentsRes, userLikeRes, userSaveRes] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle()
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
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  // ========== HANDLE LIKE ==========
  const handleLike = async (postId, isLiked) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !isLiked,
              likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1
            }
          : post
      )
    );

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on error
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                isLiked: isLiked,
                likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1
              }
            : post
        )
      );
    }
  };

  // ========== HANDLE SAVE ==========
  const handleSave = async (postId, isSaved) => {
    // Optimistic update
    setPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, isSaved: !isSaved } : post
      )
    );

    try {
      if (isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Revert on error
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, isSaved: isSaved } : post
        )
      );
    }
  };

  // ========== HANDLE COMMENT ==========
  const handleComment = (post) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  // ========== LOAD NEW POSTS ==========
  const loadNewPosts = () => {
    setNewPostsAvailable(false);
    fetchPosts(0, true);
  };

  // ========== INFINITE SCROLL OBSERVER ==========
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(page + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  // ========== REALTIME SUBSCRIPTION ==========
  useEffect(() => {
    const channel = supabase
      .channel('home-posts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        () => {
          setNewPostsAvailable(true);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // ========== INITIAL FETCH ==========
  useEffect(() => {
    if (user) {
      fetchStories();
      fetchPosts(0);
    }
  }, [user, fetchStories, fetchPosts]);

  // ========== RENDER LOADING STATE ==========
  if (loading && posts.length === 0) {
    return (
      <div className="home-page">
        <div className="home-container">
          <LoadingSkeleton count={3} />
        </div>
      </div>
    );
  }

  // ========== RENDER ERROR STATE ==========
  if (error && posts.length === 0) {
    return (
      <div className="home-page">
        <div className="home-container">
          <ErrorBanner message={error} onRetry={() => fetchPosts(0, true)} />
        </div>
      </div>
    );
  }

  // ========== RENDER MAIN CONTENT ==========
  return (
    <div className="home-page">
      <div className="home-container">
        {/* Stories Bar */}
        {stories.length > 0 && (
          <FlashStories 
            stories={stories} 
            currentUser={user}
            onAddStory={() => navigate('/create')}
          />
        )}

        {/* New Posts Banner */}
        {newPostsAvailable && (
          <NewPostsBanner onClick={loadNewPosts} />
        )}

        {/* Posts Feed */}
        <div className="posts-feed">
          {posts.length === 0 ? (
            <EmptyState
              icon="👋"
              title="Welcome to Focus!"
              message="Follow people to see their posts here"
              actionLabel="Explore"
              actionPath="/explore"
            />
          ) : (
            <>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onSave={handleSave}
                  onComment={handleComment}
                />
              ))}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="loading-more">
                  <div className="spinner"></div>
                </div>
              )}

              {/* End of Feed */}
              {!hasMore && posts.length > 0 && <EndOfFeed />}

              {/* Intersection Observer Target */}
              <div ref={observerTarget} style={{ height: '20px' }} />
            </>
          )}
        </div>
      </div>

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <CommentsModal
          post={selectedPost}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;