import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSovereignPulse = () => {
    const [optimisticState, setOptimisticState] = useState({});
    const [loading, setLoading] = useState({});

    const togglePulse = useCallback(async (targetId, targetType, currentLikes = 0, isLiked = false) => {
        const key = `${targetType}-${targetId}`;
        
        setLoading(prev => ({ ...prev, [key]: true }));

        const newLikedState = !isLiked;
        const newCount = isLiked ? currentLikes - 1 : currentLikes + 1;

        setOptimisticState(prev => ({
            ...prev,
            [key]: { liked: newLikedState, count: newCount }
        }));

        try {
            if (newLikedState) {
                const { error } = await supabase
                    .from('interactions')
                    .insert({
                        target_id: targetId,
                        target_type: targetType,
                        type: 'pulse'
                    });

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('interactions')
                    .delete()
                    .match({
                        target_id: targetId,
                        target_type: targetType
                    });

                if (error) throw error;
            }
        } catch (error) {
            setOptimisticState(prev => ({
                ...prev,
                [key]: { liked: isLiked, count: currentLikes }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    }, []);

    const getOptimisticState = useCallback((targetId, targetType, currentLikes, isLiked) => {
        const key = `${targetType}-${targetId}`;
        return optimisticState[key] || { liked: isLiked, count: currentLikes };
    }, [optimisticState]);

    const isOptimisticLoading = useCallback((targetId, targetType) => {
        const key = `${targetType}-${targetId}`;
        return loading[key] || false;
    }, [loading]);

    return {
        togglePulse,
        getOptimisticState,
        isOptimisticLoading
    };
};

export default useSovereignPulse;
