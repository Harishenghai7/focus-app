import { useCallback } from 'react';
import { checkRateLimit, recordAction } from '../utils/rateLimiter';
import { useTrustScore } from './useTrustScore';

export const useRateLimit = (user) => {
    const { score } = useTrustScore(user);

    const checkLimit = useCallback((actionType) => {
        const result = checkRateLimit(actionType, score);
        if (result.allowed) {
            recordAction(actionType);
        }
        return result;
    }, [score]);

    return { checkLimit };
};
