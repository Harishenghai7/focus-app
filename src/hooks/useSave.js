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

            const tableName = contentType === 'boltz' ? 'boltz_saves' : 'saved_posts';
            const idField = contentType === 'boltz' ? 'boltz_id' : 'post_id';

            if (newSaved) {
                const { error } = await supabase.from(tableName).insert({
                    [idField]: contentId,
                    user_id: user.id
                });
                if (error) throw error;
                toast.success('Saved to collection');
            } else {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq(idField, contentId)
                    .eq('user_id', user.id);
                if (error) throw error;
                toast.info('Removed from saved');
            }
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
        } finally {
            setLoading(false);
        }
    }, []);

    return { toggleSave, loading };
};
