import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import CreateHighlightModal from '../components/CreateHighlightModal';
import AddStoryModal from '../components/AddStoryModal';
import StoryRing from '../components/StoryRing';
import { formatDate } from '../utils/dateFormatter';
import './Highlights.css';

export default function Highlights({ user }) {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [highlightToDelete, setHighlightToDelete] = useState(null);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select(`
          *,
          highlight_stories(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHighlight = (newHighlight) => {
    setHighlights(prev => [newHighlight, ...prev]);
  };

  const handleAddStories = (highlight) => {
    setSelectedHighlight(highlight);
    setShowAddModal(true);
  };

  const handleStoriesAdded = () => {
    fetchHighlights(); // Refresh to get updated counts
  };

  const handleViewHighlight = (highlight) => {
    navigate(`/highlight/${highlight.id}`);
  };

  const handleEditHighlight = (highlight) => {
    setSelectedHighlight(highlight);
    setShowEditModal(true);
  };

  const handleUpdateHighlight = async (updatedData) => {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .update(updatedData)
        .eq('id', selectedHighlight.id)
        .select()
        .single();

      if (error) throw error;

      setHighlights(prev => prev.map(h => h.id === selectedHighlight.id ? data : h));
      setShowEditModal(false);
      setSelectedHighlight(null);
    } catch (error) {
      console.error('Error updating highlight:', error);
      alert('Failed to update highlight');
    }
  };

  const handleDeleteHighlight = async () => {
    if (!highlightToDelete) return;

    try {
      // Delete associated stories first
      const { error: storiesError } = await supabase
        .from('highlight_stories')
        .delete()
        .eq('highlight_id', highlightToDelete.id);

      if (storiesError) throw storiesError;

      // Delete the highlight
      const { error } = await supabase
        .from('highlights')
        .delete()
        .eq('id', highlightToDelete.id);

      if (error) throw error;

      setHighlights(prev => prev.filter(h => h.id !== highlightToDelete.id));
      setShowDeleteConfirm(false);
      setHighlightToDelete(null);
    } catch (error) {
      console.error('Error deleting highlight:', error);
      alert('Failed to delete highlight');
    }
  };

  const confirmDelete = (highlight, e) => {
    e.stopPropagation();
    setHighlightToDelete(highlight);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    return <div className="highlights-page loading">Loading highlights...</div>;
  }

  return (
    <div className="highlights-page">
      <div className="highlights-header">
        <h1>Highlights</h1>
        <div className="highlights-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"/>
              </svg>
            </button>
          </div>
          <button
            className="create-highlight-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            New Highlight
          </button>
        </div>
      </div>

      <div className={`highlights-container ${viewMode}-view`}>
        <AnimatePresence>
          {highlights.map((highlight) => (
            <motion.div
              key={highlight.id}
              className="highlight-card"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: viewMode === 'grid' ? 1.05 : 1.02 }}
              onClick={() => handleViewHighlight(highlight)}
            >
              <div className="highlight-cover">
                <StoryRing 
                  avatar={highlight.cover_url || 'https://via.placeholder.com/150'}
                  progress={100}
                />
              </div>
              <div className="highlight-info">
                <h3>{highlight.title}</h3>
                <span className="story-count">
                  {highlight.highlight_stories?.[0]?.count || 0} stories
                </span>
                <span className="created-date">
                  Created {formatDate(highlight.created_at)}
                </span>
              </div>
              <div className="highlight-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditHighlight(highlight);
                  }}
                  title="Edit highlight"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button
                  className="action-btn add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddStories(highlight);
                  }}
                  title="Add stories"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => confirmDelete(highlight, e)}
                  title="Delete highlight"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {highlights.length === 0 && (
          <div className="empty-highlights">
            <p>No highlights yet</p>
            <button onClick={() => setShowCreateModal(true)}>
              Create your first highlight
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateHighlightModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleCreateHighlight}
          />
        )}

        {showEditModal && selectedHighlight && (
          <CreateHighlightModal
            user={user}
            highlight={selectedHighlight}
            onClose={() => {
              setShowEditModal(false);
              setSelectedHighlight(null);
            }}
            onCreated={handleUpdateHighlight}
            isEdit={true}
          />
        )}

        {showAddModal && selectedHighlight && (
          <AddStoryModal
            user={user}
            highlight={selectedHighlight}
            onClose={() => {
              setShowAddModal(false);
              setSelectedHighlight(null);
            }}
            onAdded={handleStoriesAdded}
          />
        )}

        {showDeleteConfirm && highlightToDelete && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowDeleteConfirm(false);
              setHighlightToDelete(null);
            }}
          >
            <motion.div
              className="delete-confirm-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Highlight?</h3>
              <p>
                Are you sure you want to delete "{highlightToDelete.title}"? 
                This will remove all stories in this highlight.
              </p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setHighlightToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-delete"
                  onClick={handleDeleteHighlight}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
