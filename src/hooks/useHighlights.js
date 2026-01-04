import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useHighlights = (userId, isOwnProfile = false) => {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchHighlights = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch highlights with their stories
            const { data, error: fetchError } = await supabase
                .from('flash_highlights')
                .select(`
                    id,
                    title,
                    cover_url,
                    created_at,
                    stories:flash_stories(
                        id,
                        media_url,
                        media_type,
                        duration,
                        created_at
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setHighlights(data || []);

        } catch (err) {
            console.error('Error fetching highlights:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchHighlights();
    }, [fetchHighlights]);

    const addHighlight = useCallback(async (highlightData) => {
        try {
            const { data, error } = await supabase
                .from('flash_highlights')
                .insert({
                    user_id: userId,
                    ...highlightData
                })
                .select()
                .single();

            if (error) throw error;

            setHighlights(prev => [...prev, data]);
            return data;

        } catch (err) {
            console.error('Error adding highlight:', err);
            throw err;
        }
    }, [userId]);

    const updateHighlight = useCallback(async (highlightId, updates) => {
        try {
            const { data, error } = await supabase
                .from('flash_highlights')
                .update(updates)
                .eq('id', highlightId)
                .select()
                .single();

            if (error) throw error;

            setHighlights(prev =>
                prev.map(h => h.id === highlightId ? data : h)
            );

        } catch (err) {
            console.error('Error updating highlight:', err);
            throw err;
        }
    }, []);

    const deleteHighlight = useCallback(async (highlightId) => {
        try {
            const { error } = await supabase
                .from('flash_highlights')
                .delete()
                .eq('id', highlightId);

            if (error) throw error;

            setHighlights(prev => prev.filter(h => h.id !== highlightId));

        } catch (err) {
            console.error('Error deleting highlight:', err);
            throw err;
        }
    }, []);

    return {
        highlights,
        loading,
        error,
        addHighlight,
        updateHighlight,
        deleteHighlight,
        refresh: fetchHighlights
    };
};
