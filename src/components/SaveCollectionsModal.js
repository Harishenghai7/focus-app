import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './SaveCollectionsModal.css';

export default function SaveCollectionsModal({ 
  isOpen, 
  onClose, 
  contentId, 
  contentType, 
  user 
}) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [savedCollections, setSavedCollections] = useState(new Set());

  useEffect(() => {
    if (isOpen && user) {
      fetchCollections();
      fetchSavedCollections();
    }
  }, [isOpen, user, contentId]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;
      
      const collectionIds = new Set(data?.map(item => item.collection_id) || []);
      setSavedCollections(collectionIds);
    } catch (error) {
      console.error('Error fetching saved collections:', error);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim() || creating) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('saved_collections')
        .insert([{
          user_id: user.id,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          is_private: true
        }])
        .select()
        .single();

      if (error) throw error;

      setCollections(prev => [data, ...prev]);
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);
      
      // Auto-add current content to new collection
      if (data) {
        await handleToggleCollection(data.id, true);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      if (error.message?.includes('duplicate')) {
        alert('A collection with this name already exists');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCollection = async (collectionId, forceAdd = false) => {
    const isCurrentlySaved = savedCollections.has(collectionId);
    
    if (isCurrentlySaved && !forceAdd) {
      // Remove from collection
      try {
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        if (error) throw error;

        setSavedCollections(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
      } catch (error) {
        console.error('Error removing from collection:', error);
      }
    } else {
      // Add to collection
      try {
        const { error } = await supabase
          .from('collection_items')
          .insert([{
            collection_id: collectionId,
            content_id: contentId,
            content_type: contentType
          }]);

        if (error) throw error;

        setSavedCollections(prev => new Set([...prev, collectionId]));
      } catch (error) {
        console.error('Error adding to collection:', error);
      }
    }
  };

  const handleDeleteCollection = async (collectionId, collectionName) => {
    if (!window.confirm(`Delete collection "${collectionName}"? This will remove all saved items from this collection.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('saved_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;

      setCollections(prev => prev.filter(c => c.id !== collectionId));
      setSavedCollections(prev => {
        const newSet = new Set(prev);
        newSet.delete(collectionId);
        return newSet;
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="save-collections-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="save-collections-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="save-collections-header">
              <h3>Save to Collection</h3>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="save-collections-content">
              {loading ? (
                <div className="collections-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading collections...</p>
                </div>
              ) : (
                <>
                  {/* Create New Collection Button */}
                  {!showCreateForm && (
                    <button
                      className="create-collection-btn"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <span className="plus-icon">+</span>
                      Create New Collection
                    </button>
                  )}

                  {/* Create Collection Form */}
                  <AnimatePresence>
                    {showCreateForm && (
                      <motion.form
                        className="create-collection-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleCreateCollection}
                      >
                        <input
                          type="text"
                          placeholder="Collection name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          maxLength={50}
                          autoFocus
                        />
                        <textarea
                          placeholder="Description (optional)"
                          value={newCollectionDescription}
                          onChange={(e) => setNewCollectionDescription(e.target.value)}
                          maxLength={200}
                          rows={2}
                        />
                        <div className="form-actions">
                          <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => {
                              setShowCreateForm(false);
                              setNewCollectionName('');
                              setNewCollectionDescription('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="submit-btn"
                            disabled={!newCollectionName.trim() || creating}
                          >
                            {creating ? 'Creating...' : 'Create'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Collections List */}
                  <div className="collections-list">
                    {collections.length === 0 ? (
                      <div className="collections-empty">
                        <div className="empty-icon">📁</div>
                        <h4>No collections yet</h4>
                        <p>Create your first collection to organize saved posts</p>
                      </div>
                    ) : (
                      collections.map((collection) => (
                        <div
                          key={collection.id}
                          className={`collection-item ${savedCollections.has(collection.id) ? 'saved' : ''}`}
                        >
                          <div
                            className="collection-info"
                            onClick={() => handleToggleCollection(collection.id)}
                          >
                            <div className="collection-cover">
                              {collection.cover_image_url ? (
                                <img src={collection.cover_image_url} alt={collection.name} />
                              ) : (
                                <div className="collection-placeholder">📁</div>
                              )}
                            </div>
                            <div className="collection-details">
                              <h4>{collection.name}</h4>
                              {collection.description && (
                                <p className="collection-description">{collection.description}</p>
                              )}
                              <span className="collection-count">
                                {collection.post_count} {collection.post_count === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                            <div className="collection-checkbox">
                              {savedCollections.has(collection.id) && (
                                <motion.div
                                  className="checkmark"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  ✓
                                </motion.div>
                              )}
                            </div>
                          </div>
                          {collection.name !== 'All Saved' && (
                            <button
                              className="delete-collection-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(collection.id, collection.name);
                              }}
                              title="Delete collection"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
