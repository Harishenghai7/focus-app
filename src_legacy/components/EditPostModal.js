import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './EditPostModal.css';

export default function EditPostModal({ post, user, onClose, onUpdated }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          caption: caption.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage('Post updated successfully! ✅');
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error updating post:', error);
      setMessage('Failed to update post ❌');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_archived: !post.is_archived })
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      alert(post.is_archived ? 'Post unarchived!' : 'Post archived!');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error archiving post:', error);
      alert('Failed to archive post');
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('Post deleted successfully!');
      onClose();
      window.location.href = '/profile';
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="edit-post-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Edit Post</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="post-preview">
            {post.image_url && (
              <img src={post.image_url} alt="Post" />
            )}
          </div>

          <div className="edit-section">
            <label>Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              maxLength={2200}
            />
            <div className="char-count">{caption.length}/2200</div>
          </div>

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn-archive"
            onClick={handleArchive}
            disabled={loading}
          >
            {post.is_archived ? 'Unarchive Post' : 'Archive Post'}
          </button>
          <button 
            className="btn-delete"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete Post
          </button>
          <div className="action-buttons">
            <button 
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className="btn-save"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

