import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { focusToast } from '../utils/focusToast';

export const useUpdateSetting = () => {
    const { user } = useAuth();
    const [updating, setUpdating] = useState(false);

    const updateSetting = async (key, value, optimisticUpdate = null) => {
        if (!user) {
            focusToast.error('You must be logged in to update settings');
            return { success: false };
        }

        setUpdating(true);

        // Store previous value for rollback
        let previousValue = null;
        if (optimisticUpdate) {
            previousValue = optimisticUpdate();
        }

        try {
            const updateData = {
                user_id: user.id,
                [key]: value,
                updated_at: new Date().toISOString()
            };

            // Use upsert instead of update to handle missing rows
            const { error } = await supabase
                .from('user_settings')
                .upsert(updateData, { onConflict: 'user_id' });

            if (error) throw error;


            // Dispatch event to trigger re-fetch in useSettings
            window.dispatchEvent(new CustomEvent('settings-updated'));
            return { success: true };
        } catch (err) {
            console.error('Error updating setting:', err);
            focusToast.error('Failed to update setting');

            // Rollback optimistic update
            if (optimisticUpdate && previousValue !== null) {
                optimisticUpdate(previousValue);
            }

            return { success: false, error: err.message };
        } finally {
            setUpdating(false);
        }
    };

    const updateMultipleSettings = async (updates, optimisticUpdate = null) => {
        if (!user) {
            focusToast.error('You must be logged in to update settings');
            return { success: false };
        }

        setUpdating(true);

        // Store previous values for rollback
        let previousValues = null;
        if (optimisticUpdate) {
            previousValues = optimisticUpdate();
        }

        try {
            const updateData = {
                user_id: user.id,
                ...updates,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('user_settings')
                .upsert(updateData, { onConflict: 'user_id' });

            if (error) throw error;

            focusToast.success('Settings updated successfully');
            window.dispatchEvent(new CustomEvent('settings-updated'));
            return { success: true };
        } catch (err) {
            console.error('Error updating settings:', err);
            focusToast.error('Failed to update settings');

            // Rollback optimistic update
            if (optimisticUpdate && previousValues !== null) {
                optimisticUpdate(previousValues);
            }

            return { success: false, error: err.message };
        } finally {
            setUpdating(false);
        }
    };

    return { updateSetting, updateMultipleSettings, updating };
};
