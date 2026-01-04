import React, { useState } from 'react';
import useImageUpload from '../hooks/useImageUpload';
import useVideoUpload from '../hooks/useVideoUpload';
import './MediaUploadDemo.css';

/**
 * MediaUploadDemo Component
 * 
 * Demonstrates usage of useImageUpload and useVideoUpload hooks
 * Shows all features including progress tracking, thumbnails, and error handling
 */
const MediaUploadDemo = () => {
  const [activeTab, setActiveTab] = useState('image');

  // Image upload hook
  const {
    uploadImage,
    uploadMultipleImages,
    uploadProgress: imageProgress,
    uploadedUrl: imageUrl,
    thumbnailUrl: imageThumbnail,
    error: imageError,
    isUploading: isImageUploading,
    cancelUpload: cancelImageUpload,
    reset: resetImage
  } = useImageUpload({
    bucket: 'posts',
    compressionOptions: {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1920
    },
    generateThumb: true,
    thumbnailSize: 150
  });

  // Video upload hook
  const {
    uploadVideo,
    uploadProgress: videoProgress,
    uploadedUrl: videoUrl,
    thumbnailUrl: videoThumbnail,
    error: videoError,
    isUploading: isVideoUploading,
    uploadSpeed,
    formatSpeed,
    formatTimeRemaining,
    cancelUpload: cancelVideoUpload,
    reset: resetVideo
  } = useVideoUpload({
    bucket: 'posts',
    generateThumb: true,
    thumbnailTime: 1
  });

  // State for multiple images
  const [uploadedImages, setUploadedImages] = useState([]);

  /**
   * Handle single image upload
   */
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await uploadImage(file);
      console.log('Image uploaded successfully:', result);
      alert(`Image uploaded! Compression: ${result.compressionRatio}% reduction`);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };

  /**
   * Handle multiple images upload
   */
  const handleMultipleImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const results = await uploadMultipleImages(files);
      const successful = results.filter(r => r.success);
      setUploadedImages(prev => [...prev, ...successful]);
      
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        alert(`${successful.length} uploaded, ${failed.length} failed`);
      } else {
        alert(`All ${successful.length} images uploaded successfully!`);
      }
    } catch (err) {
      console.error('Multiple upload failed:', err);
    }
  };

  /**
   * Handle video upload
   */
  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await uploadVideo(file);
      console.log('Video uploaded successfully:', result);
      alert('Video uploaded successfully!');
    } catch (err) {
      console.error('Video upload failed:', err);
    }
  };

  /**
   * Render image upload section
   */
  const renderImageUpload = () => (
    <div className="upload-section">
      <h2>Image Upload</h2>
      
      {/* Single Image Upload */}
      <div className="upload-box">
        <h3>Single Image</h3>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isImageUploading}
          id="single-image-input"
        />
        <label htmlFor="single-image-input" className="file-input-label">
          {isImageUploading ? 'Uploading...' : 'Choose Image'}
        </label>

        {/* Progress */}
        {isImageUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${imageProgress}%` }}
              />
            </div>
            <p className="progress-text">{imageProgress}%</p>
            <button onClick={cancelImageUpload} className="btn-cancel">
              Cancel
            </button>
          </div>
        )}

        {/* Error */}
        {imageError && (
          <div className="error-message">
            <p>❌ {imageError}</p>
            <button onClick={resetImage} className="btn-reset">
              Try Again
            </button>
          </div>
        )}

        {/* Result */}
        {imageUrl && (
          <div className="upload-result">
            <h4>✅ Upload Complete</h4>
            <div className="image-preview">
              {imageThumbnail && (
                <div className="thumbnail">
                  <p>Thumbnail:</p>
                  <img src={imageThumbnail} alt="Thumbnail" />
                </div>
              )}
              <div className="full-image">
                <p>Full Image:</p>
                <img src={imageUrl} alt="Uploaded" />
              </div>
            </div>
            <button onClick={resetImage} className="btn-reset">
              Upload Another
            </button>
          </div>
        )}
      </div>

      {/* Multiple Images Upload */}
      <div className="upload-box">
        <h3>Multiple Images</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleMultipleImagesUpload}
          disabled={isImageUploading}
          id="multiple-images-input"
        />
        <label htmlFor="multiple-images-input" className="file-input-label">
          {isImageUploading ? 'Uploading...' : 'Choose Multiple Images'}
        </label>

        {/* Progress */}
        {isImageUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${imageProgress}%` }}
              />
            </div>
            <p className="progress-text">{imageProgress}%</p>
          </div>
        )}

        {/* Gallery */}
        {uploadedImages.length > 0 && (
          <div className="image-gallery">
            <h4>Uploaded Images ({uploadedImages.length})</h4>
            <div className="gallery-grid">
              {uploadedImages.map((img, index) => (
                <div key={index} className="gallery-item">
                  <img src={img.thumbnailUrl || img.url} alt={`Upload ${index + 1}`} />
                  <p className="compression-info">
                    {img.compressionRatio}% smaller
                  </p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setUploadedImages([])} 
              className="btn-clear"
            >
              Clear Gallery
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render video upload section
   */
  const renderVideoUpload = () => (
    <div className="upload-section">
      <h2>Video Upload</h2>
      
      <div className="upload-box">
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          disabled={isVideoUploading}
          id="video-input"
        />
        <label htmlFor="video-input" className="file-input-label">
          {isVideoUploading ? 'Uploading...' : 'Choose Video'}
        </label>

        {/* Progress with Speed */}
        {isVideoUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
            <div className="upload-stats">
              <p className="progress-text">{videoProgress}%</p>
              <p className="upload-speed">Speed: {formatSpeed()}</p>
              <p className="time-remaining">
                Time remaining: {formatTimeRemaining() || 'Calculating...'}
              </p>
            </div>
            <button onClick={cancelVideoUpload} className="btn-cancel">
              Cancel
            </button>
          </div>
        )}

        {/* Error */}
        {videoError && (
          <div className="error-message">
            <p>❌ {videoError}</p>
            <button onClick={resetVideo} className="btn-reset">
              Try Again
            </button>
          </div>
        )}

        {/* Result */}
        {videoUrl && (
          <div className="upload-result">
            <h4>✅ Upload Complete</h4>
            <div className="video-preview">
              {videoThumbnail && (
                <div className="thumbnail">
                  <p>Thumbnail:</p>
                  <img src={videoThumbnail} alt="Video Thumbnail" />
                </div>
              )}
              <div className="video-player">
                <p>Video:</p>
                <video src={videoUrl} controls width="100%" />
              </div>
            </div>
            <button onClick={resetVideo} className="btn-reset">
              Upload Another
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="media-upload-demo">
      <h1>📤 Media Upload Demo</h1>
      <p className="subtitle">
        Demonstrating useImageUpload and useVideoUpload hooks
      </p>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'image' ? 'active' : ''}`}
          onClick={() => setActiveTab('image')}
        >
          🖼️ Image Upload
        </button>
        <button
          className={`tab ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          🎥 Video Upload
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'image' ? renderImageUpload() : renderVideoUpload()}
      </div>

      {/* Features List */}
      <div className="features-list">
        <h3>Features</h3>
        <ul>
          <li>✅ Image compression and resizing</li>
          <li>✅ Automatic thumbnail generation</li>
          <li>✅ Progress tracking with percentage</li>
          <li>✅ Upload speed and time remaining (video)</li>
          <li>✅ Multiple image uploads</li>
          <li>✅ Cancel ongoing uploads</li>
          <li>✅ Error handling and validation</li>
          <li>✅ Supabase Storage integration</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploadDemo;
