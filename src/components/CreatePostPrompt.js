/**
 * CreatePostPrompt Component
 * 
 * Floating prompt encouraging users to create their first post
 * Shows at top of home feed if user hasn't posted yet
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import './CreatePostPrompt.css';

const CreatePostPrompt = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasPosted, setHasPosted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkUserPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (error) throw error;

        setHasPosted(data && data.length > 0);
      } catch (err) {
        console.error('Error checking user posts:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserPosts();
  }, [user]);

  if (loading || hasPosted || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="create-post-prompt"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <button
          className="create-post-prompt-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          ✕
        </button>
        
        <div className="create-post-prompt-content">
          <div className="create-post-prompt-icon">📸</div>
          <div className="create-post-prompt-text">
            <h3>Share your first moment!</h3>
            <p>Create your first post and start connecting with others</p>
          </div>
        </div>

        <button
          className="create-post-prompt-button"
          onClick={() => navigate('/create')}
        >
          <span className="create-post-prompt-button-icon">✨</span>
          Create Post
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePostPrompt;
