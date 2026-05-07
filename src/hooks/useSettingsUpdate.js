import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { focusToast } from '../utils/focusToast';

// Valid columns in user_settings table - prevents errors from missing columns
const VALID_DB_COLUMNS = [
    'user_id', 'theme', 'font_size', 'glassmorphism_enabled', 'high_contrast_mode',
    'account_visibility', 'two_factor_enabled', 'show_activity_status',
    'who_can_view_profile', 'who_can_view_posts', 'who_can_view_stories', 'who_can_view_boltz',
    'push_notifications', 'email_notifications', 'in_app_notifications',
    'notify_likes', 'notify_comments', 'notify_followers', 'notify_mentions', 'notify_messages',
    'notify_boltz', 'notify_flash', 'notification_sound', 'quiet_hours_enabled',
    'quiet_hours_start', 'quiet_hours_end', 'content_filter_level',
    'biometric_lock_enabled', 'compact_mode', 'updated_at'
];

// Sanitize updates to only include valid columns
const sanitizeUpdates = (updates) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(updates)) {
        if (VALID_DB_COLUMNS.includes(key)) {
            sanitized[key] = value;
        }
    }
    return sanitized;
};

/**
 * useSettingsUpdate — Sovereign Control Center Atomic Update Hook
 * 
 * Handles debounced, optimistic UI updates with automatic rollback on error.
 * Syncs to Supabase user_settings table with offline support.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 500)
 * @param {boolean} options.optimistic - Enable optimistic UI updates (default: true)
 * @param {Function} options.onError - Callback for update errors
 * @param {Function} options.onSuccess - Callback for successful updates
 */
export const useSettingsUpdate = (options = {}) => {
    const {
        debounceMs = 500,
        optimistic = true,
        onError,
        onSuccess
    } = options;

    const { user } = useAuth();
    const [pendingUpdates, setPendingUpdates] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const debounceTimerRef = useRef(null);
    const offlineQueueRef = useRef([]);
    const isOnlineRef = useRef(navigator.onLine);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => {
            isOnlineRef.current = true;
            // Process offline queue
            if (offlineQueueRef.current.length > 0) {
                processOfflineQueue();
            }
            focusToast.success('Back online! Syncing settings...');
        };

        const handleOffline = () => {
            isOnlineRef.current = false;
            focusToast.info('Macha, the signal is weak. Settings will sync when back online.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Process offline queue when back online
    const processOfflineQueue = useCallback(async () => {
        if (!user || offlineQueueRef.current.length === 0) return;

        const queue = [...offlineQueueRef.current];
        offlineQueueRef.current = [];

        for (const update of queue) {
            try {
                await performSupabaseUpdate(update);
            } catch (err) {
                console.error('Failed to process offline update:', err);
                // Re-queue failed updates
                offlineQueueRef.current.push(update);
            }
        }
    }, [user]);

    // Perform the actual Supabase update
    const performSupabaseUpdate = useCallback(async (updates) => {
        // Sanitize to only include known columns
        const sanitizedUpdates = sanitizeUpdates(updates);
        
        // If no valid columns to update, return early
        if (Object.keys(sanitizedUpdates).length === 0) {
            console.warn('No valid settings to update');
            return null;
        }
        
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                ...sanitizedUpdates,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }, [user]);

    // Debounced update function
    const debouncedUpdate = useCallback(async (updates) => {
        if (!user) {
            focusToast.error('You must be logged in to change settings');
            return { success: false, error: 'Not logged in' };
        }

        setIsSaving(true);

        try {
            // Check if offline
            if (!isOnlineRef.current) {
                // Queue for later
                offlineQueueRef.current.push(updates);
                localStorage.setItem(`settings_pending_${user.id}`, JSON.stringify(offlineQueueRef.current));
                setIsSaving(false);
                return { success: true, offline: true };
            }

            const data = await performSupabaseUpdate(updates);
            
            setLastSaved(new Date());
            
            if (onSuccess) {
                onSuccess(data);
            }

            return { success: true, data };
        } catch (err) {
            console.error('Settings update error:', err);
            
            if (onError) {
                onError(err);
            }

            // Show user-friendly error
            if (err.message?.includes('network') || err.message?.includes('fetch')) {
                focusToast.error('Network issue. Changes saved locally and will sync later.');
            } else {
                focusToast.error('Failed to save settings. Please try again.');
            }

            return { success: false, error: err.message };
        } finally {
            setIsSaving(false);
        }
    }, [user, performSupabaseUpdate, onSuccess, onError]);

    // Main update function with debouncing
    const updateSetting = useCallback((key, value) => {
        // Update pending state immediately for tracking
        setPendingUpdates(prev => ({ ...prev, [key]: value }));

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced timer
        debounceTimerRef.current = setTimeout(() => {
            const updates = { [key]: value };
            debouncedUpdate(updates);
            setPendingUpdates({}); // Clear pending after save
        }, debounceMs);

        // Return cleanup function
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [debounceMs, debouncedUpdate]);

    // Batch update multiple settings at once
    const updateSettings = useCallback((updates) => {
        // Update pending state
        setPendingUpdates(prev => ({ ...prev, ...updates }));

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new debounced timer
        debounceTimerRef.current = setTimeout(() => {
            debouncedUpdate(updates);
            setPendingUpdates({}); // Clear pending after save
        }, debounceMs);
    }, [debounceMs, debouncedUpdate]);

    // Force immediate save (for critical settings like security)
    const saveImmediately = useCallback(async (updates) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setPendingUpdates({});
        return debouncedUpdate(updates);
    }, [debouncedUpdate]);

    // Flush pending updates (call on unmount or before critical operations)
    const flushPending = useCallback(() => {
        if (debounceTimerRef.current && Object.keys(pendingUpdates).length > 0) {
            clearTimeout(debounceTimerRef.current);
            debouncedUpdate(pendingUpdates);
            setPendingUpdates({});
        }
    }, [pendingUpdates, debouncedUpdate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            flushPending();
        };
    }, [flushPending]);

    return {
        updateSetting,
        updateSettings,
        saveImmediately,
        flushPending,
        isSaving,
        pendingUpdates,
        lastSaved,
        isOffline: !isOnlineRef.current
    };
};

export default useSettingsUpdate;
