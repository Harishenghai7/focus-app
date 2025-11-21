/**
 * PostCard Component (P10-A)
 * 
 * Full-featured social media post card with comprehensive interactions.
 * 
 * Features:
 * - Author info (avatar, username, timestamp)
 * - Post image/video/carousel support
 * - Caption with @mentions and #hashtags
 * - Like/comment/share buttons
 * - Like count, comment count display
 * - Save button
 * - Options menu (3 dots)
 * - Double-tap to like
 * - View insights (own post)
 * 
 * @component
 * @example
 * <PostCard 
 *   post={postData}
 *   user={currentUser}
 *   mode="feed"
 * />
 * 
 * @param {Object} post - Post data object
 * @param {string} post.id - Unique post identifier
 * @param {string} post.caption - Post caption/description
 * @param {string|Array} post.media_url - Single media URL
 * @param {Array} post.media_urls - Multiple media URLs for carousel
 * @param {Array} post.media_types - Media types (image/video)
 * @param {boolean} post.is_carousel - Is multi-media post
 * @param {number} post.likes_count - Total likes
 * @param {number} post.comments_count - Total comments
 * @param {boolean} post.is_liked - Current user liked
 * @param {boolean} post.is_saved - Current user saved
 * @param {Object} post.profiles - Author profile info
 * @param {string} post.created_at - Creation timestamp
 * @param {Object} user - Current user object
 * @param {string} user.id - User ID
 * @param {string} mode - Display mode ('feed' | 'grid' | 'detail')
 * @param {Function} onDelete - Callback when post deleted
 * @param {Function} onUpdate - Callback when post updated
 * @returns {React.ReactElement} PostCard component
 * 
 * Props: post (object), user (object), mode ('feed' | 'grid' | 'detail')
 * Hooks: useRealtimeInteractions
 * Utils: formatDate, formatNumber, linkify
 * Layout: Responsive card, max-width 614px
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
import { formatDate, formatTimeAgo } from '../utils/dateFormatter';
import { formatNumber } from '../utils/helpers';
import { linkifyMentions, linkifyHashtags } from '../utils/linkifiedText';
import CommentsModal from './CommentsModal';
import ShareModal from './ShareModal';
import MusicPlayer from './MusicPlayer/MusicPlayer';
import styles from './PostCard.module.css';
import './PostCard.css';

/**
 * PostCard - Memoized component to prevent unnecessary re-renders
 */
const PostCard = React.memo(function PostCard({ post, user, mode = 'feed', onDelete, onUpdate }) {
  // State management
  const [liked, setLiked] = useState(post?.is_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [saved, setSaved] = useState(post?.is_saved || false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [doubleTapTimeout, setDoubleTapTimeout] = useState(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRef = useRef(null);
  const mounted = useRef(true);
  
  const isOwnPost = user?.id === post?.user_id;

  // ✅ USE REALTIME INTERACTIONS HOOK
  const {
    likesCount: realtimeLikesCount,
    commentsCount: realtimeCommentsCount,
    isLiked: realtimeIsLiked,
    loading: realtimeLoading
  } = useRealtimeInteractions(post?.id, 'post', user);

  // Sync realtime data with local state
  useEffect(() => {
    if (!realtimeLoading) {
      setLikesCount(realtimeLikesCount);
      setLiked(realtimeIsLiked);
    }
  }, [realtimeLikesCount, realtimeIsLiked, realtimeLoading]);

  // ✅ ENHANCED: Better media handling
  const mediaArray = useMemo(() => {
    if (post?.is_carousel && post?.media_urls) {
      return Array.isArray(post.media_urls) ? post.media_urls : [post.media_urls];
    }
    return post?.media_url ? [post.media_url] : [];
  }, [post?.is_carousel, post?.media_urls, post?.media_url]);

  const mediaTypes = useMemo(() => {
    if (post?.is_carousel && post?.media_types) {
      return Array.isArray(post.media_types) ? post.media_types : [post.media_types];
    }
    const url = post?.media_url || '';
    return [url.match(/\.(mp4|webm|mov|avi)$/i) ? 'video' : 'image'];
  }, [post?.is_carousel, post?.media_types, post?.media_url]);

  // ✅ MODE-BASED DISPLAY CLASS
  const cardClassName = useMemo(() => {
    const classes = ['post-card', `post-card-${mode}`];
    if (processing) classes.push('processing');
    return classes.join(' ');
  }, [mode, processing]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user?.id && post?.id) {
      checkLikedStatus();
      checkSavedStatus();
    }
  }, [user?.id, post?.id]);

  // ✅ ENHANCED: Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && showMenu) {
        setShowMenu(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMenu]);

  // ✅ ENHANCED: Optimistic updates for like status
  const checkLikedStatus = async () => {
    if (!user?.id || !post?.id) return;

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (mounted.current) {
        setLiked(!!data);
      }
    } catch (error) {
      console.error('Error checking liked status:', error);
    }
  };

  const checkSavedStatus = async () => {
    if (!user?.id || !post?.id) return;

    try {
      const { data, error } = await supabase
        .from('saves')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (mounted.current) {
        setSaved(!!data);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  // ✅ DOUBLE-TAP TO LIKE
  const handleDoubleTap = useCallback(() => {
    if (!liked && user?.id && !processing) {
      setShowLikeAnimation(true);
      handleLike();
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  }, [liked, user?.id, processing]);

  const handleMediaClick = useCallback((e) => {
    // Prevent double-tap on video controls
    if (e.target.tagName === 'VIDEO' && videoPlaying) return;

    if (doubleTapTimeout) {
      // Double tap detected
      clearTimeout(doubleTapTimeout);
      setDoubleTapTimeout(null);
      handleDoubleTap();
    } else {
      // First tap
      const timeout = setTimeout(() => {
        setDoubleTapTimeout(null);
      }, 300);
      setDoubleTapTimeout(timeout);
    }
  }, [doubleTapTimeout, handleDoubleTap, videoPlaying]);

  // ✅ ENHANCED: Optimistic UI updates with rollback on error
  const handleLike = async () => {
    if (!user?.id || !post?.id || processing) return;

    const previousLiked = liked;
    const previousCount = likesCount;

    // Optimistic update
    setLiked(!liked);
    setLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);

    try {
      setProcessing(true);

      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;

        // Delete notification
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', post.user_id)
          .eq('actor_id', user.id)
          .eq('post_id', post.id)
          .eq('type', 'like');

      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: post.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        // Create notification (only for others' posts)
        if (post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'like',
              post_id: post.id,
              created_at: new Date().toISOString(),
              is_read: false
            });
        }
      }

    } catch (error) {
      console.error('Error liking/unliking post:', error);
      // Rollback on error
      if (mounted.current) {
        setLiked(previousLiked);
        setLikesCount(previousCount);
      }
    } finally {
      if (mounted.current) {
        setProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user?.id || !post?.id || processing) return;

    const previousSaved = saved;

    // Optimistic update
    setSaved(!saved);

    try {
      setProcessing(true);

      if (saved) {
        const { error } = await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saves')
          .insert({
            user_id: user.id,
            post_id: post.id,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving/unsaving post:', error);
      // Rollback on error
      if (mounted.current) {
        setSaved(previousSaved);
      }
    } finally {
      if (mounted.current) {
        setProcessing(false);
      }
    }
  };

  const handleEdit = () => {
    navigate(`/edit-post/${post.id}`);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);

      // Delete associated media from storage if needed
      if (post.media_url && post.media_url.includes('supabase')) {
        const fileName = post.media_url.split('/').pop();
        await supabase.storage.from('posts').remove([fileName]);
      }

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      setShowMenu(false);
      
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      if (mounted.current) {
        setProcessing(false);
      }
    }
  };

  const handleArchive = async () => {
    try {
      setProcessing(true);

      const { error } = await supabase
        .from('posts')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', post.id);

      if (error) throw error;

      setShowMenu(false);
      
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error archiving post:', error);
      alert('Failed to archive post.');
    } finally {
      if (mounted.current) {
        setProcessing(false);
      }
    }
  };

  const handleReport = async () => {
    const reason = prompt(
      'Why are you reporting this post?\n\nOptions:\n- spam\n- harassment\n- inappropriate\n- fake\n- copyright\n- other'
    );

    if (!reason) return;

    try {
      setProcessing(true);

      await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: post.user_id,
          post_id: post.id,
          reason: reason.toLowerCase(),
          description: reason,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      alert('Report submitted. We will review it shortly.');
      setShowMenu(false);
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Failed to submit report.');
    } finally {
      if (mounted.current) {
        setProcessing(false);
      }
    }
  };

  const handleViewInsights = () => {
    if (isOwnPost) {
      navigate(`/insights/post/${post.id}`);
      setShowMenu(false);
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    alert('Post link copied!');
    setShowMenu(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.profiles?.username}'s post on Focus`,
          text: post.caption || 'Check out this post!',
          url: `${window.location.origin}/post/${post.id}`
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      setShowShare(true);
    }
    setShowMenu(false);
  };

  const nextMedia = () => {
    if (currentMediaIndex < mediaArray.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
      setImageLoaded(false);
    }
  };

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
      setImageLoaded(false);
    }
  };

  // ✅ ENHANCED: Linkify caption with mentions and hashtags
  const formatCaption = useCallback((caption) => {
    if (!caption) return null;

    // Split by mentions and hashtags while preserving them
    return (caption.split(/(@\w+|#\w+)/g) || []).map((part, index) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            className="mention"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${username}`);
            }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/profile/${username}`);
              }
            }}
            aria-label={`Mention ${username}`}
          >
            {part}
          </span>
        );
      } else if (part.startsWith('#')) {
        const hashtag = part.slice(1);
        return (
          <span
            key={index}
            className="hashtag"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/explore?q=${encodeURIComponent(hashtag)}`);
            }}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(`/explore?q=${encodeURIComponent(hashtag)}`);
              }
            }}
            aria-label={`Hashtag ${hashtag}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  }, [navigate]);

  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }, []);

  if (!post) {
    return null;
  }

  return (
    <motion.article
      className={cardClassName}
      data-post-id={post.id}
      initial={{ opacity: 0, y: mode === 'grid' ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      role="article"
      aria-label={`Post by ${post.profiles?.username || 'user'}`}
      style={{ maxWidth: mode === 'feed' || mode === 'detail' ? '614px' : '100%' }}
    >
      {/* Post Header */}
      <header className="post-header">
        <div
          className="post-author"
          onClick={() => navigate(`/profile/${post.profiles?.username}`)}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              navigate(`/profile/${post.profiles?.username}`);
            }
          }}
        >
          <img
            src={post.profiles?.avatar_url || '/default-avatar.png'}
            alt={`${post.profiles?.username}'s avatar`}
            className="author-avatar"
            loading="lazy"
          />
          <div className="author-info">
            <div className="author-name">
              {post.profiles?.username || 'Unknown User'}
              {post.profiles?.verified && (
                <span className="verified-badge" title="Verified" aria-label="Verified">✓</span>
              )}
            </div>
            {post.location && (
              <div className="post-location" title={post.location}>
                📍 {post.location}
              </div>
            )}
          </div>
        </div>

        <div className="post-menu-container" ref={menuRef}>
          <motion.button
            className="btn-menu"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            whileTap={{ scale: 0.9 }}
            aria-label="Post options"
            aria-expanded={showMenu}
          >
            ⋯
          </motion.button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="post-menu"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                role="menu"
              >
                {isOwnPost ? (
                  <>
                    <button 
                      className="menu-item" 
                      onClick={handleViewInsights}
                      role="menuitem"
                      aria-label="View post insights"
                    >
                      <span aria-hidden="true">📊</span> View Insights
                    </button>
                    <button 
                      className="menu-item" 
                      onClick={handleEdit} 
                      disabled={processing}
                      role="menuitem"
                    >
                      <span aria-hidden="true">✏️</span> Edit
                    </button>
                    <button 
                      className="menu-item" 
                      onClick={handleArchive} 
                      disabled={processing}
                      role="menuitem"
                    >
                      <span aria-hidden="true">📦</span> Archive
                    </button>
                    <button 
                      className="menu-item danger" 
                      onClick={handleDelete} 
                      disabled={processing}
                      role="menuitem"
                    >
                      <span aria-hidden="true">🗑️</span> Delete
                    </button>
                    <button 
                      className="menu-item" 
                      onClick={handleCopyLink}
                      role="menuitem"
                    >
                      <span aria-hidden="true">🔗</span> Copy Link
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="menu-item danger report-btn report-post report-content" 
                      onClick={handleReport} 
                      disabled={processing}
                      role="menuitem"
                      aria-label="Report this post"
                      data-testid="report-content"
                      id={`report-btn-${post.id}`}
                    >
                      <span aria-hidden="true">⚠️</span> Report
                    </button>
                    <button 
                      className="menu-item" 
                      onClick={handleCopyLink}
                      role="menuitem"
                    >
                      <span aria-hidden="true">🔗</span> Copy Link
                    </button>
                    <button 
                      className="menu-item" 
                      onClick={handleShare}
                      role="menuitem"
                    >
                      <span aria-hidden="true">📤</span> Share
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Post Media */}
      <div className="post-media-container" ref={mediaRef}>
        {mediaArray && mediaArray.length > 0 && (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMediaIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="media-wrapper"
                onClick={handleMediaClick}
              >
                {mediaTypes[currentMediaIndex] === 'video' ? (
                  <video
                    ref={videoRef}
                    src={mediaArray[currentMediaIndex]}
                    controls
                    className="post-media"
                    playsInline
                    preload="metadata"
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    aria-label="Post video"
                  />
                ) : (
                  <>
                    {!imageLoaded && (
                      <div className="media-skeleton" aria-hidden="true">
                        <div className="skeleton-shimmer"></div>
                      </div>
                    )}
                    <img
                      src={mediaArray[currentMediaIndex]}
                      alt={`Post media ${currentMediaIndex + 1}`}
                      className="post-media"
                      onLoad={() => setImageLoaded(true)}
                      loading="lazy"
                      style={{ display: imageLoaded ? 'block' : 'none' }}
                    />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Double-tap Like Animation */}
            <AnimatePresence>
              {showLikeAnimation && (
                <motion.div
                  className="double-tap-like-animation"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.2, 1], opacity: [1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  aria-hidden="true"
                >
                  ❤️
                </motion.div>
              )}
            </AnimatePresence>

            {mediaArray.length > 1 && (
              <>
                {currentMediaIndex > 0 && (
                  <motion.button
                    className="media-nav media-nav-prev"
                    onClick={prevMedia}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Previous media"
                  >
                    ‹
                  </motion.button>
                )}
                {currentMediaIndex < mediaArray.length - 1 && (
                  <motion.button
                    className="media-nav media-nav-next"
                    onClick={nextMedia}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Next media"
                  >
                    ›
                  </motion.button>
                )}
                <div className="media-indicators" role="tablist" aria-label="Media navigation">
                  {(mediaArray || []).map((_, index) => (
                    <button
                      key={index}
                      className={`media-indicator ${index === currentMediaIndex ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentMediaIndex(index);
                        setImageLoaded(false);
                      }}
                      role="tab"
                      aria-selected={index === currentMediaIndex}
                      aria-label={`Media ${index + 1} of ${mediaArray.length}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Post Actions */}
      <div className="post-actions" role="group" aria-label="Post actions">
        <div className="actions-left">
          <motion.button
            className={`btn-action like-btn heart-btn reaction-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={processing}
            whileTap={{ scale: 0.9 }}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            aria-pressed={liked}
            data-testid="like-button"
            id={`like-btn-${post.id}`}
          >
            <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span>
          </motion.button>
          <motion.button
            className="btn-action comment-btn"
            onClick={() => setShowComments(true)}
            whileTap={{ scale: 0.9 }}
            aria-label="View comments"
            data-testid="comment-button"
            id={`comment-btn-${post.id}`}
          >
            <span aria-hidden="true">💬</span>
          </motion.button>
          <motion.button
            className="btn-action share-btn repost-btn"
            onClick={handleShare}
            whileTap={{ scale: 0.9 }}
            aria-label="Share post"
            data-testid="share-button"
            id={`share-btn-${post.id}`}
          >
            <span aria-hidden="true">📤</span>
          </motion.button>
        </div>
        <div className="actions-right">
          <motion.button
            className={`btn-action ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            disabled={processing}
            whileTap={{ scale: 0.9 }}
            aria-label={saved ? 'Unsave post' : 'Save post'}
            aria-pressed={saved}
          >
            <span aria-hidden="true">{saved ? '🔖' : '🏷️'}</span>
          </motion.button>
        </div>
      </div>

      {/* Post Info */}
      <div className="post-info">
        {/* Music player if music attached */}
        {post.music_url && (
          <div className="post-music-wrapper">
            <MusicPlayer
              musicTitle={post.music_title}
              musicArtist={post.music_artist}
              musicUrl={post.music_url}
              musicLicense={post.music_license}
              compact={true}
            />
          </div>
        )}
        {likesCount > 0 && (
          <button 
            className="post-likes"
            onClick={() => navigate(`/post/${post.id}/likes`)}
            aria-label={`${formatNumber(likesCount)} ${likesCount === 1 ? 'like' : 'likes'}`}
          >
            <strong>{formatNumber(likesCount)}</strong> {likesCount === 1 ? 'like' : 'likes'}
          </button>
        )}

        {post.caption && mode !== 'grid' && (
          <div className="post-caption">
            <span className="caption-author">
              <strong>{post.profiles?.username}</strong>
            </span>{' '}
            <span className="caption-text">
              {showFullCaption || post.caption.length <= 150 ? (
                formatCaption(post.caption)
              ) : (
                <>
                  {formatCaption(post.caption.slice(0, 150))}...
                  <button
                    className="btn-more"
                    onClick={() => setShowFullCaption(true)}
                    aria-label="Show more"
                  >
                    more
                  </button>
                </>
              )}
            </span>
          </div>
        )}

        {(realtimeCommentsCount || post.comments_count) > 0 && mode !== 'grid' && (
          <button
            className="post-comments-link comments add-comment"
            onClick={() => setShowComments(true)}
            aria-label={`View all ${formatNumber(realtimeCommentsCount || post.comments_count)} comments`}
          >
            View all {formatNumber(realtimeCommentsCount || post.comments_count)} {(realtimeCommentsCount || post.comments_count) === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {mode !== 'grid' && (
          <time 
            className="post-timestamp" 
            dateTime={post.created_at}
            title={new Date(post.created_at).toLocaleString()}
          >
            {formatTimestamp(post.created_at)}
          </time>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showComments && (
          <CommentsModal
            post={post}
            user={user}
            onClose={() => setShowComments(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShare && (
          <ShareModal
            post={post}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </motion.article>
  );
});

/**
 * PropTypes validation for PostCard
 */
PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    caption: PropTypes.string,
    media_url: PropTypes.string,
    media_urls: PropTypes.array,
    media_types: PropTypes.array,
    is_carousel: PropTypes.bool,
    is_liked: PropTypes.bool,
    is_saved: PropTypes.bool,
    likes_count: PropTypes.number,
    comments_count: PropTypes.number,
    user_id: PropTypes.string,
    location: PropTypes.string,
    created_at: PropTypes.string,
    profiles: PropTypes.shape({
      username: PropTypes.string,
      avatar_url: PropTypes.string,
      verified: PropTypes.bool
    })
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired
  }).isRequired,
  mode: PropTypes.oneOf(['feed', 'grid', 'detail']),
  onDelete: PropTypes.func,
  onUpdate: PropTypes.func
};

PostCard.defaultProps = {
  mode: 'feed',
  onDelete: null,
  onUpdate: null
};

PostCard.displayName = 'PostCard';

export default PostCard;
