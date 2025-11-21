/**
 * compressImage
 * Compress images before upload to meet size and quality requirements.
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum file size in MB (default: 1)
 * @param {number} options.quality - Compression quality 0-1 (default: 0.8)
 * @param {string} options.mimeType - Output mime type (default: 'image/jpeg')
 * @returns {Promise<File|Blob>} Compressed file/blob
 * @example compressImage(file)
 * @example compressImage(file, { maxSizeMB: 0.5, quality: 0.7 })
 */
export default async function compressImage(file, options = {}) {
  const {
    maxSizeMB = 1,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  // Validate input
  if (!file || !(file instanceof File || file instanceof Blob)) {
    throw new Error('Invalid file input');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If file is already small enough and quality is 1, return as-is
  if (file.size <= maxSizeBytes && quality === 1) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas dimensions to image dimensions
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0);

          // Try different quality levels to meet size requirement
          let currentQuality = quality;
          let attempts = 0;
          const maxAttempts = 10;

          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                // Check if size is acceptable or we've tried enough times
                if (blob.size <= maxSizeBytes || attempts >= maxAttempts || currentQuality <= 0.1) {
                  // Convert blob to file
                  const compressedFile = new File([blob], file.name, {
                    type: mimeType,
                    lastModified: Date.now()
                  });

                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  attempts++;
                  currentQuality *= 0.9;
                  tryCompress();
                }
              },
              mimeType,
              currentQuality
            );
          };

          tryCompress();
        } catch (error) {
          reject(new Error(`Compression failed: ${error.message}`));
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
