import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Saved.css';

export default function Saved({ user }) {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, [user]);

  const fetchSavedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          created_at,
          post:post_id(
            id,
            image_url,
            video_url,
            media_type,
            caption,
            likes_count,
            comments_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPosts(data || []);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (savedId, postId) => {
    try {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('id', savedId);

      setSavedPosts(prev => prev.filter(item => item.id !== savedId));
    } catch (error) {
      console.error('Error unsaving post:', error);
    }
  };

  if (loading) {
    return (
      <div className="saved-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading saved posts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="saved-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="saved-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ← Back
        </button>
        <h1>Saved Posts</h1>
        <span className="saved-count">{savedPosts.length}</span>
      </div>

      {savedPosts.length === 0 ? (
        <div className="empty-saved">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3>No saved posts yet</h3>
          <p>Save posts to view them later</p>
        </div>
      ) : (
        <div className="saved-grid">
          {savedPosts.map((item) => (
            <motion.div
              key={item.id}
              className="saved-item"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={item.post.image_url}
                alt="Saved post"
                onClick={() => navigate(`/post/${item.post.id}`)}
              />
              <div className="saved-overlay">
                <div className="saved-stats">
                  <span>❤️ {item.post.likes_count}</span>
                  <span>💬 {item.post.comments_count}</span>
                </div>
                <button
                  className="unsave-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsave(item.id, item.post.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
