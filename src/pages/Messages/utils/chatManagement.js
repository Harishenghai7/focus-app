/* ═══════════════════════════════════════════════════════════════════════
   EXPORT CHAT UTILITY - Export conversation history
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import { supabase } from '../../../lib/supabase';
import { formatFullTimestamp } from './messageHelpers';

/**
 * Export conversation to JSON
 */
export const exportToJSON = async (conversationId) => {
    try {
        const { data: messages } = await supabase
            .from('messages')
            .select('*, profiles(*)')
            .eq('conversation_id', conversationId)
            .eq('deleted', false)
            .order('created_at', { ascending: true });

        const exportData = {
            exported_at: new Date().toISOString(),
            conversation_id: conversationId,
            message_count: messages.length,
            messages: messages.map(msg => ({
                sender: msg.profiles?.username || 'Unknown',
                content: msg.content,
                type: msg.type,
                timestamp: msg.created_at,
                reactions: msg.reactions
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${conversationId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting to JSON:', error);
        return false;
    }
};

/**
 * Export conversation to TXT
 */
export const exportToTXT = async (conversationId) => {
    try {
        const { data: messages } = await supabase
            .from('messages')
            .select('*, profiles(*)')
            .eq('conversation_id', conversationId)
            .eq('deleted', false)
            .order('created_at', { ascending: true });

        let txtContent = `Focus Messages - Chat Export\n`;
        txtContent += `Exported: ${formatFullTimestamp(new Date())}\n`;
        txtContent += `Total Messages: ${messages.length}\n`;
        txtContent += `${'='.repeat(50)}\n\n`;

        messages.forEach(msg => {
            txtContent += `[${formatFullTimestamp(msg.created_at)}]\n`;
            txtContent += `${msg.profiles?.username || 'Unknown'}: ${msg.content || `[${msg.type}]`}\n\n`;
        });

        const blob = new Blob([txtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${conversationId}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting to TXT:', error);
        return false;
    }
};

/**
 * Clear chat history (delete all messages for current user)
 */
export const clearChatHistory = async (conversationId, userId) => {
    try {
        const { data: messages } = await supabase
            .from('messages')
            .select('id, deleted_for')
            .eq('conversation_id', conversationId);

        // Update each message to add user to deleted_for array
        for (const msg of messages) {
            const deletedFor = msg.deleted_for || [];
            if (!deletedFor.includes(userId)) {
                await supabase
                    .from('messages')
                    .update({
                        deleted_for: [...deletedFor, userId]
                    })
                    .eq('id', msg.id);
            }
        }

        return true;
    } catch (error) {
        console.error('Error clearing chat history:', error);
        return false;
    }
};

/**
 * Delete conversation permanently
 */
export const deleteConversation = async (conversationId, userId) => {
    try {
        // First, remove user from participants
        const { data: conv } = await supabase
            .from('conversations')
            .select('participants')
            .eq('id', conversationId)
            .single();

        if (conv) {
            const participants = JSON.parse(conv.participants || '[]');
            const updatedParticipants = participants.filter(p => p !== userId);

            if (updatedParticipants.length === 0) {
                // If no participants left, delete conversation
                await supabase
                    .from('conversations')
                    .delete()
                    .eq('id', conversationId);
            } else {
                // Otherwise, just remove user
                await supabase
                    .from('conversations')
                    .update({
                        participants: JSON.stringify(updatedParticipants)
                    })
                    .eq('id', conversationId);
            }
        }

        return true;
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return false;
    }
};
