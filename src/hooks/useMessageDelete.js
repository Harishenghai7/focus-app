import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for deleting messages
 * Supports "Delete for me" and "Delete for everyone" (unsend)
 * Like Instagram and WhatsApp
 */
export const useMessageDelete = () => {
    const [deleting, setDeleting] = useState(false);

    // Check if message can be deleted for everyone (within time limit - optional)
    const canDeleteForEveryone = useCallback((message, currentUserId) => {
        if (!message || message.sender_id !== currentUserId) return false;
        if (message.is_deleted) return false;

        // Optional: Add time limit for delete-for-everyone (e.g., 1 hour)
        // const messageTime = new Date(message.created_at);
        // const now = new Date();
        // const diffMinutes = (now - messageTime) / 1000 / 60;
        // return diffMinutes <= 60; // 1-hour limit

        return true; // No time limit (like WhatsApp)
    }, []);

    // Delete message for current user only
    const deleteForMe = useCallback(async (messageId, currentUserId) => {
        if (!messageId || !currentUserId) return false;

        setDeleting(true);
        try {
            // Mark message as deleted for this user
            // We'll store deleted_for array in the message
            const { data: message, error: fetchError } = await supabase
                .from('messages')
                .select('deleted_for')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const deletedFor = message.deleted_for || [];
            if (!deletedFor.includes(currentUserId)) {
                deletedFor.push(currentUserId);
            }

            const { error } = await supabase
                .from('messages')
                .update({ deleted_for: deletedFor })
                .eq('id', messageId);

            if (error) throw error;

            focusToast.success('Message deleted for you');
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            focusToast.error('Failed to delete message');
            return false;
        } finally {
            setDeleting(false);
        }
    }, []);

    // Delete message for everyone (unsend)
    const deleteForEveryone = useCallback(async (messageId) => {
        if (!messageId) return false;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    delete_for_everyone: true,
                    content: '' // Clear content for privacy
                })
                .eq('id', messageId);

            if (error) throw error;

            focusToast.success('Message deleted for everyone');
            return true;
        } catch (error) {
            console.error('Error deleting message for everyone:', error);
            focusToast.error('Failed to delete message');
            return false;
        } finally {
            setDeleting(false);
        }
    }, []);

    // Delete group message for current user only
    const deleteGroupMessageForMe = useCallback(async (messageId, currentUserId) => {
        if (!messageId || !currentUserId) return false;

        setDeleting(true);
        try {
            const { data: message, error: fetchError } = await supabase
                .from('group_messages')
                .select('deleted_for')
                .eq('id', messageId)
                .single();

            if (fetchError) throw fetchError;

            const deletedFor = message.deleted_for || [];
            if (!deletedFor.includes(currentUserId)) {
                deletedFor.push(currentUserId);
            }

            const { error } = await supabase
                .from('group_messages')
                .update({ deleted_for: deletedFor })
                .eq('id', messageId);

            if (error) throw error;

            focusToast.success('Message deleted for you');
            return true;
        } catch (error) {
            console.error('Error deleting group message:', error);
            focusToast.error('Failed to delete message');
            return false;
        } finally {
            setDeleting(false);
        }
    }, []);

    // Delete group message for everyone
    const deleteGroupMessageForEveryone = useCallback(async (messageId) => {
        if (!messageId) return false;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('group_messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    content: ''
                })
                .eq('id', messageId);

            if (error) throw error;

            focusToast.success('Message deleted for everyone');
            return true;
        } catch (error) {
            console.error('Error deleting group message for everyone:', error);
            focusToast.error('Failed to delete message');
            return false;
        } finally {
            setDeleting(false);
        }
    }, []);

    return {
        deleting,
        canDeleteForEveryone,
        deleteForMe,
        deleteForEveryone,
        deleteGroupMessageForMe,
        deleteGroupMessageForEveryone
    };
};
