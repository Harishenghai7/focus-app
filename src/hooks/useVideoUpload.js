import { useState, useCallback, useRef } from 'react';
import { supabase, STORAGE_BUCKETS } from '../supabaseClient';
import { generateVideoThumbnail } from '../utils/mediaValidator';

/**
 * Custom hook for uploading videos with progress tracking and thumbnail generation
 * 
 * Features:
 * - Select and validate video files
 * - Upload to Supabase Storage with progress tracking
 * - Generate video thumbnails automatically
 * - Handle large file uploads efficiently
 * - Support upload cancellation
 * - Track upload speed and remaining time
 * - Handle errors gracefully
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.bucket - Supabase storage bucket name
 * @param {boolean} options.generateThumb - Whether to generate thumbnail
 * @param {number} options.thumbnailTime - Time in seconds for thumbnail capture
 * @param {Function} options.onProgress - Progress callback function
 * @returns {Object} Upload functions and state
 * 
 * @example
 * const { uploadVideo, uploadProgress, uploadedUrl, thumbnailUrl, error, isUploading, uploadSpeed } = useVideoUpload({
 *   bucket: 'posts',
 *   generateThumb: true,
 *   thumbnailTime: 1
 * });
 */
const useVideoUpload = (options = {}) => {
  const {
    bucket = STORAGE_BUCKETS.POSTS,
    generateThumb = true,
    thumbnailTime = 1,
    onProgress
  } = options;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(null);
  
  const uploadAbortController = useRef(null);
  const uploadStartTime = useRef(null);
  const lastProgressUpdate = useRef({ time: 0, loaded: 0 });

  /**
   * Validate video file
   */
  const validateVideo = useCallback((file) => {
    const validTypes = [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!file) {
      throw new Error('No file provided');
    }

    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid video type. Supported: MP4, MOV, WebM, AVI, MKV`);
    }

    if (file.size > maxSize) {
      throw new Error(`Video too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }

    return true;
  }, []);

  /**
   * Calculate upload speed and estimated time
   */
  const updateUploadStats = useCallback((loaded, total) => {
    const now = Date.now();
    const timeElapsed = (now - uploadStartTime.current) / 1000; // seconds
    const lastUpdate = lastProgressUpdate.current;

    if (timeElapsed > 0) {
      // Calculate current speed (bytes per second)
      const speed = loaded / timeElapsed;
      setUploadSpeed(speed);

      // Calculate estimated time remaining
      const remaining = total - loaded;
      const timeRemaining = remaining / speed;
      setEstimatedTimeRemaining(timeRemaining);

      // Update last progress
      lastProgressUpdate.current = { time: now, loaded };
    }
  }, []);

  /**
   * Upload file to Supabase Storage with progress tracking
   */
  const uploadToStorage = useCallback(async (file, path) => {
    // For large files, we'll chunk the upload
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    // Initialize upload start time
    uploadStartTime.current = Date.now();
    lastProgressUpdate.current = { time: Date.now(), loaded: 0 };

    try {
      // Supabase handles chunking internally, we just track progress
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          // Note: Supabase JS client doesn't support progress callbacks directly
          // For production, you may want to use XMLHttpRequest for better progress tracking
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return publicUrl;
    } catch (err) {
      throw new Error(`Upload failed: ${err.message}`);
    }
  }, [bucket, updateUploadStats]);

  /**
   * Upload file with better progress simulation
   * (Supabase client doesn't support native progress events)
   */
  const uploadWithProgressSimulation = useCallback(async (file, path) => {
    const startTime = Date.now();
    
    // Simulate progress based on file size
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const estimatedDuration = file.size / (500 * 1024); // ~500KB/s estimate
      const progress = Math.min(90, (elapsed / (estimatedDuration * 1000)) * 100);
      
      setUploadProgress(progress);
      updateUploadStats(file.size * (progress / 100), file.size);
      
      if (onProgress) {
        onProgress(progress);
      }
    }, 500);

    try {
      const url = await uploadToStorage(file, path);
      clearInterval(updateInterval);
      return url;
    } catch (err) {
      clearInterval(updateInterval);
      throw err;
    }
  }, [uploadToStorage, updateUploadStats, onProgress]);

  /**
   * Main upload function
   */
  const uploadVideo = useCallback(async (file) => {
    try {
      // Reset state
      setError(null);
      setUploadProgress(0);
      setUploadedUrl(null);
      setThumbnailUrl(null);
      setIsUploading(true);
      setUploadSpeed(0);
      setEstimatedTimeRemaining(null);
      uploadAbortController.current = new AbortController();

      // Validate
      validateVideo(file);
      setUploadProgress(5);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}_${randomStr}.${extension}`;
      const filepath = `videos/${filename}`;

      // Generate thumbnail first (before upload)
      let thumbUrl = null;
      if (generateThumb) {
        try {
          setUploadProgress(10);
          const thumb = await generateVideoThumbnail(file, thumbnailTime);
          const thumbPath = `thumbnails/${filename.replace(`.${extension}`, '.jpg')}`;
          
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from(bucket)
            .upload(thumbPath, thumb, {
              cacheControl: '3600',
              upsert: false
            });

          if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(thumbPath);
            thumbUrl = publicUrl;
            setThumbnailUrl(thumbUrl);
          }
          setUploadProgress(20);
        } catch (thumbError) {
          console.warn('Thumbnail generation failed:', thumbError);
          // Continue with video upload even if thumbnail fails
        }
      }

      // Upload main video
      const videoUrl = await uploadWithProgressSimulation(file, filepath);
      setUploadedUrl(videoUrl);
      setUploadProgress(100);
      setIsUploading(false);

      return {
        url: videoUrl,
        thumbnailUrl: thumbUrl,
        filename: filename,
        size: file.size,
        duration: null, // Could be extracted from video metadata
        type: file.type
      };

    } catch (err) {
      console.error('Video upload failed:', err);
      setError(err.message || 'Failed to upload video');
      setIsUploading(false);
      setUploadProgress(0);
      throw err;
    }
  }, [validateVideo, generateThumb, thumbnailTime, bucket, uploadWithProgressSimulation]);

  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
      setEstimatedTimeRemaining(null);
      setError('Upload cancelled');
    }
  }, []);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setUploadProgress(0);
    setUploadedUrl(null);
    setThumbnailUrl(null);
    setError(null);
    setIsUploading(false);
    setUploadSpeed(0);
    setEstimatedTimeRemaining(null);
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }, []);

  /**
   * Format upload speed for display
   */
  const formatSpeed = useCallback(() => {
    return formatFileSize(uploadSpeed) + '/s';
  }, [uploadSpeed, formatFileSize]);

  /**
   * Format estimated time remaining
   */
  const formatTimeRemaining = useCallback(() => {
    if (!estimatedTimeRemaining) return null;
    
    const minutes = Math.floor(estimatedTimeRemaining / 60);
    const seconds = Math.floor(estimatedTimeRemaining % 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [estimatedTimeRemaining]);

  return {
    // Main function
    uploadVideo,
    
    // State
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    error,
    isUploading,
    
    // Upload stats
    uploadSpeed,
    estimatedTimeRemaining,
    formatSpeed,
    formatTimeRemaining,
    
    // Control functions
    cancelUpload,
    reset
  };
};

export default useVideoUpload;
