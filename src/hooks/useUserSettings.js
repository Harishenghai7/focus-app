/**
 * useUserSettings Hook
 * Persistent settings with localStorage + Supabase sync
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'focus_user_settings';

const DEFAULT_SETTINGS = {
    notifications: {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        push: false
    },
    privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowMessages: 'everyone',
        showReadReceipts: true
    },
    appearance: {
        theme: 'system',
        language: 'en'
    },
    content: {
        autoplayVideos: true,
        showSensitiveContent: false,
        dataUsage: 'auto'
    }
};

export const useUserSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState(() => {
        // Load from localStorage first for instant display
        try {
            const cached = localStorage.getItem(STORAGE_KEY);
            return cached ? { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_SETTINGS;
        } catch {
            return DEFAULT_SETTINGS;
        }
    });
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Fetch settings from Supabase on mount
    useEffect(() => {
        if (!user) {
            setSettings(DEFAULT_SETTINGS);
            setLoading(false);
            return;
        }

        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('settings')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
                    throw error;
                }

                if (data?.settings) {
                    const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
                    setSettings(mergedSettings);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    // Update a specific setting
    const updateSetting = useCallback(async (path, value) => {
        if (!user) return;

        // Parse path (e.g., "notifications.likes" -> ["notifications", "likes"])
        const keys = path.split('.');

        // Create new settings object with updated value
        const newSettings = { ...settings };
        let current = newSettings;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;

        // Optimistic update
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

        // Sync to Supabase
        setSyncing(true);
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    settings: newSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error syncing settings:', error);
            // Revert on error
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                setSettings(JSON.parse(cached));
            }
        } finally {
            setSyncing(false);
        }
    }, [user, settings]);

    // Update multiple settings at once
    const updateSettings = useCallback(async (updates) => {
        if (!user) return;

        const newSettings = { ...settings, ...updates };

        // Optimistic update
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

        // Sync to Supabase
        setSyncing(true);
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    settings: newSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error syncing settings:', error);
            // Revert on error
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
                setSettings(JSON.parse(cached));
            }
        } finally {
            setSyncing(false);
        }
    }, [user, settings]);

    // Reset to defaults
    const resetSettings = useCallback(async () => {
        if (!user) return;

        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));

        setSyncing(true);
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    settings: DEFAULT_SETTINGS,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error resetting settings:', error);
        } finally {
            setSyncing(false);
        }
    }, [user]);

    return {
        settings,
        loading,
        syncing,
        updateSetting,
        updateSettings,
        resetSettings
    };
};
