/**
 * Focusly Image Utilities
 * Handles loading and converting Focusly's reference image for AI vision integration
 */

// Cache for the loaded image
let focuslyImageCache = null;
let imageLoadPromise = null;

/**
 * Convert image file to base64 string
 * @param {Blob|File} imageBlob - The image blob or file
 * @returns {Promise<string>} Base64 encoded image
 */
export const imageToBase64 = (imageBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageBlob);
  });
};

/**
 * Fetch Focusly image from assets
 * @returns {Promise<Blob>} Image blob
 */
export const fetchFocuslyImage = async () => {
  try {
    const response = await fetch('/src/assets/focusly/focusly_reference.png');
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching Focusly image:', error);
    throw error;
  }
};

/**
 * Load and cache Focusly image as base64
 * Uses caching and deduplication to avoid multiple loads
 * @returns {Promise<string|null>} Base64 encoded image or null if failed
 */
export const loadFocuslyImageBase64 = async () => {
  // Return cached image if available
  if (focuslyImageCache) {
    return focuslyImageCache;
  }

  // If already loading, return the same promise
  if (imageLoadPromise) {
    return imageLoadPromise;
  }

  // Start loading
  imageLoadPromise = (async () => {
    try {
      // Try to load from localStorage first
      const cachedData = localStorage.getItem('focusly_image_cache');
      if (cachedData) {
        focuslyImageCache = cachedData;
        console.log('✅ Focusly image loaded from cache');
        return cachedData;
      }

      // Fetch fresh image
      const imageBlob = await fetchFocuslyImage();
      const base64Image = await imageToBase64(imageBlob);

      // Cache in memory and localStorage
      focuslyImageCache = base64Image;
      try {
        localStorage.setItem('focusly_image_cache', base64Image);
        localStorage.setItem('focusly_image_cache_timestamp', Date.now().toString());
      } catch (e) {
        // localStorage might be full or disabled, that's okay
        console.warn('Could not cache image to localStorage:', e);
      }

      console.log('✅ Focusly image loaded successfully');
      return base64Image;
    } catch (error) {
      console.error('❌ Failed to load Focusly image:', error);
      imageLoadPromise = null; // Reset promise on error so we can retry
      return null;
    }
  })();

  return imageLoadPromise;
};

/**
 * Clear cached image (useful for testing or refresh)
 */
export const clearFocuslyImageCache = () => {
  focuslyImageCache = null;
  imageLoadPromise = null;
  try {
    localStorage.removeItem('focusly_image_cache');
    localStorage.removeItem('focusly_image_cache_timestamp');
  } catch (e) {
    // Silently fail if localStorage unavailable
  }
  console.log('Focusly image cache cleared');
};

/**
 * Get cache age in minutes
 * @returns {number|null} Age in minutes or null if not cached
 */
export const getFocuslyImageCacheAge = () => {
  const timestamp = localStorage.getItem('focusly_image_cache_timestamp');
  if (!timestamp) return null;
  return Math.floor((Date.now() - parseInt(timestamp)) / 60000);
};

/**
 * Check if image is cached and valid
 * Cache is valid for 7 days
 * @returns {boolean}
 */
export const isFocuslyImageCacheValid = () => {
  const age = getFocuslyImageCacheAge();
  if (age === null) return false;
  return age < 7 * 24 * 60; // 7 days in minutes
};

/**
 * Create inline data object for Gemini API
 * @param {string} base64Image - Base64 encoded image
 * @returns {Object} Inline data object ready for Gemini API
 */
export const createGeminiImageData = (base64Image) => {
  return {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image
    }
  };
};

/**
 * Text description of Focusly for fallback
 * Used when image loading fails
 */
export const FOCUSLY_VISUAL_DESCRIPTION = `
Focusly is a majestic and friendly lion character with the following design:

PHYSICAL APPEARANCE:
- Body: Golden-orange fur with a vibrant, warm tone
- Head: Large, expressive lion head with a distinctive mane
- Mane: Thick, fluffy mane that frames the face beautifully
- Eyes: Large, warm, and kind eyes that express friendliness and intelligence
- Expression: Always smiling, warm, and welcoming expression
- Style: Cute and approachable while maintaining dignity

COLOR PALETTE:
- Primary: Warm golden-orange (#D4A574 to #E8B856)
- Mane: Slightly darker lion gold with highlights
- Accents: Soft cream and white for highlights and details
- Overall: Warm, inviting, and professional aesthetic

PERSONALITY IN DESIGN:
- Friendly: Open posture, warm smile
- Intelligent: Alert expression, kind eyes
- Trustworthy: Professional but approachable
- Supportive: Inviting and encouraging presence
- Modern: Clean, contemporary design style

USAGE CONTEXT:
- Serves as the main AI companion for Focus app users
- Appears in chat interface as a conversational partner
- Represents the intelligent, caring nature of the app
- Symbol of trust, friendship, and support within the platform
`;

export default {
  imageToBase64,
  fetchFocuslyImage,
  loadFocuslyImageBase64,
  clearFocuslyImageCache,
  getFocuslyImageCacheAge,
  isFocuslyImageCacheValid,
  createGeminiImageData,
  FOCUSLY_VISUAL_DESCRIPTION
};
