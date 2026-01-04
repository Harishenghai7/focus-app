import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

/**
 * Hook for forwarding messages
 * Supports forwarding to multiple chats (1-on-1 and groups)
 * Tracks forward count like WhatsApp
 */
export const useMessageForward = () => {
    const [forwarding, setForwarding] = useState(false);

    // Forward message to 1-on-1 conversation
    const forwardToConversation = useCallback(async (originalMessage, recipientId, currentUserId) => {
        if (!originalMessage || !recipientId || !currentUserId) return false;

        try {
            // Create new message with forwarded flag
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUserId,
                    receiver_id: recipientId,
                    content: originalMessage.content || '',
                    message_type: originalMessage.message_type || 'text',
                    attachments: originalMessage.attachments || [],
                    forwarded_from: originalMessage.id,
                    forward_count: (originalMessage.forward_count || 0) + 1
                })
                .select()
                .single();

            if (error) throw error;

            // Update original message forward count
            await supabase
                .from('messages')
                .update({
                    forward_count: (originalMessage.forward_count || 0) + 1
                })
                .eq('id', originalMessage.id);

            return true;
        } catch (error) {
            console.error('Error forwarding to conversation:', error);
            throw error;
        }
    }, []);

    // Forward message to group
    const forwardToGroup = useCallback(async (originalMessage, groupId, currentUserId) => {
        if (!originalMessage || !groupId || !currentUserId) return false;

        try {
            // Create new group message with forwarded flag
            const { data, error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    sender_id: currentUserId,
                    content: originalMessage.content || '',
                    message_type: originalMessage.message_type || 'text',
                    attachments: originalMessage.attachments || [],
                    forwarded_from: originalMessage.id
                })
                .select()
                .single();

            if (error) throw error;

            // Update original message forward count
            const tableName = originalMessage.group_id ? 'group_messages' : 'messages';
            await supabase
                .from(tableName)
                .update({
                    forward_count: (originalMessage.forward_count || 0) + 1
                })
                .eq('id', originalMessage.id);

            return true;
        } catch (error) {
            console.error('Error forwarding to group:', error);
            throw error;
        }
    }, []);

    // Forward to multiple recipients
    const forwardToMultiple = useCallback(async (originalMessage, recipients, currentUserId) => {
        if (!originalMessage || !recipients || recipients.length === 0) {
            focusToast.error('Please select at least one recipient');
            return false;
        }

        setForwarding(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const recipient of recipients) {
                try {
                    if (recipient.type === 'user') {
                        await forwardToConversation(originalMessage, recipient.id, currentUserId);
                        successCount++;
                    } else if (recipient.type === 'group') {
                        await forwardToGroup(originalMessage, recipient.id, currentUserId);
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Failed to forward to ${recipient.type} ${recipient.id}:`, error);
                    failCount++;
                }
            }

            if (successCount > 0) {
                focusToast.success(`Message forwarded to ${successCount} ${successCount === 1 ? 'chat' : 'chats'}`);
            }
            if (failCount > 0) {
                focusToast.error(`Failed to forward to ${failCount} ${failCount === 1 ? 'chat' : 'chats'}`);
            }

            return successCount > 0;
        } catch (error) {
            console.error('Error forwarding messages:', error);
            focusToast.error('Failed to forward message');
            return false;
        } finally {
            setForwarding(false);
        }
    }, [forwardToConversation, forwardToGroup]);

    // Get list of conversations for forwarding
    const getForwardableChats = useCallback(async (currentUserId) => {
        if (!currentUserId) return [];

        try {
            // Get 1-on-1 conversations
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select(`
                    id,
                    user1_id,
                    user2_id,
                    profiles!conversations_user1_id_fkey (
                        id,
                        username,
                        full_name,
                        avatar_url
                    )
                `)
                .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
                .order('updated_at', { ascending: false });

            if (convError) throw convError;

            // Get group conversations
            const { data: groups, error: groupError } = await supabase
                .from('group_participants')
                .select(`
                    group_conversations (
                        id,
                        name,
                        avatar_url,
                        description
                    )
                `)
                .eq('user_id', currentUserId)
                .order('joined_at', { ascending: false });

            if (groupError) throw groupError;

            // Format conversations
            const formattedConvs = (conversations || []).map(conv => {
                const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
                return {
                    id: otherUserId,
                    type: 'user',
                    name: conv.profiles?.full_name || conv.profiles?.username || 'Unknown',
                    username: conv.profiles?.username,
                    avatar: conv.profiles?.avatar_url,
                    conversationId: conv.id
                };
            });

            // Format groups
            const formattedGroups = (groups || [])
                .filter(g => g.group_conversations)
                .map(g => ({
                    id: g.group_conversations.id,
                    type: 'group',
                    name: g.group_conversations.name,
                    avatar: g.group_conversations.avatar_url,
                    description: g.group_conversations.description
                }));

            return [...formattedConvs, ...formattedGroups];
        } catch (error) {
            console.error('Error fetching forwardable chats:', error);
            return [];
        }
    }, []);

    return {
        forwarding,
        forwardToConversation,
        forwardToGroup,
        forwardToMultiple,
        getForwardableChats
    };
};
