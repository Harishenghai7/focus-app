import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import styles from './ViewersModal.module.css';

/**
 * ViewersModal - Modal for displaying viewers of a flash/story.
 * @component
 * @param {string} flashId - ID of the flash/story
 * @param {function} onClose - Handler to close modal
 * @returns {React.ReactElement}
 */
const ViewersModal = React.memo(function ViewersModal({ flashId, onClose }) {
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
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        className={styles.viewersModal}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 500 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>Viewers</h3>
          <span className={styles.viewersCountBadge}>{viewers.length}</span>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.viewersLoading}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading viewers...</p>
            </div>
          ) : error ? (
            <div className={styles.viewersError}>
              <p>{error}</p>
              <button onClick={fetchViewers} className={styles.retryBtn}>
                Try Again
              </button>
            </div>
          ) : viewers.length === 0 ? (
            <div className={styles.noViewers}>
              <div className={styles.noViewersIcon}>👁️</div>
              <p>No views yet</p>
              <small>Views will appear here when people see your story</small>
            </div>
          ) : (
            <div className={styles.viewersList}>
              {(viewers || []).map((viewer) => (
                <motion.div
                  key={viewer.id}
                  className={styles.viewerItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  onClick={() => handleViewerClick(viewer.username)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View profile of ${viewer.username}`}
                >
                  <img
                    src={viewer.avatar_url || `https://ui-avatars.com/api/?name=${viewer.username}&background=667eea&color=fff`}
                    alt={viewer.username}
                    className={styles.viewerAvatar}
                  />
                  <div className={styles.viewerInfo}>
                    <div className={styles.viewerNameRow}>
                      <span className={styles.viewerUsername}>
                        {viewer.username}
                        {viewer.is_verified && (
                          <svg className={styles.verifiedBadge} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </span>
                    </div>
                    {viewer.full_name && (
                      <span className={styles.viewerFullname}>{viewer.full_name}</span>
                    )}
                  </div>
                  <span className={styles.viewTime}>{formatTimeAgo(viewer.viewed_at)}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

ViewersModal.displayName = 'ViewersModal';
ViewersModal.propTypes = {
  flashId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ViewersModal;
