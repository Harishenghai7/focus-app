import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import './CreateHighlightModal.css';

export default function CreateHighlightModal({ user, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    try {
      let coverUrl = null;

      // Upload cover image if provided
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/highlights/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('highlights')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('highlights')
          .getPublicUrl(fileName);

        coverUrl = publicUrl;
      }

      // Create highlight
      const { data, error } = await supabase
        .from('highlights')
        .insert([{
          user_id: user.id,
          title: title.trim(),
          cover_url: coverUrl
        }])
        .select()
        .single();

      if (error) throw error;

      onCreated(data);
      onClose();
    } catch (error) {
      console.error('Error creating highlight:', error);
      alert('Failed to create highlight');
    } finally {
      setUploading(false);
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
        className="create-highlight-modal"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>New Highlight</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Highlight title"
                maxLength={30}
                required
              />
              <div className="char-count">
                {title.length}/30
              </div>
            </div>

            <div className="form-group">
              <label>Cover Photo</label>
              <div className="cover-upload">
                {coverPreview ? (
                  <div className="cover-preview">
                    <img src={coverPreview} alt="Cover preview" />
                    <button type="button" onClick={handleRemoveCover}>×</button>
                  </div>
                ) : (
                  <label className="upload-label" htmlFor="cover-upload">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Choose cover photo</span>
                  </label>
                )}
                <input
                  id="cover-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={!title.trim() || uploading}
            >
              {uploading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
