import { useState, useCallback, useRef } from 'react';
import { supabase, STORAGE_BUCKETS } from '../supabaseClient';
import { compressImage, generateThumbnail } from '../utils/imageCompression';

/**
 * Custom hook for uploading images with compression and progress tracking
 * 
 * Features:
 * - Select and validate image files
 * - Compress/resize images before upload
 * - Upload to Supabase Storage with progress tracking
 * - Generate thumbnails automatically
 * - Handle errors gracefully
 * - Support cancellation
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.bucket - Supabase storage bucket name
 * @param {Object} options.compressionOptions - Image compression settings
 * @param {boolean} options.generateThumb - Whether to generate thumbnail
 * @param {number} options.thumbnailSize - Thumbnail size in pixels
 * @returns {Object} Upload functions and state
 * 
 * @example
 * const { uploadImage, uploadProgress, uploadedUrl, thumbnailUrl, error, isUploading, cancelUpload } = useImageUpload({
 *   bucket: 'posts',
 *   compressionOptions: { quality: 0.8, maxWidth: 1920 }
 * });
 */
const useImageUpload = (options = {}) => {
  const {
    bucket = STORAGE_BUCKETS.POSTS,
    compressionOptions = {},
    generateThumb = true,
    thumbnailSize = 150
  } = options;

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const uploadAbortController = useRef(null);

  /**
   * Validate image file
   */
  const validateImage = useCallback((file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
      throw new Error('No file provided');
    }

    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Supported: ${validTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
    }

    return true;
  }, []);

  /**
   * Upload file to Supabase Storage
   */
  const uploadToStorage = useCallback(async (file, path) => {
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }, [bucket]);

  /**
   * Main upload function
   */
  const uploadImage = useCallback(async (file) => {
    try {
      // Reset state
      setError(null);
      setUploadProgress(0);
      setUploadedUrl(null);
      setThumbnailUrl(null);
      setIsUploading(true);
      uploadAbortController.current = new AbortController();

      // Validate
      validateImage(file);
      setUploadProgress(10);

      // Compress image
      const compressedFile = await compressImage(
        file,
        {
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1920,
          ...compressionOptions
        },
        (progress) => {
          // Map compression progress to 10-50%
          setUploadProgress(10 + (progress * 0.4));
        }
      );
      setUploadProgress(50);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = compressedFile.name.split('.').pop();
      const filename = `${timestamp}_${randomStr}.${extension}`;
      const filepath = `images/${filename}`;

      // Upload main image
      const imageUrl = await uploadToStorage(compressedFile, filepath);
      setUploadedUrl(imageUrl);
      setUploadProgress(70);

      // Generate and upload thumbnail if enabled
      if (generateThumb) {
        try {
          const thumb = await generateThumbnail(file, thumbnailSize);
          const thumbPath = `thumbnails/${filename}`;
          const thumbUrl = await uploadToStorage(thumb, thumbPath);
          setThumbnailUrl(thumbUrl);
          setUploadProgress(90);
        } catch (thumbError) {
          console.warn('Thumbnail generation failed:', thumbError);
          // Don't fail the whole upload if thumbnail fails
        }
      }

      setUploadProgress(100);
      setIsUploading(false);

      return {
        url: imageUrl,
        thumbnailUrl: thumbnailUrl,
        filename: filename,
        size: compressedFile.size,
        originalSize: file.size,
        compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1)
      };

    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err.message || 'Failed to upload image');
      setIsUploading(false);
      setUploadProgress(0);
      throw err;
    }
  }, [validateImage, compressionOptions, generateThumb, thumbnailSize, uploadToStorage]);

  /**
   * Upload multiple images
   */
  const uploadMultipleImages = useCallback(async (files) => {
    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadImage(files[i]);
        results.push({ success: true, ...result });
        
        // Update overall progress
        setUploadProgress(((i + 1) / total) * 100);
      } catch (err) {
        results.push({ 
          success: false, 
          error: err.message,
          filename: files[i].name 
        });
      }
    }

    return results;
  }, [uploadImage]);

  /**
   * Cancel ongoing upload
   */
  const cancelUpload = useCallback(() => {
    if (uploadAbortController.current) {
      uploadAbortController.current.abort();
      setIsUploading(false);
      setUploadProgress(0);
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
  }, []);

  return {
    // Main function
    uploadImage,
    uploadMultipleImages,
    
    // State
    uploadProgress,
    uploadedUrl,
    thumbnailUrl,
    error,
    isUploading,
    
    // Control functions
    cancelUpload,
    reset
  };
};

export { useImageUpload };
export default useImageUpload;
