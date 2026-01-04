import { useState, useCallback } from 'react';
import { checkImageNSFW } from '../utils/nsfwImageCheck';

export const useImageModeration = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState(null);

    const checkImage = useCallback(async (imageElement) => {
        setIsChecking(true);
        setError(null);

        try {
            const result = await checkImageNSFW(imageElement);
            setIsChecking(false);

            if (result.flagged) {
                return {
                    flagged: true,
                    reason: 'NSFW content detected',
                    details: result.predictions.filter(p => p.probability > 0.4), // Return relevant predictions
                    type: 'ai_nsfw'
                };
            }

            return { flagged: false };
        } catch (err) {
            console.error('Image moderation failed:', err);
            setError(err);
            setIsChecking(false);
            return { flagged: false, error: err };
        }
    }, []);

    return {
        checkImage,
        isChecking,
        error
    };
};
