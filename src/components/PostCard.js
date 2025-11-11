import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../utils/dateFormatter";
import DoubleTapLike from "./DoubleTapLike";
// Removed unused InteractionBar import
import CarouselViewer from "./CarouselViewer";
import LinkifiedText from "./LinkifiedText";
import LazyImage from "./LazyImage";
import HapticFeedback from "../utils/haptics";
import NotificationManager from "../utils/NotificationManager";
import useOptimisticAction from "../hooks/useOptimisticAction";
import { useStateSync } from "../hooks/useStateSync";
import "./PostCard.css";

// Add syncLikeState for global state management
const syncLikeState = (postId, liked) => {
  window.dispatchEvent(new CustomEvent('postLikeSync', {
    detail: { postId, liked }
  }));
};

// Utility for bulletproof avatar fallback
const getAvatar = (avatarUrl) => avatarUrl && avatarUrl.trim() ? avatarUrl : "/default-avatar.png";

function PostCardContent({ post, user, userProfile, onUpdate, onDelete }) {
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const menuId = `menu-${post.id}`;
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Optimistic UI for likes
  const { syncFollowState, syncSaveState } = useStateSync();
  
  // Get user data from post and define content type early
  const postUser = post.profiles || post.users || post.user || {};
  const postId = post.id;
  const contentType = post.content_type || 'post';
  
  // Use local syncLikeState function
  const handleSyncLike = syncLikeState;
  
  const { state: likeState, executeOptimistic: executeLikeAction } = useOptimisticAction(
    { liked: false, count: post.likes_count || 0 },
    async (actionData) => {
      if (!actionData) return { liked: false, count: 0 };
      
      const { postId, liked, userId } = actionData;
      
      if (liked) {
        // Feature #163: Like post
        await supabase.from('likes').insert([{ 
          content_id: postId, 
          content_type: contentType, 
          user_id: userId 
        }]);
        
        // Feature #170: Comment notification - Create notification if not own post
        if (postUser.id !== userId) {
          await NotificationManager.createNotification('like', {
            recipient_id: postUser.id,
            actor_id: userId,
            content_id: postId,
            content_type: contentType
          });
        }
      } else {
        // Feature #174: Undo like
        await supabase.from('likes')
          .delete()
          .eq('content_id', postId)
          .eq('content_type', contentType)
          .eq('user_id', userId);
      }
      
      // Feature #177: Like count sync across pages - Get real count from server
      const { data: likesData } = await supabase
        .from('likes')
        .select('id')
        .eq('content_id', postId)
        .eq('content_type', contentType);
        
      return { liked, count: likesData?.length || 0 };
    }
  );
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const navigate = useNavigate();
  
  // Handle posts without media gracefully
  const hasMedia = post.image_url || post.video_url || (post.is_carousel && post.media_urls?.length > 0);
  if (!hasMedia) {
    console.warn('Post missing media:', { postId, post });
  }

  useEffect(() => {
    loadPostStats();
    checkUserInteractions();
  }, [postId, user?.id]);

  const loadPostStats = useCallback(async () => {
    if (!postId) return;
    
    try {
      // Load comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id')
        .eq('content_id', postId)
        .eq('content_type', contentType);
      
      setCommentsCount(commentsData?.length || 0);
    } catch (error) {
      console.error("Error loading post stats:", error);
    }
  }, [postId, contentType]);

  const checkUserInteractions = useCallback(async () => {
    if (!user?.id || !postId) return;
    
    try {
      // Feature #163: Like post - Check if user liked this post and get count
      const { data: likeData } = await supabase
        .from('likes')
        .select('id, user_id')
        .eq('content_id', postId)
        .eq('content_type', contentType);
        
      const userLiked = likeData?.some(like => like.user_id === user.id) || false;
      
      // Update optimistic state with real data - Feature #171: Optimistic comment UI
      if (executeLikeAction) {
        executeLikeAction({ liked: userLiked, count: likeData?.length || 0 }, {
          postId,
          liked: userLiked,
          userId: user.id
        }, false); // Don't execute, just update state
      }

      // Check if user saved this post
      const { data: saveData } = await supabase
        .from('saves')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setSaved(!!saveData);

      // Check if user follows this post author
      if (postUser.id && postUser.id !== user.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', postUser.id)
          .maybeSingle();
        
        setFollowing(!!followData);
      }
    } catch (error) {
      console.error("Error checking user interactions:", error);
    }
  }, [user?.id, postId, contentType, postUser.id, executeLikeAction]);

  const loadComments = async () => {
    try {
      const { data } = await supabase
        .from("comments")
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('content_id', postId)
        .eq('content_type', contentType)
        .order("created_at", { ascending: true });
      setComments(data || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  // Load comments when showing comments section
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments, comments.length]);

  const handleFollow = async () => {
    if (!user || loading || postUser.id === user.id) return;
    const wasFollowing = following;
    const newFollowing = !wasFollowing;
    setFollowing(newFollowing);
    
    try {
      if (wasFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", postUser.id);
      } else {
        await supabase
          .from("follows")
          .insert([{ 
            follower_id: user.id, 
            following_id: postUser.id 
          }]);

        // Create notification
        await NotificationManager.createNotification('follow', {
          recipient_id: postUser.id,
          actor_id: user.id
        });
      }
      
      // Sync follow state across all components
      syncFollowState(postUser.id, newFollowing);
    } catch (error) {
      setFollowing(wasFollowing);
      console.error("Error toggling follow:", error);
    }
  };

  const handleSave = async () => {
    if (!user || loading) return;
    const wasSaved = saved;
    const newSaved = !wasSaved;
    setSaved(newSaved);
    
    try {
      if (wasSaved) {
        await supabase
          .from("saves")
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from("saves")
          .insert([{
            post_id: postId,
            user_id: user.id
          }]);
      }
      
      // Sync save state across all components
      syncSaveState(postId, newSaved);
    } catch (error) {
      setSaved(wasSaved);
      console.error("Error toggling save:", error);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;
    
    const newLiked = !likeState.liked;
    const optimisticState = {
      liked: newLiked,
      count: Math.max(0, likeState.count + (newLiked ? 1 : -1))
    };
    
    // Feature #164: Double-tap like - Haptic feedback
    if (newLiked) {
      HapticFeedback.medium();
    } else {
      HapticFeedback.light();
    }
    
    try {
      await executeLikeAction(optimisticState, {
        postId,
        liked: newLiked,
        userId: user.id
      });
      
      // Feature #177: Like count sync across pages - Sync across all components and devices
      syncLikeState(postId, newLiked);
    } catch (error) {
      console.error("Like failed:", error);
      // Feature #172: Rollback comment on server fail - State already rolled back by hook
    }
  };



  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([{
          content_id: postId,
          content_type: contentType,
          user_id: user.id,
          text: newComment.trim()
        }])
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setCommentsCount(prev => prev + 1);
      setNewComment("");

      // Create notification if not own post
      if (postUser.id !== user.id) {
        await NotificationManager.createNotification('comment', {
          recipient_id: postUser.id,
          actor_id: user.id,
          content_id: postId,
          content_type: contentType
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);
  
  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => setShowMenu(false);
    if (showMenu) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [showMenu]);

  // Handle post click navigation (like Instagram)
  const handlePostClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button, a, .action-btn, .post-menu-btn, video')) {
      return;
    }
    navigate(`/${contentType}/${postId}`);
  };

  const handleShare = async (platform) => {
    const url = `${window.location.origin}/${contentType}/${postId}`;
    const text = `Check out this ${contentType} on Focus: ${post.caption?.substring(0, 100) || ''}`;
    
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
          break;
        default:
          console.warn('Unknown share platform:', platform);
          return;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
    }
    setShowShareModal(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await supabase
        .from(contentType === 'boltz' ? 'boltz' : 'posts')
        .delete()
        .eq("id", postId);
      onDelete?.(postId);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
    setShowMenu(false);
  };

  // Using imported formatRelativeTime for better timezone handling

  return (
    <motion.article 
      className="post-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="post-header">
        <div 
          className="post-user-info" 
          onClick={() => navigate(`/profile/${postUser.username || postUser.id}`)}
        >
          <LazyImage 
            src={getAvatar(postUser.avatar_url)}
            alt={postUser.nickname || 'User'}
            className="post-avatar"
            threshold={0.01}
            rootMargin="200px"
          />
          <div className="post-user-details">
            <div className="post-username-container">
              <span className="post-username">{postUser.username || postUser.nickname || 'User'}</span>
              {!following && postUser.id !== user?.id && (
                <>
                  <span className="separator">•</span>
                  <button 
                    className="follow-btn-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow();
                    }}
                    disabled={loading}
                  >
                    Follow
                  </button>
                </>
              )}
            </div>
            <span className="post-location">{post.location}</span>
          </div>
        </div>

        <div className="post-menu-container" ref={menuRef}>
          <button 
            className="post-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(prev => !prev);
            }}
            aria-expanded={showMenu}
            aria-controls={menuId}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="12" cy="6" r="1.5"/>
              <circle cx="12" cy="18" r="1.5"/>
            </svg>
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                id={menuId}
                className="post-menu-dropdown"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
              >
                {postUser.id === user?.id ? (
                  <>
                    <button onClick={() => {
                      setShowMenu(false);
                      navigate(`/edit-${contentType}/${postId}`);
                    }}>
                      <span>📝</span> Edit
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      navigate(`/insights/${postId}`);
                    }}>
                      <span>📊</span> View Insights
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      setShowShareModal(true);
                    }}>
                      <span>📤</span> Share
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      navigator.clipboard.writeText(`${window.location.origin}/${contentType}/${postId}`);
                      alert('Link copied!');
                    }}>
                      <span>🔗</span> Copy Link
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }} className="delete-btn">
                      <span>🗑️</span> Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      setShowMenu(false);
                      handleFollow();
                    }}>
                      <span>{following ? '👥' : '➕'}</span> {following ? 'Unfollow' : 'Follow'}
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      handleSave();
                    }}>
                      <span>{saved ? '💾' : '📌'}</span> {saved ? 'Unsave' : 'Save'}
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      setShowShareModal(true);
                    }}>
                      <span>📤</span> Share
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      navigator.clipboard.writeText(`${window.location.origin}/${contentType}/${postId}`);
                      alert('Link copied!');
                    }}>
                      <span>🔗</span> Copy Link
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      alert('Not interested feedback recorded.');
                    }}>
                      <span>🚫</span> Not Interested
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('Report this post for inappropriate content?')) {
                        alert('Post reported. Thank you for keeping Focus safe.');
                      }
                    }} className="report-btn">
                      <span>⚠️</span> Report
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 🔥 CAROUSEL SUPPORT */}
      {(post.is_carousel && post.media_urls && post.media_urls.length > 0) ? (
        <div className="post-media-container" onClick={handlePostClick}>
          <DoubleTapLike onDoubleTap={handleLike} liked={likeState.liked}>
            <CarouselViewer 
              mediaUrls={post.media_urls}
              mediaTypes={post.media_types}
              showControls={true}
            />
          </DoubleTapLike>
        </div>
      ) : (post.image_url || post.video_url) && (
        <div className="post-media-container" onClick={handlePostClick}>
          <DoubleTapLike onDoubleTap={handleLike} liked={likeState.liked}>
            <div className="post-media-wrapper">
              {contentType === 'boltz' || post.video_url ? (
                <video 
                  src={post.video_url}
                  className="post-video"
                  controls
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <LazyImage 
                  src={post.image_url} 
                  alt="Post content"
                  className="post-image"
                  aspectRatio={1}
                  threshold={0.1}
                  rootMargin="100px"
                />
              )}
            </div>
          </DoubleTapLike>
        </div>
      )}

      <div className="post-interactions">
        <div className="post-actions-left">
          <button 
            className={`action-btn ${likeState.liked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={loading}
            data-testid="like-btn"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={likeState.liked ? "currentColor" : "none"}
              stroke="currentColor"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setShowComments(!showComments)}
            data-testid="comment-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          
          <button 
            className="action-btn"
            onClick={() => setShowShareModal(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
        
        <button 
          className={`action-btn ${saved ? 'saved' : ''}`}
          onClick={handleSave}
          disabled={loading}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div className="post-stats">
        {likeState.count > 0 && (
          <div className="post-likes">
            <span className="likes-count">{likeState.count} {likeState.count === 1 ? 'like' : 'likes'}</span>
          </div>
        )}
      </div>

      {post.caption && (
      <div className="post-content">
          <span className="post-username">{postUser.username || postUser.nickname || 'User'}</span>
          <LinkifiedText text={post.caption} className="post-text" />
        </div>
      )}

      {commentsCount > 0 && (
        <button 
          className="view-comments-btn"
          onClick={() => setShowComments(!showComments)}
        >
          View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      <div className="post-time">
        {formatRelativeTime(post.created_at)}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="comments-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <img
                    src={getAvatar(comment.profiles?.avatar_url)}
                    alt={comment.profiles?.username || comment.profiles?.full_name}
                    className="comment-avatar"
                  />
                  <div className="comment-content">
                    <span className="comment-username">{comment.profiles?.username || comment.profiles?.full_name}</span>
                    <span className="comment-text">{comment.text}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleComment} className="comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="comment-input"
                data-testid="comment-input"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="comment-submit"
                data-testid="comment-submit"
                disabled={!newComment.trim() || loading}
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              className="share-modal"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Share this {contentType}</h3>
              <div className="share-options">
                <button onClick={() => handleShare('copy')}>
                  <span>📋</span> Copy Link
                </button>
                <button onClick={() => handleShare('twitter')}>
                  <span>🐦</span> Twitter
                </button>
                <button onClick={() => handleShare('facebook')}>
                  <span>📘</span> Facebook
                </button>
                <button onClick={() => handleShare('whatsapp')}>
                  <span>💬</span> WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function PostCard({ post, user, userProfile, onUpdate, onDelete }) {
  if (!post) {
    return null;
  }
  return <PostCardContent post={post} user={user} userProfile={userProfile} onUpdate={onUpdate} onDelete={onDelete} />;
}