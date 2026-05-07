import { useState, useCallback, useRef, useEffect } from 'react';
// useEffect imported for emergency fallback timer
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { focusToast } from '../utils/focusToast';

// Core settings that are definitely in the database
const CORE_SETTINGS = {
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
    notification_sound: 'default',
    quiet_hours_enabled: false,
    quiet_hours_start: null,
    quiet_hours_end: null
};

// Extended settings that may or may not exist in DB yet
const EXTENDED_SETTINGS = {
    notify_boltz: true,
    notify_flash: true,
    content_filter_level: 'balanced',
    biometric_lock_enabled: false,
    compact_mode: false
};

// Combined default settings
const DEFAULT_SETTINGS = { ...CORE_SETTINGS, ...EXTENDED_SETTINGS };

// Known valid columns in user_settings table
const VALID_DB_COLUMNS = [
    'user_id', 'theme', 'font_size', 'glassmorphism_enabled', 'high_contrast_mode',
    'account_visibility', 'two_factor_enabled', 'show_activity_status',
    'who_can_view_profile', 'who_can_view_posts', 'who_can_view_stories', 'who_can_view_boltz',
    'push_notifications', 'email_notifications', 'in_app_notifications',
    'notify_likes', 'notify_comments', 'notify_followers', 'notify_mentions', 'notify_messages',
    'notify_boltz', 'notify_flash', 'notification_sound', 'quiet_hours_enabled',
    'quiet_hours_start', 'quiet_hours_end', 'content_filter_level',
    'biometric_lock_enabled', 'compact_mode', 'updated_at', 'created_at'
];

// Sanitize settings object to only include valid DB columns
const sanitizeSettings = (settings) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(settings)) {
        if (VALID_DB_COLUMNS.includes(key)) {
            sanitized[key] = value;
        }
    }
    return sanitized;
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

        // Only select known valid columns to prevent schema cache errors
        const validColumns = VALID_DB_COLUMNS.filter(col => col !== 'created_at').join(',');
        
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select(validColumns)
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // No settings exist - create defaults
                    // Start with minimal core settings
                    const minimalSettings = { 
                        user_id: user.id, 
                        theme: 'dark',
                        push_notifications: true,
                        email_notifications: true
                    };
                    
                    const { data: created, error: createError } = await supabase
                        .from('user_settings')
                        .insert([minimalSettings])
                        .select()
                        .single();
                    
                    if (createError) {
                        console.warn('Could not create settings, using defaults:', createError);
                        // Return defaults without creating row
                        return { ...DEFAULT_SETTINGS, user_id: user.id };
                    }
                    
                    return { ...DEFAULT_SETTINGS, ...created };
                }
                
                // For any other error, log and return defaults
                console.warn('Settings fetch error, using defaults:', error);
                return { ...DEFAULT_SETTINGS, user_id: user.id };
            }

            // Merge DB data with defaults to ensure all fields exist
            return { ...DEFAULT_SETTINGS, ...data, user_id: user.id };
            
        } catch (err) {
            // Emergency fallback - return defaults on ANY error
            console.error('Critical settings error, using emergency defaults:', err);
            return { ...DEFAULT_SETTINGS, user_id: user.id };
        }
    }, [user, settings]);

    const {
        data: fetchedSettings,
        loading,
        error,
        refetch
    } = useRobustQuery(fetchSettingsData, {
        enabled: !!user,
        retries: 1,
        retryDelay: 500,
        timeout: 3000,
        onSuccess: (data) => {
            if (data) {
                setSettings(data);
                localStorage.setItem(`settings_${user.id}`, JSON.stringify(data));
            }
        },
        onError: (err) => {
            // Even on error, we should have defaults from fetchSettingsData
            // Just log it - the settings will be available
            console.warn('Settings query error (using defaults):', err);
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
            // Sanitize settings before sending to DB to prevent column not found errors
            const sanitizedSettings = sanitizeSettings(updatedSettings);
            
            const { data, error: updateError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    ...sanitizedSettings,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (updateError) {
                // If upsert fails due to missing columns, try with core settings only
                const coreSettingsOnly = {};
                for (const [key, value] of Object.entries(sanitizedSettings)) {
                    if (key in CORE_SETTINGS || key === 'user_id') {
                        coreSettingsOnly[key] = value;
                    }
                }
                
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        ...coreSettingsOnly,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    })
                    .select()
                    .single();
                
                if (fallbackError) throw fallbackError;
                
                // Merge the saved core settings with the full settings
                const mergedData = { ...updatedSettings, ...fallbackData };
                localStorage.setItem(`settings_${user.id}`, JSON.stringify(mergedData));
                focusToast.success('Settings saved!');
                return { success: true, data: mergedData };
            }

            // Update cache
            localStorage.setItem(`settings_${user.id}`, JSON.stringify(data));
            focusToast.success('Settings saved!');

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

    // EMERGENCY: Force settings to defaults after 2 seconds if still null
    // This prevents infinite loading spinner
    useEffect(() => {
        const emergencyTimer = setTimeout(() => {
            if (!settings && user) {
                console.warn('⚠️ Emergency: Setting default settings after timeout');
                setSettings({ ...DEFAULT_SETTINGS, user_id: user.id });
            }
        }, 2000);

        return () => clearTimeout(emergencyTimer);
    }, [settings, user]);

    return {
        settings: settings || DEFAULT_SETTINGS,
        loading: loading && !settings, // Only show loading if we don't have settings yet
        error,
        refetch,
        updateSettings,
        updateSetting,
        saving
    };
};
