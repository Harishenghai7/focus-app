import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for managing disappearing messages
 * Supports view-once media and timed messages
 */
export const useDisappearingMessages = () => {
    const [setting, setSetting] = useState(null);

    // Set disappearing message timer for conversation
    const setDisappearingTimer = useCallback(async (conversationId, duration) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .update({
                    disappearing_messages_enabled: duration > 0,
                    disappearing_messages_duration: duration
                })
                .eq('id', conversationId);

            if (error) throw error;

            setSetting(duration);
            focusToast.success(
                duration > 0
                    ? `Messages will disappear after ${formatDuration(duration)}`
                    : 'Disappearing messages turned off'
            );
            return true;
        } catch (error) {
            console.error('Error setting disappearing timer:', error);
            focusToast.error('Failed to update settings');
            return false;
        }
    }, []);

    // Send view-once message
    const sendViewOnce = useCallback(async (messageData) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    ...messageData,
                    is_view_once: true,
                    viewed_at: null
                })
                .select()
                .single();

            if (error) throw error;

            focusToast.success('View-once message sent');
            return data;
        } catch (error) {
            console.error('Error sending view-once message:', error);
            focusToast.error('Failed to send message');
            return null;
        }
    }, []);

    // Mark view-once message as viewed
    const markAsViewed = useCallback(async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    viewed_at: new Date().toISOString(),
                    is_deleted: true // Auto-delete after viewing
                })
                .eq('id', messageId)
                .eq('is_view_once', true);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error marking as viewed:', error);
            return false;
        }
    }, []);

    // Format duration for display
    const formatDuration = (seconds) => {
        if (seconds === 86400) return '24 hours';
        if (seconds === 604800) return '7 days';
        if (seconds === 7776000) return '90 days';
        return `${seconds} seconds`;
    };

    return {
        setting,
        setDisappearingTimer,
        sendViewOnce,
        markAsViewed,
        formatDuration
    };
};
