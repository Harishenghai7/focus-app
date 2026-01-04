/**
 * Media utilities for handling images, videos, and audio
 */

import { supabase } from '../supabaseClient';

export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

export const getImageDimensions = async (src) => {
  try {
    const img = await loadImage(src);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight
    };
  } catch (error) {
    throw new Error(`Failed to get image dimensions: ${error.message}`);
  }
};

export const resizeImage = (file, maxWidth, maxHeight, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = calculateDimensions(
        img.width, 
        img.height, 
        maxWidth, 
        maxHeight
      );
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const compressImage = (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
  return resizeImage(file, maxWidth, maxHeight, quality);
};

export const createImageThumbnail = (file, size = 150, quality = 0.7) => {
  return resizeImage(file, size, size, quality);
};

export const cropImage = (file, x, y, width, height) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const rotateImage = (file, degrees) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const radians = (degrees * Math.PI) / 180;
      
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const flipImage = (file, horizontal = true) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.save();
      
      if (horizontal) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
      
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const convertImageFormat = (file, format = 'image/jpeg', quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve, format, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const extractImageColors = async (src, colorCount = 5) => {
  try {
    const img = await loadImage(src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale down image for faster processing
    const scaleFactor = Math.min(100 / img.width, 100 / img.height);
    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorMap = new Map();
    
    // Sample pixels and count colors
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const alpha = pixels[i + 3];
      
      if (alpha > 128) { // Skip transparent pixels
        const color = `rgb(${r},${g},${b})`;
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }
    }
    
    // Sort by frequency and return top colors
    return Array.from(colorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, colorCount)
      .map(([color]) => color);
  } catch (error) {
    throw new Error(`Failed to extract colors: ${error.message}`);
  }
};

export const isImageFile = (file) => {
  return file && file.type && file.type.startsWith('image/');
};

export const isVideoFile = (file) => {
  return file && file.type && file.type.startsWith('video/');
};

export const isAudioFile = (file) => {
  return file && file.type && file.type.startsWith('audio/');
};

export const getFileType = (file) => {
  if (isImageFile(file)) return 'image';
  if (isVideoFile(file)) return 'video';
  if (isAudioFile(file)) return 'audio';
  return 'file';
};

export const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
      URL.revokeObjectURL(audio.src);
    };
    
    audio.onerror = () => {
      reject(new Error('Failed to load audio'));
      URL.revokeObjectURL(audio.src);
    };
    
    audio.src = URL.createObjectURL(file);
  });
};

export const extractVideoFrame = (file, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration);
    };
    
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const createVideoThumbnail = (file, width = 300, height = 200, timeInSeconds = 1) => {
  return new Promise(async (resolve, reject) => {
    try {
      const frame = await extractVideoFrame(file, timeInSeconds);
      const resized = await resizeImage(frame, width, height, 0.8);
      resolve(resized);
    } catch (error) {
      reject(error);
    }
  });
};

export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxWidth = 4000,
    maxHeight = 4000
  } = options;
  
  const errors = [];
  
  if (!isImageFile(file)) {
    errors.push('File must be an image');
    return { valid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${formatBytes(maxSize)}`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return new Promise((resolve) => {
    if (errors.length > 0) {
      resolve({ valid: false, errors });
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      if (img.width > maxWidth) {
        errors.push(`Image width must be less than ${maxWidth}px`);
      }
      
      if (img.height > maxHeight) {
        errors.push(`Image height must be less than ${maxHeight}px`);
      }
      
      resolve({ valid: errors.length === 0, errors });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      errors.push('Invalid image file');
      resolve({ valid: false, errors });
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;
  
  // Calculate the scaling factor
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  
  // Apply the scaling factor
  if (ratio < 1) {
    width = Math.round(originalWidth * ratio);
    height = Math.round(originalHeight * ratio);
  }
  
  return { width, height };
};

export const createPlaceholderImage = (width, height, text = '', backgroundColor = '#f0f0f0', textColor = '#999') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Add text if provided
  if (text) {
    ctx.fillStyle = textColor;
    ctx.font = `${Math.min(width, height) / 8}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
  }
  
  return canvas.toDataURL('image/png');
};

export default {
  loadImage,
  getImageDimensions,
  resizeImage,
  compressImage,
  createImageThumbnail,
  cropImage,
  rotateImage,
  flipImage,
  convertImageFormat,
  extractImageColors,
  isImageFile,
  isVideoFile,
  isAudioFile,
  getFileType,
  getVideoDuration,
  getAudioDuration,
  extractVideoFrame,
  createVideoThumbnail,
  validateImageFile,
  formatBytes,
  formatDuration,
  calculateDimensions,
  createPlaceholderImage,
  uploadMedia,
  compressVideo,
  generateThumbnail
};

/**
 * Upload media file to Supabase storage
 */
export const uploadMedia = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const bucket = file.type.startsWith('video') ? 'videos' : 'posts';

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload media');
  }
};

/**
 * Compress video file
 */
export const compressVideo = async (file) => {
  // For now, return the original file
  // In production, you'd use FFmpeg.wasm or a server-side solution
  return file;
};

/**
 * Generate thumbnail from video
 */
export const generateThumbnail = async (videoFile) => {
  try {
    const videoUrl = URL.createObjectURL(videoFile);
    const thumbnailBlob = await createVideoThumbnail(videoUrl, 0);
    URL.revokeObjectURL(videoUrl);
    
    // Convert blob to file and upload
    const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' });
    return thumbnailFile;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};
