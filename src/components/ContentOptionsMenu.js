import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './ContentOptionsMenu.css';

export default function ContentOptionsMenu({ 
  content, 
  contentType = 'post', 
  currentUser, 
  onClose, 
  onAction 
}) {
  const [loading, setLoading] = useState(false);
  const isOwnContent = content.user_id === currentUser?.id;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    
    setLoading(true);
    try {
      const table = contentType === 'boltz' ? 'boltz' : contentType === 'flash' ? 'flashes' : 'posts';
      const { error } = await supabase.from(table).delete().eq('id', content.id);
      if (error) throw error;
      onAction?.('deleted');
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt('Why are you reporting this content?');
    if (!reason?.trim()) return;

    setLoading(true);
    try {
      await supabase.from('reports').insert({
        reporter_id: currentUser.id,
        content_id: content.id,
        content_type: contentType,
        reason: 'inappropriate',
        description: reason.trim()
      });
      alert('Thank you for your report. We will review it shortly.');
      onAction?.('reported');
      onClose();
    } catch (error) {
      console.error('Report error:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${contentType}/${content.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
      onAction?.('shared');
      onClose();
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleHide = async () => {
    setLoading(true);
    try {
      await supabase.from('hidden_content').insert({
        user_id: currentUser.id,
        content_id: content.id,
        content_type: contentType
      });
      onAction?.('hidden');
      onClose();
    } catch (error) {
      console.error('Hide error:', error);
      alert('Failed to hide content');
    } finally {
      setLoading(false);
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
        className="content-options-menu"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {isOwnContent ? (
          <>
            <button className="option-btn" onClick={handleShare} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              Share
            </button>
            <button className="option-btn" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/${contentType}/${content.id}`);
              alert('Link copied!');
              onClose();
            }} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              </svg>
              Copy Link
            </button>
            <button className="option-btn danger" onClick={handleDelete} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Delete
            </button>
          </>
        ) : (
          <>
            <button className="option-btn" onClick={handleShare} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
              Share
            </button>
            <button className="option-btn" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/${contentType}/${content.id}`);
              alert('Link copied!');
              onClose();
            }} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              </svg>
              Copy Link
            </button>
            <button className="option-btn" onClick={handleHide} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
              Not Interested
            </button>
            <button className="option-btn danger" onClick={handleReport} disabled={loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              Report
            </button>
          </>
        )}
        <button className="option-btn cancel" onClick={onClose}>
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}
