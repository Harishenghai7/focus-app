import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import CreateHighlightModal from '../components/CreateHighlightModal';
import AddStoryModal from '../components/AddStoryModal';
import './Highlights.css';

export default function Highlights({ user }) {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

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

  if (loading) {
    return <div className="highlights-page loading">Loading highlights...</div>;
  }

  return (
    <div className="highlights-page">
      <div className="highlights-header">
        <h1>Highlights</h1>
        <button
          className="create-highlight-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + New
        </button>
      </div>

      <div className="highlights-grid">
        {highlights.map((highlight) => (
          <motion.div
            key={highlight.id}
            className="highlight-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => handleViewHighlight(highlight)}
          >
            <div className="highlight-cover">
              <img
                src={highlight.cover_url || 'https://via.placeholder.com/150'}
                alt={highlight.title}
              />
            </div>
            <div className="highlight-info">
              <h3>{highlight.title}</h3>
              <span>{highlight.highlight_stories?.[0]?.count || 0} stories</span>
            </div>
            <button
              className="add-stories-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAddStories(highlight);
              }}
            >
              +
            </button>
          </motion.div>
        ))}

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
      {showCreateModal && (
        <CreateHighlightModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateHighlight}
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
    </div>
  );
}
