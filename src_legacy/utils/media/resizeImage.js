/**
 * resizeImage
 * Resize images to specific dimensions while maintaining aspect ratio.
 * Uses canvas-based rendering for browser compatibility.
 * @param {File} file - Image file to resize
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {Object} options - Resize options
 * @param {boolean} options.maintainAspectRatio - Keep aspect ratio (default: true)
 * @param {number} options.quality - Output quality 0-1 (default: 0.9)
 * @param {string} options.mimeType - Output mime type (default: file.type)
 * @returns {Promise<File|Blob>} Resized file/blob
 * @example resizeImage(file, 800, 600)
 * @example resizeImage(file, 1920, 1080, { quality: 0.8 })
 */
export default async function resizeImage(file, maxWidth, maxHeight, options = {}) {
  const {
    maintainAspectRatio = true,
    quality = 0.9,
    mimeType = file.type
  } = options;

  // Validate input
  if (!file || !(file instanceof File || file instanceof Blob)) {
    throw new Error('Invalid file input');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (!maxWidth || !maxHeight || maxWidth <= 0 || maxHeight <= 0) {
    throw new Error('Invalid dimensions');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to load image'));

      img.onload = () => {
        try {
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (maintainAspectRatio) {
            // Calculate dimensions maintaining aspect ratio
            const aspectRatio = img.width / img.height;

            if (img.width > maxWidth || img.height > maxHeight) {
              if (img.width / maxWidth > img.height / maxHeight) {
                // Width is the limiting factor
                targetWidth = maxWidth;
                targetHeight = Math.round(maxWidth / aspectRatio);
              } else {
                // Height is the limiting factor
                targetHeight = maxHeight;
                targetWidth = Math.round(maxHeight * aspectRatio);
              }
            }
          } else {
            // Don't maintain aspect ratio
            targetWidth = Math.min(img.width, maxWidth);
            targetHeight = Math.min(img.height, maxHeight);
          }

          // Create canvas with target dimensions
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Use high-quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw resized image
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to resize image'));
                return;
              }

              // Convert blob to file
              const resizedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now()
              });

              resolve(resizedFile);
            },
            mimeType,
            quality
          );
        } catch (error) {
          reject(new Error(`Resize failed: ${error.message}`));
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
