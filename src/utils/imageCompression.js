import Compressor from 'compressorjs';

/**
 * Compress an image file with progress tracking
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, options = {}, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      mimeType: 'image/jpeg',
      convertSize: 1000000, // Convert to JPEG if larger than 1MB
      ...options
    };

    // Simulate progress for better UX
    let progressInterval;
    if (onProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          onProgress(progress);
        }
      }, 100);
    }

    new Compressor(file, {
      ...defaultOptions,
      success(result) {
        if (progressInterval) clearInterval(progressInterval);
        if (onProgress) onProgress(100);
        
        // Convert Blob to File
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now()
        });
        
        resolve(compressedFile);
      },
      error(err) {
        if (progressInterval) clearInterval(progressInterval);
        reject(err);
      }
    });
  });
};

/**
 * Generate thumbnail from image file
 * @param {File} file - The image file
 * @param {number} size - Thumbnail size (width and height)
 * @returns {Promise<File>} - Thumbnail file
 */
export const generateThumbnail = (file, size = 150) => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.7,
      maxWidth: size,
      maxHeight: size,
      mimeType: 'image/jpeg',
      success(result) {
        const thumbnailFile = new File([result], `thumb_${file.name}`, {
          type: result.type,
          lastModified: Date.now()
        });
        resolve(thumbnailFile);
      },
      error(err) {
        reject(err);
      }
    });
  });
};

/**
 * Generate multiple thumbnail sizes
 * @param {File} file - The image file
 * @param {Array<number>} sizes - Array of thumbnail sizes
 * @returns {Promise<Object>} - Object with thumbnail files keyed by size
 */
export const generateMultipleThumbnails = async (file, sizes = [150, 640]) => {
  const thumbnails = {};
  
  for (const size of sizes) {
    try {
      const thumbnail = await generateThumbnail(file, size);
      thumbnails[`${size}x${size}`] = thumbnail;
    } catch (error) {
      console.error(`Failed to generate ${size}x${size} thumbnail:`, error);
    }
  }
  
  return thumbnails;
};

/**
 * Compress multiple images with progress tracking
 * @param {Array<File>} files - Array of image files
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Array<File>>} - Array of compressed files
 */
export const compressMultipleImages = async (files, onProgress = null) => {
  const compressedFiles = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Only compress images
    if (!file.type.startsWith('image/')) {
      compressedFiles.push(file);
      if (onProgress) {
        onProgress(Math.round(((i + 1) / total) * 100));
      }
      continue;
    }
    
    try {
      const compressed = await compressImage(file, {}, (fileProgress) => {
        if (onProgress) {
          const overallProgress = ((i / total) * 100) + ((fileProgress / 100) * (100 / total));
          onProgress(Math.round(overallProgress));
        }
      });
      compressedFiles.push(compressed);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Use original file if compression fails
      compressedFiles.push(file);
    }
  }
  
  if (onProgress) onProgress(100);
  return compressedFiles;
};

/**
 * Get compression statistics
 * @param {File} originalFile - Original file
 * @param {File} compressedFile - Compressed file
 * @returns {Object} - Compression stats
 */
export const getCompressionStats = (originalFile, compressedFile) => {
  const originalSize = originalFile.size;
  const compressedSize = compressedFile.size;
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = ((savedBytes / originalSize) * 100).toFixed(1);
  
  return {
    originalSize,
    compressedSize,
    savedBytes,
    savedPercentage,
    originalSizeMB: (originalSize / 1024 / 1024).toFixed(2),
    compressedSizeMB: (compressedSize / 1024 / 1024).toFixed(2)
  };
};
