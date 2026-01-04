import React, { useState, useEffect } from 'react';
import StickerPicker from '../components/StickerPicker/StickerPicker';
import { getStickerUrl, FOCUSLY_STICKERS } from '../data/focuslyStickerData';
import './PostStickers.css';

/**
 * Post Comments Component with Sticker Reactions
 * Allows users to react to posts with Focusly stickers
 */

const PostWithStickers = ({ post, currentUser, comments = [], setComments, onCommentAdded }) => {
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [stickerReactionCounts, setStickerReactionCounts] = useState({});

  // Calculate sticker reaction counts
  useEffect(() => {
    const counts = {};
    comments.forEach(comment => {
      if (comment.comment_type === 'sticker') {
        counts[comment.sticker_id] = (counts[comment.sticker_id] || 0) + 1;
      }
    });
    setStickerReactionCounts(counts);
  }, [comments]);

  /**
   * Handle text comment submission
   */
  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    try {
      setLoading(true);

      const comment = {
        id: Date.now(),
        post_id: post?.id,
        user_id: currentUser?.id,
        username: currentUser?.username,
        avatar: currentUser?.avatar,
        comment_type: 'text',
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        likes: 0
      };

      // TODO: Save to Supabase
      // await supabase.from('comments').insert([comment]);

      setComments(prev => [...prev, comment]);
      setCommentText('');

      if (onCommentAdded) {
        onCommentAdded(comment);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sticker reaction/comment
   */
  const handleStickerReaction = async (sticker) => {
    try {
      setLoading(true);

      const comment = {
        id: Date.now(),
        post_id: post?.id,
        user_id: currentUser?.id,
        username: currentUser?.username,
        avatar: currentUser?.avatar,
        comment_type: 'sticker',
        sticker_id: sticker.id,
        sticker_name: sticker.name,
        sticker_url: getStickerUrl(sticker.fileName),
        created_at: new Date().toISOString()
      };

      // TODO: Save to Supabase
      // await supabase.from('comments').insert([comment]);

      setComments(prev => [...prev, comment]);
      setShowStickerPicker(false);

      if (onCommentAdded) {
        onCommentAdded(comment);
      }
    } catch (error) {
      console.error('Error posting sticker reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle keyboard shortcut (Enter to post)
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  // Group sticker comments by sticker ID
  const getStickerComments = (stickerId) => {
    return comments.filter(c => c.comment_type === 'sticker' && c.sticker_id === stickerId);
  };

  return (
    <div className="post-with-stickers">
      {/* Post Content */}
      <div className="post-content">
        <div className="post-header">
          <img
            src={post?.author_avatar || '/default-avatar.png'}
            alt={post?.author_name}
            className="post-avatar"
          />
          <div className="post-info">
            <h3 className="post-author">{post?.author_name}</h3>
            <p className="post-time">
              {new Date(post?.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <p className="post-text">{post?.content}</p>

        {post?.image && (
          <img src={post.image} alt="Post" className="post-image" loading="lazy" />
        )}
      </div>

      {/* Sticker Reactions Bar */}
      {Object.keys(stickerReactionCounts).length > 0 && (
        <div className="sticker-reactions-bar">
          <div className="reactions-container">
            {Object.entries(stickerReactionCounts).map(([stickerId, count]) => {
              const sticker = FOCUSLY_STICKERS.find(s => s.id === parseInt(stickerId));
              if (!sticker) return null;

              return (
                <div
                  key={stickerId}
                  className="sticker-reaction"
                  title={`${count} ${sticker.name} reaction${count > 1 ? 's' : ''}`}
                >
                  <img
                    src={getStickerUrl(sticker.fileName)}
                    alt={sticker.name}
                    className="reaction-sticker-icon"
                  />
                  <span className="reaction-count">{count > 99 ? '99+' : count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comment Input Section */}
      <div className="comment-section">
        <div className="comment-actions">
          <button
            className="comment-action-button sticker-reaction-button"
            onClick={() => setShowStickerPicker(true)}
            title="React with Focusly"
            disabled={loading}
          >
            <span className="focusly-icon">🦁</span>
            <span className="button-text">Focusly</span>
          </button>
        </div>

        <div className="comment-input-wrapper">
          <img
            src={currentUser?.avatar || '/default-avatar.png'}
            alt={currentUser?.username}
            className="comment-avatar"
          />
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment..."
            className="comment-input"
            disabled={loading}
            rows="1"
          />
          <button
            className="post-comment-button"
            onClick={handlePostComment}
            disabled={loading || !commentText.trim()}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <img
              src={comment.avatar || '/default-avatar.png'}
              alt={comment.username}
              className="comment-avatar-small"
            />

            <div className="comment-content">
              <div className="comment-header">
                <strong className="comment-author">{comment.username}</strong>
                <span className="comment-time">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>

              {comment.comment_type === 'text' && (
                <p className="comment-text">{comment.content}</p>
              )}

              {comment.comment_type === 'sticker' && (
                <div className="comment-sticker">
                  <img
                    src={comment.sticker_url}
                    alt={comment.sticker_name}
                    className="comment-sticker-image"
                    title={comment.sticker_name}
                  />
                </div>
              )}

              {comment.likes > 0 && (
                <div className="comment-likes">
                  👍 {comment.likes} like{comment.likes > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticker Picker Modal */}
      <StickerPicker
        show={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelect={handleStickerReaction}
      />
    </div>
  );
};

export default PostWithStickers;
