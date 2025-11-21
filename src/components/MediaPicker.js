import React, { useRef, useState } from 'react';
import './MediaPicker.css';

const MediaPicker = ({ type, files, onFilesSelected, onFileRemove, maxFiles = 10 }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const acceptedTypes = type === 'boltz' 
    ? 'video/*'
    : 'image/*,video/*';

  const maxFilesAllowed = type === 'post' ? 10 : 1;

  const validateFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    const errors = [];

    // Check file count
    if (files.length + newFiles.length > maxFilesAllowed) {
      errors.push(`Maximum ${maxFilesAllowed} file(s) allowed`);
    }

    // Check each file
    newFiles.forEach(file => {
      // Size check (100MB)
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 100MB limit`);
      }

      // Type check for Boltz
      if (type === 'boltz' && !file.type.startsWith('video/')) {
        errors.push('Boltz only supports video files');
      }

      // Type check general
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        errors.push(`${file.name} is not a supported file type`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const validation = validateFiles(droppedFiles);
      if (validation.valid) {
        onFilesSelected(Array.from(droppedFiles));
      } else {
        setError(validation.errors[0]);
      }
    }
  };

  const handleFileInput = (e) => {
    setError(null);
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const validation = validateFiles(selectedFiles);
      if (validation.valid) {
        onFilesSelected(Array.from(selectedFiles));
      } else {
        setError(validation.errors[0]);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getMediaPreview = (file) => {
    if (file.preview) return file.preview;
    return URL.createObjectURL(file);
  };

  return (
    <div className="media-picker-container" role="region" aria-label="Media upload">
      <div className="media-picker-header">
        <h2>Upload Your Media</h2>
        <p>
          {type === 'post' && 'Add up to 10 photos or videos'}
          {type === 'boltz' && 'Add a video (15-60 seconds)'}
          {type === 'flash' && 'Add a photo or video'}
        </p>
      </div>

      {files.length === 0 ? (
        <div
          className={`media-dropzone ${dragActive ? 'drag-active' : ''} ${error ? 'error' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Click or drag files to upload"
          onClick={handleButtonClick}
          onKeyPress={(e) => e.key === 'Enter' && handleButtonClick()}
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">
              {type === 'boltz' ? '🎬' : '📸'}
            </div>
            <h3>Drag & drop your {type === 'boltz' ? 'video' : 'media'} here</h3>
            <p>or</p>
            <button className="upload-button" type="button">
              Browse Files
            </button>
            <div className="dropzone-info">
              <span>Max file size: 100MB</span>
              {type === 'post' && <span>Up to 10 files</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="media-preview-grid">
          {files.map((file, index) => {
            const isVideo = file.type.startsWith('video/');
            return (
              <div key={index} className="media-preview-item">
                {isVideo ? (
                  <video 
                    src={getMediaPreview(file)} 
                    className="preview-media"
                    muted
                  />
                ) : (
                  <img 
                    src={getMediaPreview(file)} 
                    alt={`Preview ${index + 1}`}
                    className="preview-media"
                  />
                )}
                <button
                  className="remove-media-btn"
                  onClick={() => onFileRemove(index)}
                  aria-label={`Remove file ${index + 1}`}
                  type="button"
                >
                  ✕
                </button>
                {isVideo && <div className="video-indicator">🎥</div>}
              </div>
            );
          })}
          
          {files.length < maxFilesAllowed && type === 'post' && (
            <button 
              className="add-more-btn"
              onClick={handleButtonClick}
              type="button"
              aria-label="Add more files"
            >
              <span className="add-icon">+</span>
              <span>Add More</span>
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="media-error" role="alert">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple={type === 'post'}
        accept={acceptedTypes}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
};

export default MediaPicker;
