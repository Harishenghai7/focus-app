import { useState } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

export const useMessageSend = (senderId, receiverId, session) => {
    const [sending, setSending] = useState(false);
    const [optimisticMessages, setOptimisticMessages] = useState([]);

    const sendMessage = async (content, options = {}) => {
        const {
            replyTo = null,
            attachments = [],
            messageType = 'text'
        } = options;

        // Create optimistic message
        const optimisticId = `temp_${Date.now()}`;
        const optimisticMessage = {
            id: optimisticId,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            message_type: messageType,
            reply_to: replyTo,
            attachments,
            created_at: new Date().toISOString(),
            is_read: false,
            is_delivered: false,
            is_edited: false,
            _optimistic: true
        };

        setOptimisticMessages(prev => [...prev, optimisticMessage]);

        try {
            setSending(true);

            const msgType = options.type || options.messageType || 'text';
            const replyToId = options.replyTo || options.reply_to_message_id || null;

            console.log('📤 sendMessage called:', {
                senderId,
                receiverId,
                conversationId: options.conversationId,
                content,
                msgType,
                metadata: options.metadata,
                attachmentData: options.attachmentData
            });

            if (!session) {
                throw new Error('No active session - please log in');
            }

            // Prepare message payload based on type
            let messageContent = content;
            let messageAttachments = null;

            // Handle different message types
            if (msgType === 'gif' && options.metadata?.url) {
                // For GIFs, store the URL in content
                messageContent = options.metadata.url;
            } else if (msgType === 'sticker' && options.metadata?.url) {
                // For Stickers, store the URL in content
                messageContent = options.metadata.url;
            } else if ((msgType === 'image' || msgType === 'video') && options.attachmentData) {
                // For images/videos, create attachments array
                messageAttachments = [{
                    url: options.attachmentData.url,
                    name: options.attachmentData.name || 'attachment',
                    size: options.attachmentData.size,
                    type: msgType
                }];
            }

            const payload = {
                sender_id: senderId,
                conversation_id: options.conversationId,
                content: messageContent,
                type: msgType,
                reply_to_message_id: replyToId
            };

            // Add attachments if present
            if (messageAttachments) {
                payload.attachments = messageAttachments;
            }

            console.log('📦 Final payload:', payload);

            const response = await fetch(`${supabaseUrl}/rest/v1/messages`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            console.log('📥 Fetch completed! Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ REST API error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            console.log('✅ Message sent successfully:', data);

            return data;
        } catch (err) {
            console.error('❌ Error sending message:', err);
            focusToast.error('Failed to send message');

            // Mark optimistic message as failed
            setOptimisticMessages(prev => prev.map(msg =>
                msg.id === optimisticId ? { ...msg, _failed: true } : msg
            ));

            throw err;
        } finally {
            setSending(false);
        }
    };

    const retryMessage = async (optimisticId) => {
        const message = optimisticMessages.find(msg => msg.id === optimisticId);
        if (!message) return;

        // Remove failed message
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticId));

        // Retry sending
        await sendMessage(message.content, {
            replyTo: message.reply_to,
            attachments: message.attachments || [],
            messageType: message.message_type
        });
    };

    const clearOptimisticMessages = () => {
        setOptimisticMessages([]);
    };

    return {
        sendMessage,
        sending,
        optimisticMessages,
        retryMessage,
        clearOptimisticMessages
    };
};
