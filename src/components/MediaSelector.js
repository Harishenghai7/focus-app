import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, generateMultipleThumbnails, getCompressionStats } from '../utils/imageCompression';
import './MediaSelector.css';

export default function MediaSelector({ 
  selectedMedia = [], 
  onMediaChange, 
  maxItems = 10 
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

  const validateFile = (file) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return { valid: false, error: `${file.name}: Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV) are allowed.` };
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return { valid: false, error: `${file.name}: Image too large. Maximum size is 10MB.` };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return { valid: false, error: `${file.name}: Video too large. Maximum size is 100MB.` };
    }

    return { valid: true, type: isImage ? 'image' : 'video' };
  };

  const processFiles = useCallback(async (files) => {
    setError('');
    setCompressionProgress({ current: 0, total: files.length, currentFile: '' });
    
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed max items
    if (selectedMedia.length + fileArray.length > maxItems) {
      setError(`Cannot add ${fileArray.length} files. Maximum ${maxItems} items allowed (currently have ${selectedMedia.length}).`);
      setCompressionProgress(null);
      return;
    }

    const newMedia = [];
    const errors = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      
      setCompressionProgress({
        current: i + 1,
        total: fileArray.length,
        currentFile: file.name,
        progress: 0
      });
      
      // Check for duplicates
      const isDuplicate = selectedMedia.some(m => 
        m.file.name === file.name && m.file.size === file.size
      );

      if (isDuplicate) {
        errors.push(`${file.name}: Already selected`);
        continue;
      }

      const validation = validateFile(file);
      
      if (!validation.valid) {
        errors.push(validation.error);
        continue;
      }

      let processedFile = file;
      let thumbnails = null;
      let compressionStats = null;

      // Compress images
      if (validation.type === 'image') {
        try {
          // Compress main image
          const compressed = await compressImage(file, {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1920
          }, (progress) => {
            setCompressionProgress({
              current: i + 1,
              total: fileArray.length,
              currentFile: file.name,
              progress
            });
          });

          compressionStats = getCompressionStats(file, compressed);
          processedFile = compressed;

          // Generate thumbnails (150x150 and 640x640)
          thumbnails = await generateMultipleThumbnails(compressed, [150, 640]);
        } catch (error) {
          console.error(`Failed to compress ${file.name}:`, error);
          errors.push(`${file.name}: Compression failed, using original`);
          // Use original file if compression fails
          processedFile = file;
        }
      }

      // Create preview URL
      const url = URL.createObjectURL(processedFile);
      
      newMedia.push({
        url,
        type: validation.type,
        file: processedFile,
        originalFile: file,
        thumbnails,
        compressionStats,
        id: `${Date.now()}-${Math.random()}-${i}`
      });
    }

    setCompressionProgress(null);

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (newMedia.length > 0) {
      onMediaChange([...selectedMedia, ...newMedia]);
    }
  }, [selectedMedia, maxItems, onMediaChange]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleRemove = (id) => {
    const updated = selectedMedia.filter(m => m.id !== id);
    onMediaChange(updated);
    
    // Revoke object URL to free memory
    const removed = selectedMedia.find(m => m.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.url);
    }
  };

  const handleReorder = (fromIndex, toIndex) => {
    const updated = [...selectedMedia];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onMediaChange(updated);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropItem = (e, toIndex) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/html'));
    if (fromIndex !== toIndex) {
      handleReorder(fromIndex, toIndex);
    }
  };

  return (
    <div className="media-selector">
      {/* File Input Area */}
      <div
        className={`media-selector-dropzone ${dragOver ? 'drag-over' : ''} ${selectedMedia.length >= maxItems ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => selectedMedia.length < maxItems && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={selectedMedia.length >= maxItems}
        />
        
        <div className="dropzone-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <p className="dropzone-title">
            {selectedMedia.length >= maxItems 
              ? `Maximum ${maxItems} items reached`
              : 'Add Photos or Videos'
            }
          </p>
          <p className="dropzone-subtitle">
            {selectedMedia.length < maxItems && 'Click to browse or drag and drop'}
          </p>
          <p className="dropzone-counter">
            {selectedMedia.length}/{maxItems} items
          </p>
        </div>
      </div>

      {/* Compression Progress */}
      {compressionProgress && (
        <motion.div 
          className="media-selector-progress"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="progress-header">
            <span className="progress-icon">⚙️</span>
            <span className="progress-text">
              Compressing {compressionProgress.current} of {compressionProgress.total}
            </span>
          </div>
          <div className="progress-filename">{compressionProgress.currentFile}</div>
          <div className="progress-bar-container">
            <motion.div 
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${compressionProgress.progress || 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="progress-percentage">{compressionProgress.progress || 0}%</div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div 
          className="media-selector-error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <pre>{error}</pre>
          <button onClick={() => setError('')}>×</button>
        </motion.div>
      )}

      {/* Selected Media Grid */}
      {selectedMedia.length > 0 && (
        <div className="media-selector-grid">
          <AnimatePresence>
            {selectedMedia.map((media, index) => (
              <motion.div
                key={media.id}
                className="media-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOverItem(e, index)}
                onDrop={(e) => handleDropItem(e, index)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Media Preview */}
                <div className="media-preview">
                  {media.type === 'video' ? (
                    <video src={media.url} className="media-thumbnail" />
                  ) : (
                    <img src={media.url} alt={`Selected ${index + 1}`} className="media-thumbnail" />
                  )}
                  
                  {/* Media Type Badge */}
                  <div className="media-type-badge">
                    {media.type === 'video' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                    )}
                  </div>

                  {/* Position Number */}
                  <div className="media-position">{index + 1}</div>

                  {/* Remove Button */}
                  <button
                    className="media-remove"
                    onClick={() => handleRemove(media.id)}
                    aria-label="Remove"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* File Info */}
                <div className="media-info">
                  <p className="media-filename">{media.file.name}</p>
                  <p className="media-filesize">
                    {(media.file.size / 1024 / 1024).toFixed(2)} MB
                    {media.compressionStats && (
                      <span className="compression-badge" title={`Saved ${media.compressionStats.savedPercentage}%`}>
                        ⚡ -{media.compressionStats.savedPercentage}%
                      </span>
                    )}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Helper Text */}
      {selectedMedia.length > 0 && (
        <p className="media-selector-hint">
          💡 Drag items to reorder • Maximum {maxItems} items • Images up to 10MB • Videos up to 100MB
        </p>
      )}
    </div>
  );
}
