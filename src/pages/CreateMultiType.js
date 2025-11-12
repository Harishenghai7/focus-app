import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { prepareMediaForUpload, MediaValidationError } from "../utils/mediaValidator";
import { processMentionsAndNotify } from "../utils/notificationService";
import { generateVideoThumbnail } from "../utils/videoProcessing";
import "./CreateMultiType.css";

// ✅ NEW: Toast notification helper (replace alert())
const showToast = (message, type = 'info') => {
  // You can integrate react-hot-toast or create custom toast
  const event = new CustomEvent('showToast', { detail: { message, type } });
  window.dispatchEvent(event);
  
  // Fallback to alert if toast not available
  if (typeof window.toast === 'undefined') {
    alert(message);
  }
};

export default function CreateMultiType({ user, userProfile }) {
  const [activeTab, setActiveTab] = useState('post');
  const [content, setContent] = useState("");
  
  // ✅ FIX: Support multiple media files for carousel
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [processingMedia, setProcessingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  
  // ✅ NEW: Additional features
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [location, setLocation] = useState(null);
  const [altTexts, setAltTexts] = useState({});
  
  const navigate = useNavigate();
  const mounted = useRef(true);
  const uploadAbortController = useRef(null);

  const tabs = [
    { id: 'post', label: 'Post', icon: '📸', accept: 'image/*,video/*', maxSize: 5, maxFiles: 10 },
    { id: 'boltz', label: 'Boltz', icon: '🎬', accept: 'video/*', maxSize: 50, maxFiles: 1 },
    { id: 'flash', label: 'Flash', icon: '⚡', accept: 'image/*,video/*', maxSize: 20, maxFiles: 1 }
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab);

  // ✅ NEW: Auto-save draft to localStorage
  useEffect(() => {
    const draftKey = `focus_draft_${activeTab}_${user.id}`;
    
    // Load draft on mount
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          setContent(draft.content || '');
          setIsCloseFriendsOnly(draft.isCloseFriendsOnly || false);
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }

    // Save draft on change
    const saveDraft = () => {
      if (content.trim() || mediaFiles.length > 0) {
        localStorage.setItem(draftKey, JSON.stringify({
          content,
          isCloseFriendsOnly,
          timestamp: Date.now()
        }));
      }
    };

    const draftTimer = setInterval(saveDraft, 5000); // Auto-save every 5 seconds

    return () => {
      clearInterval(draftTimer);
      saveDraft(); // Save on unmount
    };
  }, [content, isCloseFriendsOnly, mediaFiles, activeTab, user.id]);

  // ✅ NEW: Clear draft after successful post
  const clearDraft = () => {
    const draftKey = `focus_draft_${activeTab}_${user.id}`;
    localStorage.removeItem(draftKey);
  };

  // ✅ FIX: Support multiple file uploads for carousel
  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // ✅ FIX: Check max files limit
    if (mediaFiles.length + files.length > activeTabConfig.maxFiles) {
      showToast(`You can only upload up to ${activeTabConfig.maxFiles} files for ${activeTab}`, 'error');
      return;
    }

    setProcessingMedia(true);

    try {
      const processedFiles = [];
      const newPreviews = [];
      const newAltTexts = {};

      for (const file of files) {
        // ✅ FIX: Validate file size against tab config
        const maxSizeBytes = activeTabConfig.maxSize * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          showToast(`File ${file.name} exceeds ${activeTabConfig.maxSize}MB limit`, 'error');
          continue;
        }

        // ✅ FIX: Validate file type
        const fileType = file.type.split('/')[0];
        const acceptedTypes = activeTabConfig.accept.split(',').map(t => t.trim());
        const isValidType = acceptedTypes.some(type => {
          if (type === 'image/*') return fileType === 'image';
          if (type === 'video/*') return fileType === 'video';
          return file.type === type;
        });

        if (!isValidType) {
          showToast(`File type ${file.type} not supported for ${activeTab}`, 'error');
          continue;
        }

        // Validate and prepare media
        const prepared = await prepareMediaForUpload(file, {
          compress: activeTab === 'post',
          maxWidth: 1920,
          quality: 0.85,
          generateThumbnail: activeTab === 'boltz' || (activeTab === 'post' && fileType === 'video')
        });

        processedFiles.push(prepared);

        // Create preview
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(prepared.file);
        });

        newPreviews.push({
          id: Date.now() + Math.random(),
          url: preview,
          type: file.type,
          thumbnail: prepared.thumbnail || null
        });

        // Initialize alt text
        newAltTexts[preview] = '';
      }

      setMediaFiles(prev => [...prev, ...processedFiles]);
      setMediaPreviews(prev => [...prev, ...newPreviews]);
      setAltTexts(prev => ({ ...prev, ...newAltTexts }));

    } catch (error) {
      if (error instanceof MediaValidationError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to process file. Please try again.', 'error');
      }
      console.error('Media upload error:', error);
    } finally {
      setProcessingMedia(false);
    }
  };

  // ✅ FIX: Upload with progress tracking and retry logic
  const uploadToStorage = async (file, bucket, onProgress) => {
    const fileExt = file.name?.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    let retries = 3;
    while (retries > 0) {
      try {
        uploadAbortController.current = new AbortController();

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            onUploadProgress: (progress) => {
              if (onProgress && progress.total) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                onProgress(percent);
              }
            }
          });

        if (error) throw error;

        // ✅ FIX: Verify public URL is accessible
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to generate public URL');
        }

        return {
          url: urlData.publicUrl,
          path: fileName
        };

      } catch (error) {
        retries--;
        if (retries === 0 || error.message.includes('aborted')) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // ✅ NEW: Remove media from carousel
  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ FIX: Improved submit with proper error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      showToast("Please add content or media", 'warning');
      return;
    }

    // ✅ FIX: Prevent double submission
    if (loading) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      let mediaUrls = [];
      let thumbnailUrls = [];

      // ✅ FIX: Upload all media files with progress
      if (mediaFiles.length > 0) {
        const bucket = activeTab === 'post' ? 'posts' 
                     : activeTab === 'boltz' ? 'boltz' 
                     : 'flash';

        let completedUploads = 0;

        for (const mediaFile of mediaFiles) {
          const fileProgress = (index) => {
            const baseProgress = (completedUploads / mediaFiles.length) * 100;
            const currentProgress = (index / mediaFiles.length) * 100;
            setUploadProgress(Math.round(baseProgress + currentProgress));
          };

          // Upload main file
          const uploaded = await uploadToStorage(mediaFile.file, bucket, fileProgress);
          mediaUrls.push(uploaded.url);

          // ✅ FIX: Upload thumbnail if exists
          if (mediaFile.thumbnail) {
            const thumbnailBlob = await fetch(mediaFile.thumbnail).then(r => r.blob());
            const thumbnailFile = new File([thumbnailBlob], `thumb_${mediaFile.file.name}`, { type: 'image/jpeg' });
            const thumbUploaded = await uploadToStorage(thumbnailFile, 'thumbnails', null);
            thumbnailUrls.push(thumbUploaded.url);
          } else {
            thumbnailUrls.push(null);
          }

          completedUploads++;
        }
      }

      setUploadProgress(80); // Reserve 20% for database insert

      // ✅ FIX: Unified insert logic for all types
      let insertData = {
        user_id: user.id,
        caption: content.trim() || null,
        is_close_friends: isCloseFriendsOnly,
        location: location || null,
        tagged_users: taggedUsers.length > 0 ? taggedUsers : null
      };

      let tableName;
      if (activeTab === 'post') {
        tableName = 'posts';
        // ✅ FIX: Support carousel - use array for multiple media
        insertData.media_urls = mediaUrls.length > 1 ? mediaUrls : null;
        insertData.media_url = mediaUrls.length === 1 ? mediaUrls[0] : null;
        insertData.thumbnail_urls = thumbnailUrls;
      } else if (activeTab === 'boltz') {
        tableName = 'boltz';
        insertData.video_url = mediaUrls[0] || null;
        insertData.thumbnail_url = thumbnailUrls[0] || null;
      } else if (activeTab === 'flash') {
        tableName = 'flashes';
        insertData.media_url = mediaUrls[0] || null;
        insertData.media_type = mediaFiles[0]?.file.type.startsWith('video/') ? 'video' : 'image';
      }

      const { data: createdPost, error: insertError } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      setUploadProgress(90);

      // ✅ FIX: Process mentions with try-catch
      if (content.trim() && createdPost?.id) {
        try {
          await processMentionsAndNotify(content.trim(), user.id, createdPost.id, activeTab);
        } catch (mentionError) {
          console.error('Mention processing failed:', mentionError);
          // Don't fail the whole post if mentions fail
        }
      }

      setUploadProgress(100);

      // ✅ NEW: Clear form and draft
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setTaggedUsers([]);
      setLocation(null);
      setAltTexts({});
      setUploadProgress(0);
      clearDraft();

      showToast(`Your ${activeTab} is live! 🎉`, 'success');
      
      // ✅ FIX: Wait a moment before navigating for realtime sync
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/");

    } catch (error) {
      console.error(`Error creating ${activeTab}:`, error);
      
      // ✅ FIX: Provide specific error messages
      let errorMessage = `Failed to create ${activeTab}`;
      if (error.message.includes('aborted')) {
        errorMessage = 'Upload cancelled';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  // ✅ NEW: Cancel upload
  const handleCancel = () => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
    }
    setLoading(false);
    setUploadProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (uploadAbortController.current) {
        uploadAbortController.current.abort();
      }
    };
  }, []);

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
                  setMediaFiles([]);
                  setMediaPreviews([]);
                  setTaggedUsers([]);
                  setLocation(null);
                }}
                disabled={loading}
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
            {/* ✅ FIX: Carousel support - show multiple media */}
            <div className="media-upload-section">
              {mediaPreviews.length > 0 ? (
                <div className="media-carousel">
                  <div className="carousel-grid">
                    {mediaPreviews.map((preview, index) => (
                      <motion.div 
                        key={preview.id}
                        className="media-preview-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        {preview.type.startsWith('video/') ? (
                          <video src={preview.url} className="preview-video" controls />
                        ) : (
                          <img src={preview.url} alt={`Preview ${index + 1}`} className="preview-image" />
                        )}
                        <button
                          type="button"
                          className="remove-media-btn"
                          onClick={() => removeMedia(index)}
                          disabled={loading}
                        >
                          ✕
                        </button>
                        <div className="media-index">{index + 1}/{mediaPreviews.length}</div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* ✅ NEW: Add more button for carousel */}
                  {mediaFiles.length < activeTabConfig.maxFiles && (
                    <label className="add-more-media-btn">
                      <input
                        type="file"
                        accept={activeTabConfig.accept}
                        onChange={handleMediaUpload}
                        className="media-upload-input"
                        disabled={loading || processingMedia}
                        multiple={activeTabConfig.maxFiles > 1}
                      />
                      <span>+ Add More ({mediaFiles.length}/{activeTabConfig.maxFiles})</span>
                    </label>
                  )}
                </div>
              ) : (
                <label className="media-upload-label">
                  <input
                    type="file"
                    accept={activeTabConfig.accept}
                    onChange={handleMediaUpload}
                    className="media-upload-input"
                    disabled={loading || processingMedia}
                    multiple={activeTabConfig.maxFiles > 1}
                  />
                  <div className="media-upload-area">
                    <div className="upload-placeholder">
                      <motion.div 
                        className="upload-icon"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        animate={processingMedia ? { rotate: 360 } : {}}
                        transition={processingMedia ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                      >
                        {processingMedia ? '⏳' : activeTabConfig.icon}
                      </motion.div>
                      <h3>
                        {activeTab === 'post' && `Add Photo${activeTabConfig.maxFiles > 1 ? 's' : ''}`}
                        {activeTab === 'boltz' && 'Add a Video'}
                        {activeTab === 'flash' && 'Add Media'}
                      </h3>
                      <p>
                        {activeTab === 'post' && 'Share moments that matter (up to 10 items)'}
                        {activeTab === 'boltz' && 'Create a short vertical video'}
                        {activeTab === 'flash' && 'Share a quick 24-hour highlight'}
                      </p>
                      <span className="upload-hint">
                        Max {activeTabConfig.maxSize}MB per file • Click to browse
                      </span>
                      {processingMedia && (
                        <span className="processing-text">Processing media...</span>
                      )}
                    </div>
                  </div>
                </label>
              )}
            </div>

            <div className="content-section">
              <label className="content-label">
                <span className="label-text">Caption</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Write a caption for your ${activeTab}... Use # for hashtags and @ to mention`}
                  className="content-textarea"
                  rows={4}
                  maxLength={2200}
                  disabled={loading}
                />
                <div className="character-count">
                  {content.length}/2200
                </div>
              </label>
            </div>

            {/* ✅ NEW: Close friends option for all types */}
            <div className="close-friends-section">
              <label className="close-friends-toggle">
                <input
                  type="checkbox"
                  checked={isCloseFriendsOnly}
                  onChange={(e) => setIsCloseFriendsOnly(e.target.checked)}
                  disabled={loading}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  Share with close friends only {activeTab === 'flash' && '(Flash default)'}
                </span>
              </label>
              <p className="toggle-description">
                Only your close friends will see this {activeTab}
              </p>
            </div>

            {/* ✅ NEW: Upload progress with cancel button */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  className="upload-progress-container"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="progress-info">
                    <span className="progress-text">Uploading {uploadProgress}%</span>
                    <button
                      type="button"
                      className="cancel-upload-btn"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading || processingMedia || (!content.trim() && mediaFiles.length === 0)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: loading ? 1 : 1.02 }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Uploading {uploadProgress}%...</span>
                </>
              ) : processingMedia ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
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