/**
 * Practical examples for compressImage and resizeImage utilities
 */
import compressImage from './compressImage';
import resizeImage from './resizeImage';

// ============================================================================
// Example 1: Basic Image Compression
// ============================================================================
export async function basicCompression(file) {
  console.log('Original size:', (file.size / 1024).toFixed(2), 'KB');
  
  const compressed = await compressImage(file);
  
  console.log('Compressed size:', (compressed.size / 1024).toFixed(2), 'KB');
  console.log('Reduction:', ((1 - compressed.size / file.size) * 100).toFixed(1), '%');
  
  return compressed;
}

// ============================================================================
// Example 2: Basic Image Resizing
// ============================================================================
export async function basicResize(file) {
  // Resize to max 800x600, maintaining aspect ratio
  const resized = await resizeImage(file, 800, 600);
  
  console.log('Image resized successfully');
  return resized;
}

// ============================================================================
// Example 3: Create Thumbnail
// ============================================================================
export async function createThumbnail(file, size = 150) {
  const thumbnail = await resizeImage(file, size, size, {
    quality: 0.8,
    maintainAspectRatio: true
  });
  
  return thumbnail;
}

// ============================================================================
// Example 4: Prepare Image for Upload
// ============================================================================
export async function prepareForUpload(file) {
  // Step 1: Resize to reasonable dimensions
  let processed = await resizeImage(file, 1920, 1080, {
    quality: 0.9
  });
  
  // Step 2: Compress to meet size requirements
  processed = await compressImage(processed, {
    maxSizeMB: 1,
    quality: 0.8
  });
  
  return processed;
}

// ============================================================================
// Example 5: Create Multiple Sizes
// ============================================================================
export async function createMultipleSizes(file) {
  const sizes = {
    thumbnail: await resizeImage(file, 150, 150),
    small: await resizeImage(file, 640, 480),
    medium: await resizeImage(file, 1280, 720),
    large: await resizeImage(file, 1920, 1080)
  };
  
  return sizes;
}

// ============================================================================
// Example 6: Aggressive Compression
// ============================================================================
export async function aggressiveCompression(file) {
  // Resize first to reduce data
  let processed = await resizeImage(file, 1024, 768);
  
  // Aggressive compression
  processed = await compressImage(processed, {
    maxSizeMB: 0.5,
    quality: 0.6
  });
  
  return processed;
}

// ============================================================================
// Example 7: High Quality Processing
// ============================================================================
export async function highQualityProcessing(file) {
  // Larger size, higher quality
  let processed = await resizeImage(file, 2560, 1440, {
    quality: 0.95
  });
  
  processed = await compressImage(processed, {
    maxSizeMB: 3,
    quality: 0.9
  });
  
  return processed;
}

// ============================================================================
// Example 8: Format Conversion
// ============================================================================
export async function convertToWebP(file) {
  // Convert to WebP for better compression
  const webp = await compressImage(file, {
    maxSizeMB: 1,
    quality: 0.85,
    mimeType: 'image/webp'
  });
  
  return webp;
}

// ============================================================================
// Example 9: Profile Picture Processing
// ============================================================================
export async function processProfilePicture(file) {
  // Square crop for profile pictures
  const processed = await resizeImage(file, 400, 400, {
    quality: 0.85,
    maintainAspectRatio: true
  });
  
  // Compress to reasonable size
  const compressed = await compressImage(processed, {
    maxSizeMB: 0.5,
    quality: 0.8
  });
  
  return compressed;
}

// ============================================================================
// Example 10: Batch Processing
// ============================================================================
export async function processBatch(files) {
  const processed = [];
  
  for (const file of files) {
    try {
      const result = await prepareForUpload(file);
      processed.push({
        original: file,
        processed: result,
        originalSize: file.size,
        processedSize: result.size,
        reduction: ((1 - result.size / file.size) * 100).toFixed(1) + '%'
      });
    } catch (error) {
      console.error(`Failed to process ${file.name}:`, error);
      processed.push({
        original: file,
        error: error.message
      });
    }
  }
  
  return processed;
}

// ============================================================================
// Example 11: Progress Tracking
// ============================================================================
export async function processWithProgress(file, onProgress) {
  try {
    onProgress(0, 'Starting...');
    
    onProgress(25, 'Resizing image...');
    const resized = await resizeImage(file, 1920, 1080);
    
    onProgress(50, 'Resized successfully');
    
    onProgress(75, 'Compressing image...');
    const compressed = await compressImage(resized, {
      maxSizeMB: 1,
      quality: 0.8
    });
    
    onProgress(100, 'Complete!');
    
    return compressed;
  } catch (error) {
    onProgress(-1, `Error: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// Example 12: Conditional Processing
// ============================================================================
export async function smartProcess(file) {
  const sizeMB = file.size / 1024 / 1024;
  
  let processed = file;
  
  // Only resize if image is very large
  if (sizeMB > 5) {
    console.log('Image is large, resizing...');
    processed = await resizeImage(processed, 1920, 1080);
  }
  
  // Only compress if above 1MB
  if (processed.size > 1024 * 1024) {
    console.log('Compressing to meet size limit...');
    processed = await compressImage(processed, {
      maxSizeMB: 1,
      quality: 0.8
    });
  }
  
  return processed;
}

// ============================================================================
// Example 13: React Hook
// ============================================================================
export function useImageProcessor() {
  const processImage = async (file, options = {}) => {
    const {
      resize = true,
      compress = true,
      maxWidth = 1920,
      maxHeight = 1080,
      maxSizeMB = 1,
      quality = 0.8
    } = options;
    
    let processed = file;
    
    if (resize) {
      processed = await resizeImage(processed, maxWidth, maxHeight);
    }
    
    if (compress) {
      processed = await compressImage(processed, {
        maxSizeMB,
        quality
      });
    }
    
    return processed;
  };
  
  return { processImage };
}

// ============================================================================
// Example 14: Error Handling Wrapper
// ============================================================================
export async function safeProcess(file, options = {}) {
  try {
    // Validate input
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Process image
    const processed = await prepareForUpload(file);
    
    return {
      success: true,
      file: processed,
      originalSize: file.size,
      processedSize: processed.size,
      reduction: ((1 - processed.size / file.size) * 100).toFixed(1) + '%'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      file: null
    };
  }
}

// ============================================================================
// Example 15: Complete Upload Handler
// ============================================================================
export async function handleImageUpload(file, uploadFn) {
  try {
    // Validate
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    
    // Log original
    console.log('Original file:', {
      name: file.name,
      type: file.type,
      size: (file.size / 1024).toFixed(2) + ' KB'
    });
    
    // Process
    const processed = await prepareForUpload(file);
    
    // Log processed
    console.log('Processed file:', {
      name: processed.name,
      type: processed.type,
      size: (processed.size / 1024).toFixed(2) + ' KB',
      reduction: ((1 - processed.size / file.size) * 100).toFixed(1) + '%'
    });
    
    // Upload
    const result = await uploadFn(processed);
    
    return {
      success: true,
      url: result.url,
      metadata: {
        originalSize: file.size,
        processedSize: processed.size
      }
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
