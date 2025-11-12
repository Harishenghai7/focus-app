import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { formatRelativeTime } from "../utils/dateFormatter";
import DoubleTapLike from "./DoubleTapLike";
import CarouselViewer from "./CarouselViewer";
import LinkifiedText from "./LinkifiedText";
import LazyImage from "./LazyImage";
import HapticFeedback from "../utils/haptics";
import NotificationManager from "../utils/NotificationManager";
import useOptimisticAction from "../hooks/useOptimisticAction";
import { useStateSync } from "../hooks/useStateSync";
import "./PostCard.css";

const getAvatar = (avatarUrl) => avatarUrl && avatarUrl.trim() ? avatarUrl : "/default-avatar.png";

const showToast = (message, type = 'info') => {
  const event = new CustomEvent('showToast', { detail: { message, type } });
  window.dispatchEvent(event);
};

function PostCardContent({ post, user, userProfile, onUpdate, onDelete }) {
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const menuRef = useRef(null);
  const menuId = `menu-${post.id}`;
  const { syncFollowState, syncSaveState } = useStateSync();

  const postUser = post.profiles || post.users || post.user || {};
  const postId = post.id;
  const contentType = post.content_type || 'post';

  // ✅ FIX: Initialize with actual counts from database
  const { state: likeState, executeOptimistic: executeLikeAction } = useOptimisticAction(
    { 
      liked: false, 
      count: post.likes_count || 0 
    },
    async (actionData) => {
      if (!actionData) return { liked: false, count: 0 };

      const { postId, liked, userId } = actionData;

      if (liked) {
        await supabase.from('likes').insert([{ 
          content_id: postId, 
          content_type: contentType, 
          user_id: userId 
        }]);

        if (postUser.id !== userId) {
          await NotificationManager.createNotification('like', {
            recipient_id: postUser.id,
            actor_id: userId,
            content_id: postId,
            content_type: contentType
          });
        }
      } else {
        await supabase.from('likes')
          .delete()
          .eq('content_id', postId)
          .eq('content_type', contentType)
          .eq('user_id', userId);
      }

      // ✅ FIX: Get real count from database
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', postId)
        .eq('content_type', contentType);

      return { liked, count: count || 0 };
    }
  );

  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const navigate = useNavigate();

  // ✅ FIX: Check if post has media, return null if not
  const hasMedia = post.image_url || 
                   post.video_url || 
                   (post.is_carousel && post.media_urls?.length > 0) ||
                   (post.media_urls && post.media_urls.length > 0);

  if (!hasMedia && !post.caption) {
    console.warn('Post has no media or caption:', { postId, post });
    return null; // Don't render empty posts
  }

  useEffect(() => {
    checkUserInteractions();
  }, [postId, user?.id]);

  // ✅ FIX: Listen for global like sync events
  useEffect(() => {
    const handleLikeSync = (e) => {
      if (e.detail.postId === postId) {
        executeLikeAction(
          { liked: e.detail.liked, count: likeState.count + (e.detail.liked ? 1 : -1) },
          { postId, liked: e.detail.liked, userId: user.id },
          false
        );
      }
    };

    window.addEventListener('postLikeSync', handleLikeSync);
    return () => window.removeEventListener('postLikeSync', handleLikeSync);
  }, [postId, likeState.count]);

  const checkUserInteractions = useCallback(async () => {
    if (!user?.id || !postId) return;

    try {
      const { data: likeData } = await supabase
        .from('likes')
        .select('user_id')
        .eq('content_id', postId)
        .eq('content_type', contentType);

      const userLiked = likeData?.some(like => like.user_id === user.id) || false;
      const realCount = likeData?.length || 0;

      // Update state without executing action
      if (executeLikeAction) {
        executeLikeAction({ liked: userLiked, count: realCount }, {
          postId,
          liked: userLiked,
          userId: user.id
        }, false);
      }

      // ✅ FIX: Check saved status from prop or query
      if (post.is_saved !== undefined) {
        setSaved(post.is_saved);
      } else {
        const { data: saveData } = await supabase
          .from('saves')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        setSaved(!!saveData);
      }

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
  }, [user?.id, postId, contentType, postUser.id, post.is_saved]);

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

  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

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

        await NotificationManager.createNotification('follow', {
          recipient_id: postUser.id,
          actor_id: user.id
        });
      }

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

      // Sync across all components
      window.dispatchEvent(new CustomEvent('postLikeSync', {
        detail: { postId, liked: newLiked }
      }));
    } catch (error) {
      console.error("Like failed:", error);
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
      showToast("Failed to add comment", 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePostClick = (e) => {
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
          showToast('Link copied to clipboard!', 'success');
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
          return;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Failed to share', 'error');
    }
    setShowShareModal(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      // ✅ FIX: Handle all content types properly
      let tableName = 'posts';
      if (contentType === 'boltz') tableName = 'boltz';
      if (contentType === 'flash') tableName = 'flashes';

      await supabase
        .from(tableName)
        .delete()
        .eq("id", postId);
      
      onDelete?.(postId, contentType);
      showToast('Post deleted successfully', 'success');
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast('Failed to delete post', 'error');
    }
    setShowMenu(false);
  };

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
            alt={postUser.full_name || postUser.username || 'User'}
            className="post-avatar"
            threshold={0.01}
            rootMargin="200px"
          />
          <div className="post-user-details">
            <div className="post-username-container">
              <span className="post-username">{postUser.username || postUser.full_name || 'User'}</span>
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
            {post.location && <span className="post-location">{post.location}</span>}
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
                      setShowShareModal(true);
                    }}>
                      <span>📤</span> Share
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      navigator.clipboard.writeText(`${window.location.origin}/${contentType}/${postId}`);
                      showToast('Link copied!', 'success');
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
                      showToast('Link copied!', 'success');
                    }}>
                      <span>🔗</span> Copy Link
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      showToast('Feedback recorded', 'success');
                    }}>
                      <span>🚫</span> Not Interested
                    </button>
                    <button onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('Report this post for inappropriate content?')) {
                        showToast('Post reported. Thank you!', 'success');
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

      {/* ✅ FIX: Proper carousel detection and display */}
      {hasMedia && (
        <div className="post-media-container" onClick={handlePostClick}>
          <DoubleTapLike onDoubleTap={handleLike} liked={likeState.liked}>
            {(post.is_carousel || (post.media_urls && post.media_urls.length > 1)) ? (
              <CarouselViewer 
                mediaUrls={post.media_urls}
                mediaTypes={post.media_types || post.media_urls.map(() => 'image')}
                thumbnailUrls={post.thumbnail_urls}
                showControls={true}
              />
            ) : (contentType === 'boltz' || post.video_url) ? (
              <video 
                src={post.video_url}
                className="post-video"
                controls
                preload="metadata"
                poster={post.thumbnail_url}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <LazyImage 
                src={post.image_url || post.media_url || (post.media_urls && post.media_urls[0])} 
                alt="Post content"
                className="post-image"
                threshold={0.1}
                rootMargin="100px"
              />
            )}
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
          <span className="post-username">{postUser.username || postUser.full_name || 'User'}</span>
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
  if (!post) return null;
  return <PostCardContent post={post} user={user} userProfile={userProfile} onUpdate={onUpdate} onDelete={onDelete} />;
}