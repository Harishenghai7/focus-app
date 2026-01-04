// Media validation and processing utilities

// Supported formats
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
export const SUPPORTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm'];

// Size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB

// Dimension limits
export const MAX_IMAGE_DIMENSION = 4096;
export const MIN_IMAGE_DIMENSION = 100;

export class MediaValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'MediaValidationError';
    this.code = code;
  }
}

// Validate image file
export const validateImage = (file) => {
  if (!file) {
    throw new MediaValidationError('No file provided', 'NO_FILE');
  }

  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    throw new MediaValidationError(
      `Unsupported image format. Supported: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`,
      'INVALID_FORMAT'
    );
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new MediaValidationError(
      `Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      'FILE_TOO_LARGE'
    );
  }

  return true;
};

// Validate video file
export const validateVideo = (file) => {
  if (!file) {
    throw new MediaValidationError('No file provided', 'NO_FILE');
  }

  // Check file type
  if (!SUPPORTED_VIDEO_FORMATS.includes(file.type)) {
    throw new MediaValidationError(
      `Unsupported video format. Supported: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`,
      'INVALID_FORMAT'
    );
  }

  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    throw new MediaValidationError(
      `Video too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
      'FILE_TOO_LARGE'
    );
  }

  return true;
};

// Validate audio file
export const validateAudio = (file) => {
  if (!file) {
    throw new MediaValidationError('No file provided', 'NO_FILE');
  }

  // Check file type
  if (!SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    throw new MediaValidationError(
      `Unsupported audio format. Supported: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
      'INVALID_FORMAT'
    );
  }

  // Check file size
  if (file.size > MAX_AUDIO_SIZE) {
    throw new MediaValidationError(
      `Audio too large. Maximum size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
      'FILE_TOO_LARGE'
    );
  }

  return true;
};

// Get image dimensions
export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaValidationError('Failed to load image', 'LOAD_ERROR'));
    };

    img.src = url;
  });
};

// Get video duration and dimensions
export const getVideoMetadata = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaValidationError('Failed to load video', 'LOAD_ERROR'));
    };

    video.src = url;
  });
};

// Compress image
export const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new MediaValidationError('Compression failed', 'COMPRESSION_ERROR'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaValidationError('Failed to load image', 'LOAD_ERROR'));
    };

    img.src = url;
  });
};

// Generate video thumbnail
export const generateVideoThumbnail = (file, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeInSeconds, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
          } else {
            reject(new MediaValidationError('Thumbnail generation failed', 'THUMBNAIL_ERROR'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new MediaValidationError('Failed to load video', 'LOAD_ERROR'));
    };

    video.src = url;
  });
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get media type from file
export const getMediaType = (file) => {
  if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) return 'image';
  if (SUPPORTED_VIDEO_FORMATS.includes(file.type)) return 'video';
  if (SUPPORTED_AUDIO_FORMATS.includes(file.type)) return 'audio';
  return 'unknown';
};

// Validate and prepare media for upload
export const prepareMediaForUpload = async (file, options = {}) => {
  const mediaType = getMediaType(file);

  try {
    // Validate based on type
    if (mediaType === 'image') {
      validateImage(file);
      
      // Optionally compress
      if (options.compress !== false) {
        const compressed = await compressImage(file, options.maxWidth, options.quality);
        return { file: compressed, type: 'image', original: file };
      }
    } else if (mediaType === 'video') {
      validateVideo(file);
      
      // Get metadata
      const metadata = await getVideoMetadata(file);
      
      // Generate thumbnail if requested
      let thumbnail = null;
      if (options.generateThumbnail) {
        thumbnail = await generateVideoThumbnail(file);
      }
      
      return { file, type: 'video', metadata, thumbnail, original: file };
    } else if (mediaType === 'audio') {
      validateAudio(file);
    } else {
      throw new MediaValidationError('Unsupported media type', 'INVALID_TYPE');
    }

    return { file, type: mediaType, original: file };
  } catch (error) {
    if (error instanceof MediaValidationError) {
      throw error;
    }
    throw new MediaValidationError(error.message, 'PROCESSING_ERROR');
  }
};
