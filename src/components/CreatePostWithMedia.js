import React, { useState } from 'react';
import useImageUpload from '../hooks/useImageUpload';
import useVideoUpload from '../hooks/useVideoUpload';
import GifPicker from './GifPicker';

/**
 * CreatePostWithMedia Component
 * 
 * Real-world example of using useImageUpload and useVideoUpload
 * in a post creation flow
 */
const CreatePostWithMedia = () => {
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Image upload hook
  const {
    uploadImage,
    uploadProgress: imageProgress,
    uploadedUrl: imageUrl,
    thumbnailUrl: imageThumbnail,
    error: imageError,
    isUploading: isImageUploading
  } = useImageUpload({
    bucket: 'posts',
    compressionOptions: {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1920
    }
  });

  // Video upload hook
  const {
    uploadVideo,
    uploadProgress: videoProgress,
    uploadedUrl: videoUrl,
    thumbnailUrl: videoThumbnail,
    error: videoError,
    isUploading: isVideoUploading,
    formatSpeed,
    formatTimeRemaining
  } = useVideoUpload({
    bucket: 'posts',
    generateThumb: true
  });

  /**
   * Handle file selection
   */
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Determine media type
    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  /**
   * Handle media upload
   */
  const handleUpload = async () => {
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput?.files[0];
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    try {
      let result;
      
      if (mediaType === 'image') {
        result = await uploadImage(file);
      } else {
        result = await uploadVideo(file);
      }

      console.log('Upload complete:', result);
      
      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      return result;
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
    }
  };

  /**
   * Handle post creation
   */
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!caption.trim()) {
      alert('Please add a caption');
      return;
    }

    // Upload media first
    const uploadResult = await handleUpload();
    
    if (!uploadResult) {
      return; // Upload failed
    }

    // Create post with uploaded media
    const postData = {
      caption: caption.trim(),
      mediaType,
      mediaUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      createdAt: new Date().toISOString()
    };

    console.log('Creating post:', postData);

    // Here you would call your API to create the post
    // await createPost(postData);

    alert('Post created successfully!');
    
    // Reset form
    setCaption('');
    setMediaType('image');
    setPreviewUrl(null);
  };

  /**
   * Handle GIF select -> append URL into caption
   */
  const handleGifSelect = (gif) => {
    const url = gif?.url || gif?.previewUrl;
    if (!url) { setShowGifPicker(false); return; }
    setCaption(prev => (prev ? prev + ' ' : '') + url);
    setShowGifPicker(false);
  };

  const isUploading = isImageUploading || isVideoUploading;
  const uploadProgress = mediaType === 'image' ? imageProgress : videoProgress;
  const error = imageError || videoError;
  const uploadedUrl = imageUrl || videoUrl;

  return (
    <div className="create-post-container">
      {/* GIF Picker Modal */}
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
        provider="tenor"
      />

      <h2>Create New Post</h2>

      <form onSubmit={handleCreatePost}>
        {/* Caption Input */}
        <div className="form-group">
          <label htmlFor="caption">Caption</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <button type="button" onClick={() => setShowGifPicker(true)} title="Insert GIF" aria-label="Insert GIF" style={{
              padding: '6px 10px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#f6f7fb', cursor: 'pointer'
            }}>GIF</button>
          </div>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={4}
            disabled={isUploading}
          />
        </div>

        {/* File Upload */}
        <div className="form-group">
          <label htmlFor="media">Upload Media</label>
          <input
            id="media"
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>

        {/* Preview */}
        {previewUrl && !uploadedUrl && (
          <div className="preview-container">
            <h4>Preview</h4>
            {mediaType === 'image' ? (
              <img src={previewUrl} alt="Preview" />
            ) : (
              <video src={previewUrl} controls />
            )}
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">
              Uploading {mediaType}: {uploadProgress}%
            </p>
            
            {mediaType === 'video' && (
              <div className="upload-stats">
                <p>Speed: {formatSpeed()}</p>
                <p>Time remaining: {formatTimeRemaining()}</p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Upload Result */}
        {uploadedUrl && (
          <div className="upload-result">
            <h4>✅ Media Uploaded Successfully</h4>
            {mediaType === 'image' ? (
              <img src={uploadedUrl} alt="Uploaded" />
            ) : (
              <video src={uploadedUrl} controls />
            )}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isUploading || !caption.trim()}
          className="btn-submit"
        >
          {isUploading ? `Uploading ${uploadProgress}%...` : 'Create Post'}
        </button>
      </form>

      <style jsx>{`
        .create-post-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        h2 {
          font-size: 1.8rem;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #667eea;
        }

        input[type="file"] {
          width: 100%;
          padding: 0.75rem;
          border: 2px dashed #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
        }

        .preview-container,
        .upload-result {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .preview-container h4,
        .upload-result h4 {
          margin-bottom: 1rem;
          color: #333;
        }

        .preview-container img,
        .preview-container video,
        .upload-result img,
        .upload-result video {
          max-width: 100%;
          border-radius: 8px;
        }

        .upload-progress {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f0f8ff;
          border-radius: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 30px;
          background: #e0e0e0;
          border-radius: 15px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .progress-text {
          text-align: center;
          font-weight: 600;
          color: #667eea;
          margin: 0.5rem 0;
        }

        .upload-stats {
          margin-top: 0.5rem;
          text-align: center;
          color: #666;
        }

        .upload-stats p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .error-message {
          margin: 1rem 0;
          padding: 1rem;
          background: #fff3f3;
          border: 2px solid #ff4444;
          border-radius: 8px;
        }

        .error-message p {
          color: #cc0000;
          font-weight: 600;
          margin: 0;
        }

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-submit:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default CreatePostWithMedia;
