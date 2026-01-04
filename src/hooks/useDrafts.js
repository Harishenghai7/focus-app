import { useState, useEffect } from 'react';

const STORAGE_KEY = 'focus_create_drafts';

export const useDrafts = () => {
    const [drafts, setDrafts] = useState({});

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setDrafts(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing drafts:', e);
            }
        }
    }, []);

    const saveDraft = (type, data) => {
        const updated = { ...drafts, [type]: { ...data, timestamp: Date.now() } };
        setDrafts(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const getDraft = (type) => {
        return drafts[type] || null;
    };

    const clearDraft = (type) => {
        const updated = { ...drafts };
        delete updated[type];
        setDrafts(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return { saveDraft, getDraft, clearDraft };
};
