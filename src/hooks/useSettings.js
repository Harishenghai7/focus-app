import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { focusToast } from '../utils/focusToast';

const DEFAULT_SETTINGS = {
    theme: 'dark',
    font_size: 'medium',
    glassmorphism_enabled: true,
    high_contrast_mode: false,
    account_visibility: 'public',
    two_factor_enabled: false,
    show_activity_status: true,
    who_can_view_profile: 'everyone',
    who_can_view_posts: 'everyone',
    who_can_view_stories: 'everyone',
    who_can_view_boltz: 'everyone',
    push_notifications: true,
    email_notifications: true,
    in_app_notifications: true,
    notify_likes: true,
    notify_comments: true,
    notify_followers: true,
    notify_mentions: true,
    notify_messages: true,
    notify_boltz: true,
    notify_flash: true,
    notification_sound: 'default',
    quiet_hours_enabled: false,
    quiet_hours_start: null,
    quiet_hours_end: null
};

export const useSettings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState(null);
    const [saving, setSaving] = useState(false);

    // 1. Fetch Settings Logic
    const fetchSettingsData = useCallback(async () => {
        if (!user) return null;

        // Try cache first
        const cached = localStorage.getItem(`settings_${user.id}`);
        if (cached && !settings) {
            try {
                setSettings(JSON.parse(cached));
            } catch (e) { }
        }

        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Create default settings
                const newSettings = { ...DEFAULT_SETTINGS, user_id: user.id };
                const { data: created, error: createError } = await supabase
                    .from('user_settings')
                    .insert([newSettings])
                    .select()
                    .single();
                if (createError) throw createError;
                return created;
            }
            throw error;
        }

        return data || { ...DEFAULT_SETTINGS, user_id: user.id };
    }, [user, settings]);

    const {
        data: fetchedSettings,
        loading,
        error,
        refetch
    } = useRobustQuery(fetchSettingsData, {
        enabled: !!user,
        retries: 3,
        onSuccess: (data) => {
            if (data) {
                setSettings(data);
                localStorage.setItem(`settings_${user.id}`, JSON.stringify(data));
            }
        }
    });

    // 2. Realtime Subscription
    useRealtimeSubscription({
        channelName: `settings-${user?.id}`,
        table: 'user_settings',
        event: 'UPDATE',
        filter: `user_id=eq.${user?.id}`,
        enabled: !!user,
        onEvent: (payload) => {
            console.log('✅ Settings updated from another device');
            setSettings(payload.new);
            localStorage.setItem(`settings_${user.id}`, JSON.stringify(payload.new));
            focusToast.info('Settings synced from another device');
        }
    });

    // 3. Update Settings Function - CRITICAL FOR SAVING
    const updateSettings = useCallback(async (newSettings) => {
        if (!user) {
            focusToast.error('You must be logged in to change settings');
            return { success: false, error: 'Not logged in' };
        }

        // Store previous settings for rollback
        const previousSettings = settings;

        // Optimistic update - immediately show change in UI
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        setSaving(true);
        try {
            const { data, error: updateError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    ...updatedSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (updateError) throw updateError;

            // Update cache
            localStorage.setItem(`settings_${user.id}`, JSON.stringify(data));
            focusToast.success('Settings saved!');
            console.log('✅ Settings saved successfully:', data);
            return { success: true, data };
        } catch (err) {
            // Revert to previous settings on error
            setSettings(previousSettings);
            console.error('❌ Settings update error:', err);
            focusToast.error('Failed to save settings. Changes were rolled back.');
            return { success: false, error: err.message };
        } finally {
            setSaving(false);
        }
    }, [user, settings]);

    // 4. Update Single Setting - convenience function
    const updateSetting = useCallback(async (key, value) => {
        return updateSettings({ [key]: value });
    }, [updateSettings]);

    return {
        settings: settings || DEFAULT_SETTINGS,
        loading,
        error,
        refetch,
        updateSettings,
        updateSetting,
        saving
    };
};
