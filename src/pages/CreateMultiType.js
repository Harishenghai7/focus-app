import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { prepareMediaForUpload, MediaValidationError } from "../utils/mediaValidator";
import { processMentionsAndNotify } from "../utils/notificationService";
import "./CreateMultiType.css";

export default function CreateMultiType({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('post');
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    { id: 'post', label: 'Post', icon: '📸', accept: 'image/*', maxSize: 5 },
    { id: 'boltz', label: 'Boltz', icon: '🎬', accept: 'video/*', maxSize: 50 },
    { id: 'flash', label: 'Flash', icon: '⚡', accept: 'image/*,video/*', maxSize: 20 }
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate and prepare media
      const prepared = await prepareMediaForUpload(file, {
        compress: activeTab === 'post',
        maxWidth: 1920,
        quality: 0.85,
        generateThumbnail: activeTab === 'boltz'
      });

      setMediaFile(prepared.file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(prepared.file);
    } catch (error) {
      if (error instanceof MediaValidationError) {
        alert(error.message);
      } else {
        alert('Failed to process file. Please try again.');
      }
      console.error('Media upload error:', error);
    }
  };

  const uploadToStorage = async (file, bucket) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) {
      alert("Please add content or media");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      let mediaUrl = null;
      let mediaType = null;
      
      if (mediaFile) {
        let bucket;
        if (activeTab === 'post') bucket = 'posts';
        else if (activeTab === 'boltz') bucket = 'boltz';
        else if (activeTab === 'flash') bucket = 'flash';

        mediaUrl = await uploadToStorage(mediaFile, bucket);
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }
      
      let insertData = {
        user_id: user.id
      };
      
      if (activeTab === 'post') {
        insertData = {
          user_id: user.id,
          caption: content.trim(),
          media_url: mediaUrl
        };
      } else if (activeTab === 'boltz') {
        insertData = {
          user_id: user.id,
          caption: content.trim(),
          video_url: mediaUrl
        };
      } else if (activeTab === 'flash') {
        insertData = {
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          is_close_friends: isCloseFriendsOnly
        };
      }
      
      let tableName;
      if (activeTab === 'post') tableName = 'posts';
      else if (activeTab === 'boltz') tableName = 'boltz';
      else if (activeTab === 'flash') tableName = 'flashes';
      
      let error;
      let createdId;
      if (activeTab === 'flash') {
        // Insert with user_id and try to add media
        const flashData = { user_id: user.id };
        if (mediaUrl) flashData.media_url = mediaUrl;
        if (content.trim()) flashData.caption = content.trim();
        flashData.is_close_friends = isCloseFriendsOnly;

        const { data, error: sqlError } = await supabase
          .from('flashes')
          .insert(flashData)
          .select()
          .single();
        error = sqlError;
        createdId = data?.id;
      } else {
        const { data, error: insertError } = await supabase
          .from(tableName)
          .insert(insertData)
          .select()
          .single();
        error = insertError;
        createdId = data?.id;
      }
      
      if (error) throw error;

      // Process mentions in caption and create notifications
      if (content.trim() && createdId) {
        await processMentionsAndNotify(content.trim(), user.id, createdId, activeTab);
      }
      
      setContent("");
      setMediaFile(null);
      setMediaPreview(null);
      setUploadProgress(0);
      
      alert(`Your ${activeTab} is live!`);
      navigate("/");
    } catch (error) {
      console.error(`Error creating ${activeTab}:`, error);
      alert(`Failed to create ${activeTab}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main 
      className="page page-create"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-inner">
        <div className="create-container">
          <motion.div 
            className="create-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="create-title">
              <span className="create-icon">✨</span>
              Create & Share
            </h1>
            <p className="create-subtitle">
              Share photos, videos, or moments that inspire
            </p>
          </motion.div>

          <motion.div 
            className="create-tabs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    className="tab-indicator"
                    layoutId="activeCreateTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </motion.div>

          <motion.form 
            className="create-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="media-upload-section">
              <label className="media-upload-label">
                <input
                  type="file"
                  accept={activeTabConfig.accept}
                  onChange={handleMediaUpload}
                  className="media-upload-input"
                  disabled={loading}
                />
                <div className="media-upload-area">
                  {mediaPreview ? (
                    <motion.div 
                      className="media-preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {mediaFile?.type.startsWith('video/') ? (
                        <video src={mediaPreview} className="preview-video" controls />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="preview-image" />
                      )}
                      <button
                        type="button"
                        className="remove-media-btn"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                      >
                        ✕
                      </button>
                    </motion.div>
                  ) : (
                    <div className="upload-placeholder">
                      <motion.div 
                        className="upload-icon"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {activeTabConfig.icon}
                      </motion.div>
                      <h3>
                        {activeTab === 'post' && 'Add a Photo'}
                        {activeTab === 'boltz' && 'Add a Video'}
                        {activeTab === 'flash' && 'Add Media'}
                      </h3>
                      <p>
                        {activeTab === 'post' && 'Share a moment that matters'}
                        {activeTab === 'boltz' && 'Create a short video'}
                        {activeTab === 'flash' && 'Share a quick highlight'}
                      </p>
                      <span className="upload-hint">
                        Max {activeTabConfig.maxSize}MB • Click to browse
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="content-section">
              <label className="content-label">
                <span className="label-text">Caption</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Write a caption for your ${activeTab}...`}
                  className="content-textarea"
                  rows={3}
                  maxLength={2000}
                  disabled={loading}
                />
                <div className="character-count">
                  {content.length}/2000
                </div>
              </label>
            </div>

            {activeTab === 'flash' && (
              <div className="close-friends-section">
                <label className="close-friends-toggle">
                  <input
                    type="checkbox"
                    checked={isCloseFriendsOnly}
                    onChange={(e) => setIsCloseFriendsOnly(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">Share with close friends only</span>
                </label>
                <p className="toggle-description">
                  Only your close friends will see this Flash story
                </p>
              </div>
            )}

            <AnimatePresence>
              {loading && uploadProgress > 0 && (
                <motion.div
                  className="upload-progress"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="progress-text">{uploadProgress}% uploaded</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading || (!content.trim() && !mediaFile)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span className="submit-icon">🚀</span>
                  <span>Share {activeTab === 'post' ? 'Post' : activeTab === 'boltz' ? 'Boltz' : 'Flash'}</span>
                </>
              )}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </motion.main>
  );
}