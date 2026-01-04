"use client";
// src/pages/PostDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { components } from '@/importMap';
import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
import { formatDate } from '../utils/formatters/formatDate';
import './PostDetail.css';

// Import specific components
const { CarouselViewer, ShareModal, UserOptionsMenu, ReportModal, EditPostModal } = components;

export default function PostDetail({ user }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState([]);
  
  // Real-time interactions hook
  const { 
    likesCount, 
    commentsCount, 
    isLiked, 
    loading: interactionsLoading 
  } = useRealtimeInteractions(postId, 'post', user);
  
  // Comment replies
  const [showReplies, setShowReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  useEffect(() => {
    if (postId && user) {
      fetchPostDetails();
      fetchComments();
    }
  }, [postId, user]);

  const fetchPostDetails = async () => {
    try {
      const { data, error } = await supabase.rpc('get_post_details', {
        post_uuid: postId,
        user_uuid: user.id
      });

      if (error) throw error;
      const postData = data?.[0] || null;
      setPost(postData);
      
      // Fetch related posts after getting the main post
      if (postData) {
        fetchRelatedPostsForUser(postData.user_id);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id(username, full_name, avatar_url, is_verified)
        `)
        .eq('content_id', postId)
        .eq('content_type', 'post')
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchRelatedPostsForUser = async (userId) => {
    try {
      // Fetch related posts from the same user
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          image_url,
          video_url,
          media_type,
          is_carousel,
          media_urls,
          caption,
          likes_count,
          comments_count,
          created_at,
          user:user_id(username, avatar_url, is_verified)
        `)
        .eq('user_id', userId)
        .neq('id', postId)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRelatedPosts(data || []);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      const { data, error } = await supabase.rpc('get_comment_replies', {
        comment_uuid: commentId,
        user_uuid: user.id
      });

      if (error) throw error;
      
      setShowReplies(prev => ({
        ...prev,
        [commentId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (post.is_liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('content_id', postId)
          .eq('content_type', 'post')
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            content_type: 'post',
            content_id: postId
          });
      }
      fetchPostDetails();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content_type: 'post',
          content_id: postId,
          text: newComment.trim()
        });

      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          content_type: 'post',
          content_id: postId,
          parent_comment_id: commentId,
          text: replyText.trim()
        });

      if (error) throw error;

      setReplyText('');
      setReplyingTo(null);
      fetchReplies(commentId);
      fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  if (loading) {
    return <div className="post-loading"><div className="spinner"></div></div>;
  }

  if (!post) {
    return (
      <div className="post-not-found">
        <h2>Post not found</h2>
        <button onClick={() => navigate('/home')}>Go to Home</button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="post-detail-container">
        {/* 🔥 POST MEDIA WITH CAROUSEL SUPPORT */}
        <div className="post-media">
          {post.is_carousel && post.media_urls && post.media_urls.length > 0 ? (
            <CarouselViewer 
              mediaUrls={post.media_urls}
              mediaTypes={post.media_types}
              showControls={true}
            />
          ) : post.media_type === 'video' || post.video_url ? (
            <video src={post.video_url} controls autoPlay loop />
          ) : post.image_url ? (
            <img src={post.image_url} alt="Post" />
          ) : (
            <div className="text-only-post">
              <p>{post.caption}</p>
            </div>
          )}
        </div>

        {/* POST SIDEBAR */}
        <div className="post-sidebar">
          {/* User Info */}
          <div className="post-header">
            <img 
              src={post.avatar_url || `https://ui-avatars.com/api/?name=${post.username}`}
              alt={post.username}
              onClick={() => navigate(`/profile/${post.username}`)}
            />
            <div className="post-user-info">
              <h3 onClick={() => navigate(`/profile/${post.username}`)}>
                {post.username}
                {post.is_verified && (
                  <svg className="verified" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </h3>
              {post.location && <p>{post.location}</p>}
            </div>
            <button 
              className="options-btn"
              onClick={() => setShowOptionsMenu(true)}
            >
              ⋮
            </button>
          </div>
            {post.user_id === user.id && (
              <button 
                className="edit-btn"
                onClick={() => setShowEditModal(true)}
              >
               ✏️ Edit
              </button>
            )} 

          {/* Caption */}
          {post.caption && (
            <div className="post-caption">
              <strong>{post.username}</strong> {post.caption}
            </div>
          )}

          {/* Comments Section */}
          <div className="comments-section">
            {comments.map(comment => (
              <div key={comment.id} className="comment-thread">
                <div className="comment-item">
                  <img 
                    src={comment.user.avatar_url || `https://ui-avatars.com/api/?name=${comment.user.username}`}
                    alt={comment.user.username}
                    onClick={() => navigate(`/profile/${comment.user.username}`)}
                  />
                  <div className="comment-content">
                    <p>
                      <strong onClick={() => navigate(`/profile/${comment.user.username}`)}>
                        {comment.user.username}
                      </strong> {comment.text}
                    </p>
                    <div className="comment-meta">
                      <span>{formatDate(comment.created_at, 'relative')}</span>
                      <button onClick={() => setReplyingTo(comment.id)}>Reply</button>
                      {comment.replies_count > 0 && (
                        <button onClick={() => {
                          if (showReplies[comment.id]) {
                            setShowReplies(prev => ({ ...prev, [comment.id]: null }));
                          } else {
                            fetchReplies(comment.id);
                          }
                        }}>
                          {showReplies[comment.id] ? 'Hide' : 'View'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                        </button>
                      )}
                    </div>

                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="reply-input">
                        <input
                          type="text"
                          placeholder={`Reply to ${comment.user.username}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => handleReply(comment.id)}>Post</button>
                        <button onClick={() => setReplyingTo(null)}>Cancel</button>
                      </div>
                    )}

                    {/* Replies */}
                    {showReplies[comment.id] && (
                      <div className="replies-list">
                        {showReplies[comment.id].map(reply => (
                          <div key={reply.id} className="reply-item">
                            <img 
                              src={reply.avatar_url || `https://ui-avatars.com/api/?name=${reply.username}`}
                              alt={reply.username}
                            />
                            <div className="reply-content">
                              <p>
                                <strong>{reply.username}</strong> {reply.text}
                              </p>
                              <span className="reply-time">{formatDate(reply.created_at, 'relative')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Post Actions */}
          <div className="post-actions">
            <div className="action-buttons">
              <button onClick={handleLike} className={isLiked ? 'liked' : ''}>
                <svg viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button onClick={() => setShowShareModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <p className="likes-count">{likesCount.toLocaleString()} likes</p>
            <p className="comments-count">{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</p>
            <p className="post-time">{formatDate(post.created_at, 'relative')}</p>
          </div>

          {/* Add Comment */}
          <form className="add-comment" onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button type="submit" disabled={!newComment.trim()}>
              Post
            </button>
          </form>
        </div>

        {/* 🔥 RELATED POSTS SIDEBAR */}
        {relatedPosts.length > 0 && (
          <div className="related-posts-sidebar">
            <h3>More from {post.username}</h3>
            <div className="related-posts-grid">
              {relatedPosts.map((relatedPost) => (
                <div 
                  key={relatedPost.id} 
                  className="related-post-card"
                  onClick={() => navigate(`/post/${relatedPost.id}`)}
                >
                  <div className="related-post-thumbnail">
                    {relatedPost.is_carousel && relatedPost.media_urls?.[0] ? (
                      <img src={relatedPost.media_urls[0]} alt="Related post" />
                    ) : relatedPost.video_url ? (
                      <video src={relatedPost.video_url} />
                    ) : relatedPost.image_url ? (
                      <img src={relatedPost.image_url} alt="Related post" />
                    ) : (
                      <div className="text-post-preview">
                        <p>{relatedPost.caption?.substring(0, 50)}...</p>
                      </div>
                    )}
                    <div className="related-post-overlay">
                      <div className="related-post-stats">
                        <span>
                          <svg viewBox="0 0 24 24" fill="white">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {relatedPost.likes_count}
                        </span>
                        <span>
                          <svg viewBox="0 0 24 24" fill="white">
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {relatedPost.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🔥 MODALS */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal 
            post={post} 
            user={user} 
            onClose={() => setShowShareModal(false)} 
          />
        )}

        {showOptionsMenu && (
          <UserOptionsMenu 
            targetUser={{ id: post.user_id, username: post.username }}
            currentUser={user}
            onClose={() => setShowOptionsMenu(false)}
            onAction={(action) => {
              if (action === 'report') {
                setShowOptionsMenu(false);
                setShowReportModal(true);
              }
            }}
          />
        )}

        {showReportModal && (
          <ReportModal
            reportType="post"
            reportedId={post.id}
            reportedUser={{ username: post.username }}
            currentUser={user}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {showEditModal && (
          <EditPostModal
            post={post}
            user={user}
            onClose={() => setShowEditModal(false)}
            onUpdated={fetchPostDetails}
          />
        )}
      </AnimatePresence>
    </div>
  );
}