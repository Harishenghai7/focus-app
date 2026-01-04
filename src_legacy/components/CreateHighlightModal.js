import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import styles from './CreateHighlightModal.module.css';

/**
 * CreateHighlightModal - Modal for creating or editing a story highlight.
 * @component
 * @param {Object} user - Current user object
 * @param {Object} highlight - Existing highlight (for edit mode)
 * @param {boolean} isEdit - Whether in edit mode
 * @param {function} onClose - Handler to close modal
 * @param {function} onCreated - Handler for successful highlight creation/update
 * @returns {React.ReactElement}
 */
const CreateHighlightModal = React.memo(function CreateHighlightModal({ 
  user, 
  highlight = null,
  isEdit = false,
  onClose, 
  onCreated 
}) {
  const [title, setTitle] = useState(highlight?.title || '');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(highlight?.cover_url || null);
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
      let coverUrl = coverPreview;

      // Upload cover image if a new file was selected
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

      if (isEdit && highlight) {
        // Update existing highlight
        onCreated({
          title: title.trim(),
          cover_url: coverUrl
        });
      } else {
        // Create new highlight
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
      }
      
      onClose();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} highlight:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} highlight`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.createHighlightModal}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3>{isEdit ? 'Edit Highlight' : 'New Highlight'}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Highlight title"
                maxLength={30}
                required
                aria-label="Highlight title"
              />
              <div className={styles.charCount}>
                {title.length}/30
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Cover Photo</label>
              <div className={styles.coverUpload}>
                {coverPreview ? (
                  <div className={styles.coverPreview}>
                    <img src={coverPreview} alt="Cover preview" />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      aria-label="Remove cover photo"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadLabel} htmlFor="cover-upload">
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
                  aria-label="Upload cover photo"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnCreate}
              disabled={!title.trim() || uploading}
              aria-label={isEdit ? 'Update highlight' : 'Create highlight'}
            >
              {uploading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
});

CreateHighlightModal.displayName = 'CreateHighlightModal';
CreateHighlightModal.propTypes = {
  user: PropTypes.object,
  highlight: PropTypes.object,
  isEdit: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func
};

export default CreateHighlightModal;
