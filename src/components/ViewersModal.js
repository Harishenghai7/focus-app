import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ViewersModal.css';

export default function ViewersModal({ flashId, onClose }) {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchViewers();
  }, [flashId]);

  const fetchViewers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_flash_viewers', {
        flash_uuid: flashId
      });

      if (fetchError) throw fetchError;
      setViewers(data || []);
    } catch (err) {
      console.error('Error fetching viewers:', err);
      setError('Failed to load viewers');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleViewerClick = (username) => {
    onClose();
    navigate(`/profile/${username}`);
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
        className="viewers-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Viewers</h3>
          <span className="viewers-count-badge">{viewers.length}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="viewers-loading">
              <div className="loading-spinner"></div>
              <p>Loading viewers...</p>
            </div>
          ) : error ? (
            <div className="viewers-error">
              <p>{error}</p>
              <button onClick={fetchViewers} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : viewers.length === 0 ? (
            <div className="no-viewers">
              <div className="no-viewers-icon">👁️</div>
              <p>No views yet</p>
              <small>Views will appear here when people see your story</small>
            </div>
          ) : (
            <div className="viewers-list">
              {viewers.map((viewer) => (
                <motion.div
                  key={viewer.id}
                  className="viewer-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  onClick={() => handleViewerClick(viewer.username)}
                >
                  <img
                    src={viewer.avatar_url || `https://ui-avatars.com/api/?name=${viewer.username}&background=667eea&color=fff`}
                    alt={viewer.username}
                    className="viewer-avatar"
                  />
                  <div className="viewer-info">
                    <div className="viewer-name-row">
                      <span className="viewer-username">
                        {viewer.username}
                        {viewer.is_verified && (
                          <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </span>
                    </div>
                    {viewer.full_name && (
                      <span className="viewer-fullname">{viewer.full_name}</span>
                    )}
                  </div>
                  <span className="view-time">{formatTimeAgo(viewer.viewed_at)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
