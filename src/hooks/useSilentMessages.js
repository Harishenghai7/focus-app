import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for sending silent messages
 * Messages that don't trigger notifications (Instagram-style)
 */
export const useSilentMessages = () => {
    const [sending, setSending] = useState(false);

    // Send silent message (1-on-1)
    const sendSilentMessage = useCallback(async (messageData) => {
        setSending(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    ...messageData,
                    is_silent: true,
                    notification_sent: false
                })
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Silent message sent');
            return data;
        } catch (error) {
            console.error('Error sending silent message:', error);
            focusToast.error('Failed to send message');
            return null;
        } finally {
            setSending(false);
        }
    }, []);

    // Send silent group message
    const sendSilentGroupMessage = useCallback(async (messageData) => {
        setSending(true);
        try {
            const { data, error } = await supabase
                .from('group_messages')
                .insert({
                    ...messageData,
                    is_silent: true,
                    notification_sent: false
                })
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Silent message sent');
            return data;
        } catch (error) {
            console.error('Error sending silent group message:', error);
            focusToast.error('Failed to send message');
            return null;
        } finally {
            setSending(false);
        }
    }, []);

    // Check if message is silent
    const isSilent = useCallback((message) => {
        return message.is_silent === true;
    }, []);

    return {
        sending,
        sendSilentMessage,
        sendSilentGroupMessage,
        isSilent
    };
};
