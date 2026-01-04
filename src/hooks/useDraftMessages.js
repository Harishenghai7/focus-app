import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing draft messages
 * Auto-save and restore unfinished messages
 */
export const useDraftMessages = (userId) => {
    const [drafts, setDrafts] = useState({});

    // Load drafts on mount
    useEffect(() => {
        if (userId) {
            loadDrafts();
        }
    }, [userId]);

    const loadDrafts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('draft_messages')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setDrafts(data.draft_messages || {});
        } catch (error) {
            console.error('Error loading drafts:', error);
        }
    }, [userId]);

    // Save draft
    const saveDraft = useCallback(async (conversationId, content) => {
        if (!content || content.trim().length === 0) {
            // Remove draft if empty
            return removeDraft(conversationId);
        }

        try {
            const newDrafts = {
                ...drafts,
                [conversationId]: {
                    content,
                    updated_at: new Date().toISOString()
                }
            };

            const { error } = await supabase
                .from('profiles')
                .update({ draft_messages: newDrafts })
                .eq('id', userId);

            if (error) throw error;

            setDrafts(newDrafts);
            return true;
        } catch (error) {
            console.error('Error saving draft:', error);
            return false;
        }
    }, [drafts, userId]);

    // Get draft
    const getDraft = useCallback((conversationId) => {
        return drafts[conversationId]?.content || '';
    }, [drafts]);

    // Remove draft
    const removeDraft = useCallback(async (conversationId) => {
        try {
            const newDrafts = { ...drafts };
            delete newDrafts[conversationId];

            const { error } = await supabase
                .from('profiles')
                .update({ draft_messages: newDrafts })
                .eq('id', userId);

            if (error) throw error;

            setDrafts(newDrafts);
            return true;
        } catch (error) {
            console.error('Error removing draft:', error);
            return false;
        }
    }, [drafts, userId]);

    // Check if conversation has draft
    const hasDraft = useCallback((conversationId) => {
        return !!drafts[conversationId];
    }, [drafts]);

    return {
        drafts,
        saveDraft,
        getDraft,
        removeDraft,
        hasDraft
    };
};
