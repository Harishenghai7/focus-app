import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './AddStoryModal.css';

export default function AddStoryModal({ user, highlight, onClose, onAdded }) {
  const [stories, setStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableStories();
  }, []);

  const fetchAvailableStories = async () => {
    try {
      // Get user's flash stories (expired ones can be added to highlights)
      const { data, error } = await supabase
        .from('flash')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get already added story IDs for this highlight
      const { data: existingStories } = await supabase
        .from('highlight_stories')
        .select('flash_id')
        .eq('highlight_id', highlight.id);

      const existingIds = new Set(existingStories?.map(s => s.flash_id) || []);

      // Filter out already added stories
      const availableStories = data?.filter(s => !existingIds.has(s.id)) || [];
      setStories(availableStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStory = (storyId) => {
    setSelectedStories(prev =>
      prev.includes(storyId)
        ? prev.filter(id => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleAdd = async () => {
    if (selectedStories.length === 0) return;

    try {
      // Get current max position
      const { data: existing } = await supabase
        .from('highlight_stories')
        .select('position')
        .eq('highlight_id', highlight.id)
        .order('position', { ascending: false })
        .limit(1);

      let nextPosition = (existing?.[0]?.position || 0) + 1;

      // Add selected stories
      const inserts = selectedStories.map((flashId, index) => ({
        highlight_id: highlight.id,
        flash_id: flashId,
        position: nextPosition + index
      }));

      await supabase.from('highlight_stories').insert(inserts);

      onAdded();
      onClose();
    } catch (error) {
      console.error('Error adding stories:', error);
      alert('Failed to add stories');
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
        className="add-story-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Add Stories to {highlight.title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading stories...</div>
          ) : stories.length === 0 ? (
            <div className="empty-state">
              <p>No stories available to add</p>
              <small>All your stories are already in this highlight</small>
            </div>
          ) : (
            <div className="stories-grid">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className={`story-item ${selectedStories.includes(story.id) ? 'selected' : ''}`}
                  onClick={() => toggleStory(story.id)}
                >
                  {story.media_type === 'video' ? (
                    <video src={story.media_url} />
                  ) : (
                    <img src={story.media_url} alt="Story" />
                  )}
                  <div className="story-overlay">
                    {selectedStories.includes(story.id) && (
                      <div className="check-icon">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-add"
            onClick={handleAdd}
            disabled={selectedStories.length === 0}
          >
            Add {selectedStories.length > 0 && `(${selectedStories.length})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
