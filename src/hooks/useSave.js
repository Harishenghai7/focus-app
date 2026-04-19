import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export const useSave = () => {
    const [loading, setLoading] = useState(false);

    const toggleSave = useCallback(async (contentId, isSaved, contentType = 'post', onUpdate) => {
        if (!contentId) return;

        setLoading(true);
        const newSaved = !isSaved;

        // 1. Optimistic Update
        if (onUpdate) {
            onUpdate(contentId, {
                is_saved: newSaved,
                saves_count_delta: newSaved ? 1 : -1
            });
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Please login to save posts');

            let rpcResult = null;
            if (contentType === 'post') {
                const { data, error } = await supabase.rpc('toggle_post_save_rpc', {
                    p_post_id: contentId,
                    p_user_id: user.id,
                    p_should_save: newSaved,
                });
                if (error) throw error;
                rpcResult = data;
            } else {
                const { data, error } = await supabase.rpc('toggle_boltz_save_rpc', {
                    p_boltz_id: contentId,
                    p_user_id: user.id,
                    p_should_save: newSaved,
                });
                if (error) throw error;
                rpcResult = data;
            }

            if (onUpdate && rpcResult) {
                onUpdate(contentId, {
                    is_saved: Boolean(rpcResult.is_saved ?? rpcResult.is_active ?? newSaved),
                    saves_count: typeof rpcResult.saves_count === 'number'
                        ? rpcResult.saves_count
                        : (typeof rpcResult.count === 'number' ? rpcResult.count : undefined),
                });
            }
            toast[newSaved ? 'success' : 'info'](newSaved ? 'Saved to collection' : 'Removed from saved');
            return { data: rpcResult, error: null };
        } catch (error) {
            console.error('❌ [SAVE] Error:', error);
            toast.error(error.message || 'Failed to update save');

            // 2. Revert Optimistic Update on failure
            if (onUpdate) {
                onUpdate(contentId, {
                    is_saved: isSaved,
                    saves_count_delta: isSaved ? 1 : -1
                });
            }
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    }, []);

    return { toggleSave, loading };
};
