/**
 * useEditorDraft Hook
 * Auto-save editor state with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'focus_editor_draft';
const AUTO_SAVE_DELAY = 2000; // 2 seconds

const EMPTY_DRAFT = {
    content: '',
    caption: '',
    media: [],
    song: null,
    thumbnail: null,
    crop: { x: 0, y: 0, width: 100, height: 100 },
    filters: [],
    contentType: 'post', // 'post', 'boltz', 'flash'
    visibility: 'public',
    tags: [],
    location: null,
    lastSaved: null
};

export const useEditorDraft = () => {
    const [draft, setDraft] = useState(() => {
        // Load from localStorage on mount
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...EMPTY_DRAFT, ...parsed };
            }
        } catch (error) {
            console.error('Error loading draft:', error);
        }
        return EMPTY_DRAFT;
    });

    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save to localStorage
    useEffect(() => {
        if (!isDirty) return;

        setIsSaving(true);
        const timer = setTimeout(() => {
            try {
                const draftToSave = {
                    ...draft,
                    lastSaved: new Date().toISOString()
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(draftToSave));
                setIsDirty(false);
            } catch (error) {
                console.error('Error saving draft:', error);
            } finally {
                setIsSaving(false);
            }
        }, AUTO_SAVE_DELAY);

        return () => clearTimeout(timer);
    }, [draft, isDirty]);

    // Update draft
    const updateDraft = useCallback((updates) => {
        setDraft(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    }, []);

    // Update specific field
    const updateField = useCallback((field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    }, []);

    // Add media
    const addMedia = useCallback((mediaItem) => {
        setDraft(prev => ({
            ...prev,
            media: [...prev.media, mediaItem]
        }));
        setIsDirty(true);
    }, []);

    // Remove media
    const removeMedia = useCallback((index) => {
        setDraft(prev => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index)
        }));
        setIsDirty(true);
    }, []);

    // Clear draft
    const clearDraft = useCallback(() => {
        setDraft(EMPTY_DRAFT);
        setIsDirty(false);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }, []);

    // Check if draft has content
    const hasDraft = useCallback(() => {
        return draft.content.trim() !== '' ||
            draft.caption.trim() !== '' ||
            draft.media.length > 0 ||
            draft.song !== null;
    }, [draft]);

    // Restore draft (for showing recovery UI)
    const restoreDraft = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setDraft({ ...EMPTY_DRAFT, ...parsed });
                return true;
            }
        } catch (error) {
            console.error('Error restoring draft:', error);
        }
        return false;
    }, []);

    return {
        draft,
        isDirty,
        isSaving,
        updateDraft,
        updateField,
        addMedia,
        removeMedia,
        clearDraft,
        hasDraft,
        restoreDraft
    };
};
