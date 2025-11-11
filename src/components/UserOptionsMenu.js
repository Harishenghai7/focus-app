import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './UserOptionsMenu.css';

export default function UserOptionsMenu({ targetUser, currentUser, onClose, onAction }) {
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Block @${targetUser.username}? They won't be able to find your profile or see your posts.`)) {
      return;
    }

    setLoading(true);
    try {
      // Unfollow if following
      await supabase
        .from('follows')
        .delete()
        .or(`follower_id.eq.${currentUser.id},following_id.eq.${currentUser.id}`)
        .or(`follower_id.eq.${targetUser.id},following_id.eq.${targetUser.id}`);

      // Block user
      await supabase.from('blocked_users').insert({
        blocker_id: currentUser.id,
        blocked_id: targetUser.id
      });

      onAction('blocked');
      onClose();
    } catch (error) {
      console.error('Block error:', error);
      alert('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleMute = async () => {
    setLoading(true);
    try {
      await supabase.from('muted_users').insert({
        muter_id: currentUser.id,
        muted_id: targetUser.id
      });

      onAction('muted');
      onClose();
    } catch (error) {
      console.error('Mute error:', error);
      alert('Failed to mute user');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    onAction('report');
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
        className="user-options-menu"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="option-btn danger"
          onClick={handleBlock}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          Block @{targetUser.username}
        </button>

        <button 
          className="option-btn"
          onClick={handleMute}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16 2a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2h8z"/>
            <path d="M12 18h.01"/>
          </svg>
          Mute @{targetUser.username}
        </button>

        <button 
          className="option-btn danger"
          onClick={handleReport}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Report @{targetUser.username}
        </button>

        <button 
          className="option-btn cancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
