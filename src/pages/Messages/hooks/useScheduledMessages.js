/* ═══════════════════════════════════════════════════════════════════════
   MESSAGE SCHEDULING HOOK - Schedule messages for later
   Phase 5: Future Enhancements
   ═══════════════════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export const useScheduledMessages = (userId) => {
    const [scheduledMessages, setScheduledMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchScheduledMessages();

            // Check every minute for messages to send
            const interval = setInterval(checkAndSendScheduled, 60000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const fetchScheduledMessages = async () => {
        try {
            const { data } = await supabase
                .from('scheduled_messages')
                .select('*')
                .eq('sender_id', userId)
                .eq('sent', false)
                .order('scheduled_for', { ascending: true });

            setScheduledMessages(data || []);
        } catch (error) {
            console.error('Error fetching scheduled messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scheduleMessage = async (conversationId, content, scheduledFor, messageData = {}) => {
        try {
            const { data, error } = await supabase
                .from('scheduled_messages')
                .insert({
                    sender_id: userId,
                    conversation_id: conversationId,
                    content,
                    scheduled_for: scheduledFor,
                    message_data: messageData,
                    sent: false
                })
                .select()
                .single();

            if (error) throw error;

            await fetchScheduledMessages();
            return data;
        } catch (error) {
            console.error('Error scheduling message:', error);
            return null;
        }
    };

    const cancelScheduled = async (scheduledId) => {
        try {
            await supabase
                .from('scheduled_messages')
                .delete()
                .eq('id', scheduledId);

            await fetchScheduledMessages();
            return true;
        } catch (error) {
            console.error('Error canceling scheduled message:', error);
            return false;
        }
    };

    const checkAndSendScheduled = async () => {
        try {
            const now = new Date().toISOString();

            const { data: dueMessages } = await supabase
                .from('scheduled_messages')
                .select('*')
                .eq('sender_id', userId)
                .eq('sent', false)
                .lte('scheduled_for', now);

            for (const scheduled of dueMessages || []) {
                // Send the message
                await supabase
                    .from('messages')
                    .insert({
                        conversation_id: scheduled.conversation_id,
                        sender_id: scheduled.sender_id,
                        content: scheduled.content,
                        ...scheduled.message_data
                    });

                // Mark as sent
                await supabase
                    .from('scheduled_messages')
                    .update({ sent: true })
                    .eq('id', scheduled.id);
            }

            if (dueMessages?.length > 0) {
                await fetchScheduledMessages();
            }
        } catch (error) {
            console.error('Error sending scheduled messages:', error);
        }
    };

    return {
        scheduledMessages,
        loading,
        scheduleMessage,
        cancelScheduled
    };
};
