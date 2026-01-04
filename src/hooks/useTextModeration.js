import { useState, useCallback } from 'react';
import { checkKeywords } from '../utils/keywordBlocklist';
import { checkToxicity } from '../utils/toxicityScorer';

export const useTextModeration = () => {
    const [isChecking, setIsChecking] = useState(false);
    const [error, setError] = useState(null);

    const checkText = useCallback(async (text) => {
        setIsChecking(true);
        setError(null);

        try {
            // 1. Check keywords (fast, synchronous)
            const keywordResult = checkKeywords(text);
            if (keywordResult.flagged) {
                setIsChecking(false);
                return {
                    flagged: true,
                    reason: 'Contains prohibited keywords',
                    details: keywordResult.matches,
                    type: 'keyword'
                };
            }

            // 2. Check toxicity (async, AI)
            const toxicityResult = await checkToxicity(text);
            if (toxicityResult.toxic) {
                setIsChecking(false);
                return {
                    flagged: true,
                    reason: 'Detected toxic content',
                    details: toxicityResult.results,
                    type: 'ai_toxicity'
                };
            }

            setIsChecking(false);
            return { flagged: false };

        } catch (err) {
            console.error('Text moderation failed:', err);
            setError(err);
            setIsChecking(false);
            // Fail open or closed? Usually fail open for user experience unless critical.
            // Returning flagged: false but with error info.
            return { flagged: false, error: err };
        }
    }, []);

    return {
        checkText,
        isChecking,
        error
    };
};
