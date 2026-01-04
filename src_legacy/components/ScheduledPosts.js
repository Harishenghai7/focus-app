import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getScheduledPosts, 
  cancelScheduledPost, 
  publishPostNow,
  formatScheduledTime 
} from '../utils/scheduledPostsPublisher';
import './ScheduledPosts.css';

export default function ScheduledPosts({ userId, onUpdate }) {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadScheduledPosts();
  }, [userId]);

  const loadScheduledPosts = async () => {
    setLoading(true);
    try {
      const posts = await getScheduledPosts(userId);
      setScheduledPosts(posts);
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishNow = async (postId) => {
    if (!window.confirm('Publish this post now?')) return;
    
    setActionLoading(postId);
    try {
      const success = await publishPostNow(postId, userId);
      if (success) {
        await loadScheduledPosts();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Failed to publish post:', error);
      alert('Failed to publish post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (postId) => {
    if (!window.confirm('Cancel this scheduled post?')) return;
    
    setActionLoading(postId);
    try {
      const success = await cancelScheduledPost(postId, userId);
      if (success) {
        await loadScheduledPosts();
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Failed to cancel post:', error);
      alert('Failed to cancel post');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="scheduled-posts-loading">
        <div className="loading-spinner"></div>
        <p>Loading scheduled posts...</p>
      </div>
    );
  }

  if (scheduledPosts.length === 0) {
    return (
      <div className="scheduled-posts-empty">
        <span className="empty-icon">📅</span>
        <h3>No Scheduled Posts</h3>
        <p>Posts you schedule will appear here</p>
      </div>
    );
  }

  return (
    <div className="scheduled-posts-container">
      <div className="scheduled-posts-header">
        <h3>📅 Scheduled Posts ({scheduledPosts.length})</h3>
        <button className="refresh-btn" onClick={loadScheduledPosts}>
          🔄 Refresh
        </button>
      </div>

      <div className="scheduled-posts-list">
        <AnimatePresence>
          {scheduledPosts.map((post) => (
            <motion.div
              key={post.id}
              className="scheduled-post-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <div className="scheduled-post-content">
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="scheduled-post-media">
                    <img 
                      src={post.media_urls[0]} 
                      alt="Post preview" 
                      className="media-thumbnail"
                    />
                    {post.media_urls.length > 1 && (
                      <div className="media-count-badge">
                        +{post.media_urls.length - 1}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="scheduled-post-info">
                  <p className="scheduled-post-caption">
                    {post.caption?.substring(0, 100) || 'No caption'}
                    {post.caption?.length > 100 && '...'}
                  </p>
                  
                  <div className="scheduled-post-meta">
                    <span className="scheduled-time">
                      🕐 {formatScheduledTime(post.scheduled_for)}
                    </span>
                    <span className="scheduled-date">
                      {new Date(post.scheduled_for).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="scheduled-post-actions">
                <button
                  className="action-btn publish-btn"
                  onClick={() => handlePublishNow(post.id)}
                  disabled={actionLoading === post.id}
                >
                  {actionLoading === post.id ? '...' : '🚀 Publish Now'}
                </button>
                <button
                  className="action-btn cancel-btn"
                  onClick={() => handleCancel(post.id)}
                  disabled={actionLoading === post.id}
                >
                  {actionLoading === post.id ? '...' : '✕ Cancel'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
