import { useState, useCallback } from 'react';
import { analyzeImageNSFW, getModerationAction } from '../utils/nsfwDetection';

/**
 * Hook for content moderation using HuggingFace NSFW detection
 */
export const useContentModeration = () => {
    const [moderating, setModerating] = useState(false);
    const [moderationResult, setModerationResult] = useState(null);

    // Get HuggingFace API key from environment
    const apiKey = process.env.REACT_APP_HUGGINGFACE_API_KEY;

    /**
     * Moderate a single image
     */
    const moderateImage = useCallback(async (imageUrl) => {
        if (!apiKey) {
            console.warn('HuggingFace API key not configured');
            return { allowed: true, warning: 'Moderation disabled' };
        }

        setModerating(true);
        try {
            const analysis = await analyzeImageNSFW(imageUrl, apiKey);
            const action = getModerationAction(analysis);

            const result = {
                allowed: action.action !== 'block',
                action: action.action,
                reason: action.reason,
                autoBlock: action.autoBlock,
                nsfwScore: analysis.nsfwScore,
                confidence: analysis.confidence
            };

            setModerationResult(result);
            return result;
        } catch (error) {
            console.error('Moderation error:', error);
            // Fail open - allow content if moderation fails
            return { allowed: true, error: error.message };
        } finally {
            setModerating(false);
        }
    }, [apiKey]);

    /**
     * Moderate multiple images
     */
    const moderateImages = useCallback(async (imageUrls) => {
        if (!apiKey) {
            console.warn('HuggingFace API key not configured');
            return { allowed: true, warning: 'Moderation disabled' };
        }

        setModerating(true);
        try {
            const results = await Promise.all(
                imageUrls.map(url => analyzeImageNSFW(url, apiKey))
            );

            // Check if any image should be blocked
            const actions = results.map(getModerationAction);
            const shouldBlock = actions.some(a => a.action === 'block');
            const shouldReview = actions.some(a => a.action === 'review');

            const result = {
                allowed: !shouldBlock,
                action: shouldBlock ? 'block' : shouldReview ? 'review' : 'allow',
                results: results.map((r, i) => ({
                    imageUrl: imageUrls[i],
                    nsfwScore: r.nsfwScore,
                    action: actions[i].action
                })),
                maxNsfwScore: Math.max(...results.map(r => r.nsfwScore))
            };

            setModerationResult(result);
            return result;
        } catch (error) {
            console.error('Moderation error:', error);
            return { allowed: true, error: error.message };
        } finally {
            setModerating(false);
        }
    }, [apiKey]);

    /**
     * Clear moderation result
     */
    const clearResult = useCallback(() => {
        setModerationResult(null);
    }, []);

    return {
        moderating,
        moderationResult,
        moderateImage,
        moderateImages,
        clearResult,
        isConfigured: !!apiKey
    };
};
