/**
 * Upload Media Utility
 * Handles uploading images and videos to Supabase storage
 */

import { supabase } from '../supabaseClient';
import { compressImage } from './media/compressImage';
import { generateThumbnail } from './media/generateThumbnail';

/**
 * Upload a single media file to Supabase storage
 * @param {File} file - The file to upload
 * @param {string} folder - Storage folder (posts, stories, profiles, etc.)
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadMedia = async (file, folder = 'posts', options = {}) => {
  try {
    const {
      compress = true,
      generateThumbnails = true,
      onProgress = null,
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8
    } = options;

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Get file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new Error('File must be an image or video');
    }

    let uploadFile = file;
    let thumbnailUrl = null;

    // Process image
    if (isImage && compress) {
      if (onProgress) onProgress({ status: 'compressing', progress: 20 });
      
      try {
        uploadFile = await compressImage(file, {
          maxWidth,
          maxHeight,
          quality
        });
      } catch (error) {
        console.warn('Image compression failed, uploading original:', error);
        uploadFile = file;
      }
    }

    // Generate thumbnail for video
    if (isVideo && generateThumbnails) {
      if (onProgress) onProgress({ status: 'generating_thumbnail', progress: 30 });
      
      try {
        const thumbnailBlob = await generateThumbnail(file);
        const thumbnailFile = new File([thumbnailBlob], `thumb_${file.name}.jpg`, {
          type: 'image/jpeg'
        });
        
        // Upload thumbnail
        const thumbPath = `${folder}/thumbnails/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('media')
          .upload(thumbPath, thumbnailFile);

        if (thumbError) throw thumbError;

        const { data: thumbUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(thumbPath);
        
        thumbnailUrl = thumbUrlData.publicUrl;
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    if (onProgress) onProgress({ status: 'uploading', progress: 50 });

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, uploadFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    if (onProgress) onProgress({ status: 'finalizing', progress: 90 });

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    if (onProgress) onProgress({ status: 'complete', progress: 100 });

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      thumbnailUrl,
      metadata: {
        size: uploadFile.size,
        type: uploadFile.type,
        originalSize: file.size,
        compressed: compress && isImage && uploadFile.size < file.size,
        compressionRatio: file.size > 0 ? (1 - uploadFile.size / file.size) : 0
      }
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed'
    };
  }
};

/**
 * Upload multiple media files
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - Storage folder
 * @param {Object} options - Upload options
 * @returns {Promise<Object[]>} Array of upload results
 */
export const uploadMultipleMedia = async (files, folder = 'posts', options = {}) => {
  try {
    const { onProgress = null } = options;

    const results = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress({
          status: 'uploading',
          currentFile: i + 1,
          totalFiles: total,
          progress: Math.round((i / total) * 100)
        });
      }

      const result = await uploadMedia(file, folder, {
        ...options,
        onProgress: null // Disable individual file progress
      });

      results.push(result);

      if (!result.success) {
        console.error(`Failed to upload file ${i + 1}:`, result.error);
      }
    }

    if (onProgress) {
      onProgress({
        status: 'complete',
        progress: 100
      });
    }

    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete media from Supabase storage
 * @param {string} path - File path in storage
 * @returns {Promise<boolean>} Success status
 */
export const deleteMedia = async (path) => {
  try {
    const { error } = await supabase.storage
      .from('media')
      .remove([path]);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

/**
 * Get media URL from path
 * @param {string} path - File path in storage
 * @returns {string} Public URL
 */
export const getMediaUrl = (path) => {
  if (!path) return null;
  
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Check if media file is valid
 * @param {File} file - File to check
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateMediaFile = (file, options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'],
    maxDuration = 60 // seconds (for videos)
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported'
    };
  }

  // For videos, check duration (would need async check)
  if (file.type.startsWith('video/')) {
    // This is a simplified check - in production, you'd check actual video duration
    // For now, just validate it's a video file
  }

  return { valid: true };
};

export default uploadMedia;
