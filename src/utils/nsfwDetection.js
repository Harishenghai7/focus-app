/**
 * HuggingFace NSFW Content Detection Utility
 * Uses HuggingFace Inference API for image moderation
 */

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection';

/**
 * Analyze image for NSFW content using HuggingFace
 * @param {string} imageUrl - URL of the image to analyze
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<Object>} - Analysis result with scores
 */
export const analyzeImageNSFW = async (imageUrl, apiKey) => {
    try {
        // Fetch image as blob
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();

        // Send to HuggingFace API
        const response = await fetch(HUGGINGFACE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/octet-stream'
            },
            body: imageBlob
        });

        if (!response.ok) {
            throw new Error(`HuggingFace API error: ${response.statusText}`);
        }

        const result = await response.json();

        // Parse results - HuggingFace returns array of labels with scores
        const nsfwScore = result.find(r => r.label === 'nsfw')?.score || 0;
        const normalScore = result.find(r => r.label === 'normal')?.score || 0;

        return {
            isNSFW: nsfwScore > 0.7, // 70% threshold
            nsfwScore,
            normalScore,
            confidence: Math.max(nsfwScore, normalScore),
            details: result
        };
    } catch (error) {
        console.error('NSFW detection error:', error);
        throw error;
    }
};

/**
 * Batch analyze multiple images
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<Object[]>} - Array of analysis results
 */
export const analyzeImagesNSFW = async (imageUrls, apiKey) => {
    const results = await Promise.all(
        imageUrls.map(url => analyzeImageNSFW(url, apiKey))
    );
    return results;
};

/**
 * Check if any image in array is NSFW
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<boolean>} - True if any image is NSFW
 */
export const hasNSFWContent = async (imageUrls, apiKey) => {
    const results = await analyzeImagesNSFW(imageUrls, apiKey);
    return results.some(r => r.isNSFW);
};

/**
 * Get moderation recommendation
 * @param {Object} analysis - Analysis result from analyzeImageNSFW
 * @returns {Object} - Moderation action recommendation
 */
export const getModerationAction = (analysis) => {
    if (analysis.nsfwScore > 0.9) {
        return {
            action: 'block',
            reason: 'High confidence NSFW content detected',
            autoBlock: true
        };
    } else if (analysis.nsfwScore > 0.7) {
        return {
            action: 'review',
            reason: 'Potential NSFW content detected',
            autoBlock: false
        };
    } else if (analysis.nsfwScore > 0.5) {
        return {
            action: 'flag',
            reason: 'Borderline content detected',
            autoBlock: false
        };
    }
    return {
        action: 'allow',
        reason: 'Content appears safe',
        autoBlock: false
    };
};
