import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for managing read receipt settings
 * Allows users to control read receipt visibility
 */
export const useReadReceiptSettings = (userId) => {
    const [globalSetting, setGlobalSetting] = useState(true);
    const [conversationSettings, setConversationSettings] = useState({});
    const [loading, setLoading] = useState(false);

    // Load settings on mount
    useEffect(() => {
        if (userId) {
            loadSettings();
        }
    }, [userId]);

    // Load user's read receipt settings
    const loadSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('read_receipts_enabled, read_receipt_settings')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setGlobalSetting(data.read_receipts_enabled !== false);
            setConversationSettings(data.read_receipt_settings || {});
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }, [userId]);

    // Toggle global read receipts
    const toggleGlobalReadReceipts = useCallback(async () => {
        setLoading(true);
        try {
            const newSetting = !globalSetting;

            const { error } = await supabase
                .from('profiles')
                .update({ read_receipts_enabled: newSetting })
                .eq('id', userId);

            if (error) throw error;

            setGlobalSetting(newSetting);
            focusToast.success(
                newSetting
                    ? 'Read receipts enabled'
                    : 'Read receipts disabled'
            );
            return true;
        } catch (error) {
            console.error('Error toggling read receipts:', error);
            focusToast.error('Failed to update settings');
            return false;
        } finally {
            setLoading(false);
        }
    }, [globalSetting, userId]);

    // Set read receipt for specific conversation
    const setConversationReadReceipt = useCallback(async (conversationId, enabled) => {
        setLoading(true);
        try {
            const newSettings = {
                ...conversationSettings,
                [conversationId]: enabled
            };

            const { error } = await supabase
                .from('profiles')
                .update({ read_receipt_settings: newSettings })
                .eq('id', userId);

            if (error) throw error;

            setConversationSettings(newSettings);
            focusToast.success(
                enabled
                    ? 'Read receipts enabled for this chat'
                    : 'Read receipts disabled for this chat'
            );
            return true;
        } catch (error) {
            console.error('Error updating conversation setting:', error);
            focusToast.error('Failed to update settings');
            return false;
        } finally {
            setLoading(false);
        }
    }, [conversationSettings, userId]);

    // Check if read receipts are enabled for a conversation
    const areReadReceiptsEnabled = useCallback((conversationId) => {
        // Check conversation-specific setting first
        if (conversationSettings.hasOwnProperty(conversationId)) {
            return conversationSettings[conversationId];
        }
        // Fall back to global setting
        return globalSetting;
    }, [conversationSettings, globalSetting]);

    return {
        globalSetting,
        conversationSettings,
        loading,
        toggleGlobalReadReceipts,
        setConversationReadReceipt,
        areReadReceiptsEnabled
    };
};
