import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout/Layout';
import PostCard from '../components/PostCard';
import CollectionCard from '../components/CollectionCard';
import { formatDate } from '../utils/dateFormatter';
import './Saved.css';

export default function Saved({ user }) {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'collections'

  const fetchSavedPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          created_at,
          post:post_id(
            id,
            user_id,
            image_url,
            video_url,
            media_url,
            media_urls,
            media_type,
            media_types,
            is_carousel,
            caption,
            likes_count,
            comments_count,
            created_at,
            profiles:user_id(
              id,
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include is_saved flag
      const transformedData = (data || []).map(item => ({
        ...item.post,
        is_saved: true,
        saved_id: item.id,
        saved_at: item.created_at
      }));
      
      setSavedPosts(transformedData);
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchCollections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          name,
          created_at,
          post_count
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch preview images for each collection
      const collectionsWithPreviews = await Promise.all(
        (data || []).map(async (collection) => {
          const { data: posts } = await supabase
            .from('collection_posts')
            .select('post:post_id(image_url, media_url)')
            .eq('collection_id', collection.id)
            .limit(4);
          
          const previewImages = (posts || []).map(p => p.post?.image_url || p.post?.media_url).filter(Boolean);
          
          return {
            ...collection,
            preview_images: previewImages
          };
        })
      );
      
      setCollections(collectionsWithPreviews);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchSavedPosts();
    fetchCollections();
  }, [fetchSavedPosts, fetchCollections]);

  const handleUnsave = async (postId) => {
    try {
      await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setSavedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error unsaving post:', error);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    try {
      // Delete collection posts first
      await supabase
        .from('collection_posts')
        .delete()
        .eq('collection_id', collectionId);

      // Delete collection
      await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      setCollections(prev => prev.filter(c => c.id !== collectionId));
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="saved-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading saved content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        className="saved-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="saved-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            ← Back
          </button>
          <h1>Saved</h1>
        </div>

        {/* Tabs */}
        <div className="saved-tabs">
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
            <span className="tab-count">{savedPosts.length}</span>
          </button>
          <button 
            className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            Collections
            <span className="tab-count">{collections.length}</span>
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {savedPosts.length === 0 ? (
                <div className="empty-saved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <h3>No saved posts yet</h3>
                  <p>Save posts to see them here</p>
                </div>
              ) : (
                <div className="saved-grid">
                  {savedPosts.map((post) => (
                    <div key={post.id} className="saved-post-wrapper">
                      <PostCard
                        post={post}
                        user={user}
                        onUpdate={fetchSavedPosts}
                        mode="grid"
                      />
                      <div className="saved-date">
                        Saved {formatDate(post.saved_at, 'relative')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {collections.length === 0 ? (
                <div className="empty-saved">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3>No collections yet</h3>
                  <p>Create collections to organize your saved posts</p>
                  <button 
                    className="create-collection-btn"
                    onClick={() => navigate('/saved/collections/new')}
                  >
                    Create Collection
                  </button>
                </div>
              ) : (
                <div className="saved-grid">
                  {collections.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      onDelete={handleDeleteCollection}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
