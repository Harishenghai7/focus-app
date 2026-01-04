import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for editing messages
 * Supports 15-minute edit window like Instagram
 * Tracks edit history in database
 */
export const useMessageEdit = () => {
    const [editing, setEditing] = useState(false);

    // Check if message can be edited (within 15 minutes)
    const canEdit = useCallback((message, currentUserId) => {
        if (!message || message.sender_id !== currentUserId) return false;
        if (message.is_deleted) return false;

        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - messageTime) / 1000 / 60;

        return diffMinutes <= 15; // 15-minute edit window
    }, []);

    // Edit a message
    const editMessage = useCallback(async (messageId, newContent, originalContent) => {
        if (!messageId || !newContent || !newContent.trim()) {
            focusToast.error('Message content cannot be empty');
            return false;
        }

        if (newContent.trim() === originalContent?.trim()) {
            focusToast.info('No changes made');
            return false;
        }

        setEditing(true);
        try {
            // Save to edit history first
            const { error: historyError } = await supabase
                .from('message_edit_history')
                .insert({
                    message_id: messageId,
                    previous_content: originalContent,
                    edited_at: new Date().toISOString()
                });

            if (historyError) {
                console.error('Failed to save edit history:', historyError);
                // Continue anyway - edit history is optional
            }

            // Update the message
            const { data, error } = await supabase
                .from('messages')
                .update({
                    content: newContent.trim(),
                    is_edited: true,
                    edited_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Message edited successfully');
            return true;
        } catch (error) {
            console.error('Error editing message:', error);
            focusToast.error('Failed to edit message');
            return false;
        } finally {
            setEditing(false);
        }
    }, []);

    // Edit a group message
    const editGroupMessage = useCallback(async (messageId, newContent, originalContent) => {
        if (!messageId || !newContent || !newContent.trim()) {
            focusToast.error('Message content cannot be empty');
            return false;
        }

        if (newContent.trim() === originalContent?.trim()) {
            focusToast.info('No changes made');
            return false;
        }

        setEditing(true);
        try {
            // Save to edit history
            const { error: historyError } = await supabase
                .from('message_edit_history')
                .insert({
                    group_message_id: messageId,
                    previous_content: originalContent,
                    edited_at: new Date().toISOString()
                });

            if (historyError) {
                console.error('Failed to save edit history:', historyError);
            }

            // Update the group message
            const { data, error } = await supabase
                .from('group_messages')
                .update({
                    content: newContent.trim(),
                    is_edited: true,
                    edited_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .select()
                .single();

            if (error) throw error;

            focusToast.success('Message edited successfully');
            return true;
        } catch (error) {
            console.error('Error editing group message:', error);
            focusToast.error('Failed to edit message');
            return false;
        } finally {
            setEditing(false);
        }
    }, []);

    // Get edit history for a message
    const getEditHistory = useCallback(async (messageId, isGroupMessage = false) => {
        try {
            const column = isGroupMessage ? 'group_message_id' : 'message_id';
            const { data, error } = await supabase
                .from('message_edit_history')
                .select('*')
                .eq(column, messageId)
                .order('edited_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching edit history:', error);
            return [];
        }
    }, []);

    return {
        editing,
        canEdit,
        editMessage,
        editGroupMessage,
        getEditHistory
    };
};
