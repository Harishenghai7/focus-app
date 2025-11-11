import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Archive.css';

export default function Archive({ user }) {
  const navigate = useNavigate();
  const [archivedFlashes, setArchivedFlashes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedFlash, setSelectedFlash] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadArchive();
    loadStats();
    loadHighlights();
  }, []);

  const loadArchive = async (pageNum = 0) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_archived_flashes', {
        limit_count: PAGE_SIZE,
        offset_count: pageNum * PAGE_SIZE
      });

      if (error) throw error;

      if (pageNum === 0) {
        setArchivedFlashes(data || []);
      } else {
        setArchivedFlashes(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_archive_stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('id, title, cover_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const handleRestoreToHighlight = async (highlightId) => {
    if (!selectedFlash) return;

    try {
      const { data, error } = await supabase.rpc('restore_flash_to_highlight', {
        flash_uuid: selectedFlash.id,
        highlight_uuid: highlightId
      });

      if (error) throw error;

      if (data.success) {
        alert('Flash restored to highlight!');
        setShowRestoreModal(false);
        setSelectedFlash(null);
      } else {
        alert(data.message || 'Failed to restore flash');
      }
    } catch (error) {
      console.error('Error restoring flash:', error);
      alert('Failed to restore flash');
    }
  };

  const handleDeleteFlash = async (flashId) => {
    if (!window.confirm('Permanently delete this flash? This cannot be undone.')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('delete_archived_flash', {
        flash_uuid: flashId
      });

      if (error) throw error;

      if (data.success) {
        // Remove from local state
        setArchivedFlashes(prev => prev.filter(f => f.id !== flashId));
        
        // Delete media file from storage if URL is provided
        if (data.media_url) {
          try {
            const url = new URL(data.media_url);
            const pathParts = url.pathname.split('/flash/');
            if (pathParts.length > 1) {
              await supabase.storage.from('flash').remove([pathParts[1]]);
            }
          } catch (storageError) {
            console.error('Error deleting media:', storageError);
          }
        }

        // Reload stats
        loadStats();
        alert('Flash permanently deleted');
      } else {
        alert(data.message || 'Failed to delete flash');
      }
    } catch (error) {
      console.error('Error deleting flash:', error);
      alert('Failed to delete flash');
    }
  };

  const handleCleanupOldArchives = async () => {
    const days = prompt('Delete archived flashes older than how many days?', '90');
    if (!days) return;

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1) {
      alert('Please enter a valid number of days');
      return;
    }

    if (!window.confirm(`Permanently delete all archived flashes older than ${daysNum} days?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('cleanup_old_archives', {
        days_old: daysNum
      });

      if (error) throw error;

      if (data.success) {
        alert(`Deleted ${data.deleted_count} old archived flashes`);
        loadArchive(0);
        loadStats();
      }
    } catch (error) {
      console.error('Error cleaning up archives:', error);
      alert('Failed to cleanup archives');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDaysAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (loading && page === 0) {
    return (
      <div className="page page-archive">
        <div className="archive-loading">
          <div className="loading-spinner"></div>
          <p>Loading archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-archive">
      <div className="archive-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Flash Archive</h1>
        <button className="cleanup-btn" onClick={handleCleanupOldArchives}>
          🗑️ Cleanup
        </button>
      </div>

      {stats && (
        <div className="archive-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.total_archived}</div>
            <div className="stat-label">Archived Flashes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_views}</div>
            <div className="stat-label">Total Views</div>
          </div>
          {stats.oldest_archive && (
            <div className="stat-card">
              <div className="stat-value">{formatDaysAgo(stats.oldest_archive)}</div>
              <div className="stat-label">Oldest Archive</div>
            </div>
          )}
        </div>
      )}

      {archivedFlashes.length === 0 ? (
        <div className="empty-archive">
          <div className="empty-icon">📦</div>
          <h3>No archived flashes</h3>
          <p>Your expired flashes will be archived here for 90 days</p>
        </div>
      ) : (
        <>
          <div className="archive-grid">
            {archivedFlashes.map((flash) => (
              <motion.div
                key={flash.id}
                className="archive-item"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="archive-media">
                  {flash.media_type === 'video' ? (
                    <video src={flash.media_url} />
                  ) : (
                    <img src={flash.media_url} alt="Archived flash" />
                  )}
                  <div className="archive-overlay">
                    <div className="archive-info">
                      <span className="archive-date">
                        {formatDate(flash.created_at)}
                      </span>
                      <span className="archive-views">
                        👁️ {flash.view_count} views
                      </span>
                    </div>
                  </div>
                </div>
                <div className="archive-actions">
                  <button
                    className="btn-restore"
                    onClick={() => {
                      setSelectedFlash(flash);
                      setShowRestoreModal(true);
                    }}
                  >
                    ↻ Restore
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteFlash(flash.id)}
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="load-more">
              <button
                className="btn-load-more"
                onClick={() => loadArchive(page + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Restore to Highlight Modal */}
      <AnimatePresence>
        {showRestoreModal && selectedFlash && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRestoreModal(false);
              setSelectedFlash(null);
            }}
          >
            <motion.div
              className="restore-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Restore to Highlight</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedFlash(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                {highlights.length === 0 ? (
                  <div className="no-highlights">
                    <p>No highlights available</p>
                    <button
                      className="btn-create-highlight"
                      onClick={() => navigate('/highlights')}
                    >
                      Create Highlight
                    </button>
                  </div>
                ) : (
                  <div className="highlights-list">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="highlight-item"
                        onClick={() => handleRestoreToHighlight(highlight.id)}
                      >
                        <img
                          src={highlight.cover_url || '/default-avatar.png'}
                          alt={highlight.title}
                          className="highlight-cover"
                        />
                        <span className="highlight-title">{highlight.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
