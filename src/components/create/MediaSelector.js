/**
 * MediaSelector Component
 * 
 * Allows users to select photos/videos from their device
 * Supports:
 * - Multiple file selection
 * - Drag and drop
 * - Camera access
 * - File validation
 * - Preview thumbnails
 */

import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './MediaSelector.css';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const MediaSelector = ({ 
  onSelect, 
  maxFiles = MAX_FILES, 
  allowMultiple = true,
  acceptVideo = true,
  acceptImage = true 
}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Get accepted file types
  const getAcceptedTypes = () => {
    const types = [];
    if (acceptImage) types.push(...ACCEPTED_IMAGE_TYPES);
    if (acceptVideo) types.push(...ACCEPTED_VIDEO_TYPES);
    return types.join(',');
  };

  // Validate file
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} is too large. Max size is 100MB.`;
    }

    const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);
    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return `File ${file.name} is not a supported format.`;
    }

    if (isImage && !acceptImage) {
      return 'Images are not allowed for this content type.';
    }

    if (isVideo && !acceptVideo) {
      return 'Videos are not allowed for this content type.';
    }

    return null;
  };

  // Generate preview for file
  const generatePreview = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (file.type.startsWith('image/')) {
          resolve({
            type: 'image',
            url: e.target.result,
            file
          });
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            video.currentTime = 1;
          };
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve({
              type: 'video',
              url: canvas.toDataURL(),
              videoUrl: e.target.result,
              duration: video.duration,
              file
            });
          };
          video.src = e.target.result;
        }
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles) => {
    setError(null);

    const fileArray = Array.from(selectedFiles);
    const totalFiles = files.length + fileArray.length;

    if (totalFiles > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    // Validate all files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Generate previews
    try {
      const newPreviews = await Promise.all(fileArray.map(generatePreview));
      const updatedFiles = [...files, ...fileArray];
      const updatedPreviews = [...previews, ...newPreviews];

      setFiles(updatedFiles);
      setPreviews(updatedPreviews);

      if (onSelect) {
        onSelect(updatedPreviews);
      }
    } catch (err) {
      console.error('Error generating previews:', err);
      setError('Failed to load selected files.');
    }
  }, [files, previews, maxFiles, onSelect, validateFile]);

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // Remove file
  const handleRemove = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);

    if (onSelect) {
      onSelect(updatedPreviews);
    }
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Open camera (for mobile)
  const openCamera = () => {
    videoInputRef.current?.click();
  };

  return (
    <div className="media-selector">
      {error && (
        <motion.div
          className="media-selector-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </motion.div>
      )}

      {previews.length === 0 ? (
        <div
          className={`media-selector-dropzone ${dragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <div className="dropzone-content">
            <span className="dropzone-icon">📁</span>
            <h3>Drag and drop files here</h3>
            <p>or click to browse</p>
            <div className="dropzone-buttons">
              <button type="button" className="btn-primary">
                Choose Files
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  openCamera();
                }}
              >
                📷 Camera
              </button>
            </div>
            <p className="dropzone-hint">
              {acceptImage && acceptVideo && 'Photos and videos'}
              {acceptImage && !acceptVideo && 'Photos only'}
              {!acceptImage && acceptVideo && 'Videos only'}
              {' '}• Max {maxFiles} files • Up to 100MB each
            </p>
          </div>
        </div>
      ) : (
        <div className="media-selector-previews">
          <AnimatePresence>
            {previews.map((preview, index) => (
              <motion.div
                key={index}
                className="preview-item"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {preview.type === 'image' ? (
                  <img src={preview.url} alt={`Preview ${index + 1}`} />
                ) : (
                  <div className="video-preview">
                    <img src={preview.url} alt={`Video preview ${index + 1}`} />
                    <div className="video-overlay">
                      <span className="video-icon">▶️</span>
                      <span className="video-duration">
                        {Math.floor(preview.duration)}s
                      </span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="preview-remove"
                  onClick={() => handleRemove(index)}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {allowMultiple && previews.length < maxFiles && (
            <motion.div
              className="preview-add"
              onClick={openFilePicker}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="add-icon">+</span>
              <span className="add-text">Add more</span>
            </motion.div>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedTypes()}
        multiple={allowMultiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

MediaSelector.propTypes = {
  onSelect: PropTypes.func,
  maxFiles: PropTypes.number,
  allowMultiple: PropTypes.bool,
  acceptVideo: PropTypes.bool,
  acceptImage: PropTypes.bool,
};

export default MediaSelector;
