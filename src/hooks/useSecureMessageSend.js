// ═══════════════════════════════════════════════════════════════════════
// 🔐 useSecureMessageSend - Encrypted Message Sending Hook
// Sovereign Whisper Integration
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useMessageEncryption } from './useMessageEncryption';

/**
 * Hook for sending encrypted messages
 * Integrates with the Sovereign Whisper E2EE protocol
 */
export function useSecureMessageSend(currentUserId, otherUserId, session) {
    const [sending, setSending] = useState(false);
    const [optimisticMessages, setOptimisticMessages] = useState([]);
    
    const {
        isReady: encryptionReady,
        encryptMessage,
        encryptionEnabled
    } = useMessageEncryption(null, currentUserId, otherUserId);

    /**
     * Send a message with optional encryption
     * @param {string} content - Message content
     * @param {Object} options - Message options
     */
    const sendMessage = useCallback(async (content, options = {}) => {
        if (!currentUserId || !content.trim()) {
            throw new Error('Missing required parameters');
        }

        setSending(true);
        const messageId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        try {
            // Encrypt message content
            let messageData = {
                sender_id: currentUserId,
                content: content,
                type: options.messageType || 'text',
                conversation_id: options.conversationId,
                reply_to: options.replyTo || null,
                created_at: timestamp
            };

            // Add encryption if enabled
            if (encryptionEnabled && encryptMessage) {
                const encrypted = await encryptMessage(content);
                
                if (encrypted.encrypted) {
                    messageData.ciphertext = encrypted.ciphertext;
                    messageData.initialization_vector = encrypted.iv;
                    messageData.encryption_version = encrypted.version;
                    messageData.is_encrypted = true;
                    messageData.encryption_algorithm = encrypted.algorithm;
                    // Store original content in metadata for local display
                    messageData.content = '[Encrypted]';
                }
            }

            // Add media if present
            if (options.attachments) {
                messageData.media_urls = options.attachments;
            }
            if (options.metadata) {
                messageData.content_context = options.metadata;
            }

            // Insert message
            const { data, error } = await supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            if (error) throw error;

            // If encrypted, store the message key for the recipient
            if (messageData.is_encrypted && options.conversationId) {
                await storeMessageKey(data.id, otherUserId, messageData.ciphertext);
            }

            return { success: true, message: data };
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        } finally {
            setSending(false);
        }
    }, [currentUserId, otherUserId, encryptionEnabled, encryptMessage]);

    /**
     * Store encrypted message key for recipient
     * This allows the recipient to decrypt the message
     */
    const storeMessageKey = async (messageId, recipientId, ciphertext) => {
        try {
            // In a real implementation, this would encrypt the conversation key
            // for the specific recipient. For now, we mark it in the database.
            await supabase.rpc('store_message_key', {
                p_message_id: messageId,
                p_recipient_id: recipientId,
                p_encrypted_key: ciphertext // Simplified - in production, this is the encrypted AES key
            });
        } catch (err) {
            console.warn('Failed to store message key:', err);
            // Don't fail the send if key storage fails
        }
    };

    /**
     * Send a batch of messages (for offline sync)
     * @param {Array} messages - Array of message objects
     */
    const sendBatch = useCallback(async (messages) => {
        const results = await Promise.allSettled(
            messages.map(msg => sendMessage(msg.content, msg.options))
        );

        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        return { succeeded, failed, results };
    }, [sendMessage]);

    /**
     * Add an optimistic message (for UI preview)
     */
    const addOptimisticMessage = useCallback((message) => {
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMessage = {
            id: optimisticId,
            ...message,
            optimistic: true,
            created_at: new Date().toISOString()
        };
        
        setOptimisticMessages(prev => [...prev, optimisticMessage]);
        return optimisticId;
    }, []);

    /**
     * Remove an optimistic message after confirmation
     */
    const removeOptimisticMessage = useCallback((optimisticId) => {
        setOptimisticMessages(prev => 
            prev.filter(m => m.id !== optimisticId)
        );
    }, []);

    /**
     * Clear all optimistic messages
     */
    const clearOptimisticMessages = useCallback(() => {
        setOptimisticMessages([]);
    }, []);

    return {
        sendMessage,
        sendBatch,
        sending,
        encryptionReady,
        encryptionEnabled,
        optimisticMessages,
        addOptimisticMessage,
        removeOptimisticMessage,
        clearOptimisticMessages
    };
}

/**
 * Hook for managing offline message queue with encryption
 */
export function useOfflineMessageQueue(userId) {
    const QUEUE_KEY = `offline_messages_${userId}`;

    const getQueue = () => {
        try {
            const queue = localStorage.getItem(QUEUE_KEY);
            return queue ? JSON.parse(queue) : [];
        } catch {
            return [];
        }
    };

    const setQueue = (queue) => {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    };

    const addToQueue = (content, options) => {
        const queue = getQueue();
        queue.push({
            id: crypto.randomUUID(),
            content,
            options,
            timestamp: Date.now(),
            retries: 0
        });
        setQueue(queue);
    };

    const removeFromQueue = (messageId) => {
        const queue = getQueue().filter(m => m.id !== messageId);
        setQueue(queue);
    };

    const getPendingCount = () => {
        return getQueue().length;
    };

    const clearQueue = () => {
        localStorage.removeItem(QUEUE_KEY);
    };

    return {
        getQueue,
        addToQueue,
        removeFromQueue,
        getPendingCount,
        clearQueue
    };
}

export default useSecureMessageSend;
