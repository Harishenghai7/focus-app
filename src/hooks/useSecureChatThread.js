// ═══════════════════════════════════════════════════════════════════════
// 🔐 useSecureChatThread - Encrypted Chat Thread Hook
// Sovereign Whisper Integration with Real-time Decryption
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useMessageEncryption } from './useMessageEncryption';

/**
 * Hook for managing an encrypted chat thread
 * Automatically decrypts messages as they arrive
 */
export function useSecureChatThread(currentUserId, conversationId, session) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [otherUser, setOtherUser] = useState(null);
    const [error, setError] = useState(null);
    const [otherUserId, setOtherUserId] = useState(null);
    
    const decryptedCache = useRef(new Map());
    const subscriptionRef = useRef(null);

    // Initialize encryption hook (need otherUserId first)
    const {
        decryptMessage,
        decryptMessages,
        encryptionEnabled
    } = useMessageEncryption(conversationId, currentUserId, otherUserId);

    // Fetch conversation and get other participant
    useEffect(() => {
        if (!conversationId || !currentUserId) return;

        const fetchConversation = async () => {
            try {
                const { data, error } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', conversationId)
                    .single();

                if (error) throw error;

                if (data) {
                    // Find the other participant
                    const participants = data.participants || [];
                    const other = participants.find(p => p !== currentUserId);
                    if (other) {
                        setOtherUserId(other);
                        
                        // Fetch other user details
                        const { data: userData } = await supabase
                            .from('profiles')
                            .select('id, username, full_name, avatar_url, is_online, last_seen')
                            .eq('id', other)
                            .single();
                        
                        setOtherUser(userData);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch conversation:', err);
            }
        };

        fetchConversation();
    }, [conversationId, currentUserId]);

    // Fetch and decrypt messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!sender_id(id, username, full_name, avatar_url)
                `)
                .eq('conversation_id', conversationId)
                .eq('deleted', false)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            // Decrypt messages if encryption is enabled
            let processedMessages = data || [];
            
            if (encryptionEnabled && decryptMessages) {
                processedMessages = await decryptMessages(data || []);
            } else {
                // Manual decryption for encrypted messages
                processedMessages = await Promise.all(
                    (data || []).map(async (msg) => {
                        if (msg.is_encrypted || msg.ciphertext) {
                            // Check cache first
                            if (decryptedCache.current.has(msg.id)) {
                                return { ...msg, content: decryptedCache.current.get(msg.id) };
                            }
                            
                            // Try to decrypt
                            try {
                                const decrypted = await decryptMessage?.(msg);
                                if (decrypted) {
                                    decryptedCache.current.set(msg.id, decrypted);
                                    return { ...msg, content: decrypted };
                                }
                            } catch (err) {
                                console.warn('Failed to decrypt message:', msg.id);
                                return { ...msg, content: '🔒 Encrypted message' };
                            }
                        }
                        return msg;
                    })
                );
            }

            setMessages(processedMessages);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [conversationId, encryptionEnabled, decryptMessage, decryptMessages]);

    // Initial fetch
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Subscribe to real-time message updates
    useEffect(() => {
        if (!conversationId) return;

        // Clean up previous subscription
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        // Create new subscription
        const subscription = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    const newMessage = payload.new;
                    
                    // Decrypt if encrypted
                    if (newMessage.is_encrypted || newMessage.ciphertext) {
                        try {
                            const decrypted = await decryptMessage?.(newMessage);
                            if (decrypted) {
                                newMessage.content = decrypted;
                                decryptedCache.current.set(newMessage.id, decrypted);
                            }
                        } catch (err) {
                            newMessage.content = '🔒 Encrypted message';
                        }
                    }

                    // Fetch sender details
                    const { data: senderData } = await supabase
                        .from('profiles')
                        .select('id, username, full_name, avatar_url')
                        .eq('id', newMessage.sender_id)
                        .single();

                    if (senderData) {
                        newMessage.sender = senderData;
                    }

                    setMessages(prev => {
                        // Avoid duplicates
                        if (prev.some(m => m.id === newMessage.id)) {
                            return prev;
                        }
                        return [...prev, newMessage];
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const updatedMessage = payload.new;
                    
                    setMessages(prev => 
                        prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
                    );
                }
            )
            .subscribe();

        subscriptionRef.current = subscription;

        return () => {
            subscription.unsubscribe();
        };
    }, [conversationId, decryptMessage]);

    // Mark messages as read
    const markAsRead = useCallback(async () => {
        if (!conversationId || !currentUserId) return;

        try {
            await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId,
                p_user_id: currentUserId
            });
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    }, [conversationId, currentUserId]);

    // Send a message (placeholder - actual sending is in useSecureMessageSend)
    const sendMessage = useCallback(async (content, options = {}) => {
        // This is handled by useSecureMessageSend hook
        // This function is here for API compatibility
        console.warn('Use useSecureMessageSend for sending messages');
    }, []);

    // Refetch messages
    const refetch = useCallback(() => {
        return fetchMessages();
    }, [fetchMessages]);

    // Get unread count
    const getUnreadCount = useCallback(() => {
        return messages.filter(
            m => m.sender_id !== currentUserId && 
            !(m.read_by || []).includes(currentUserId)
        ).length;
    }, [messages, currentUserId]);

    return {
        messages,
        loading,
        error,
        otherUser,
        otherUserId,
        encryptionEnabled,
        sendMessage,
        markAsRead,
        refetch,
        getUnreadCount
    };
}

/**
 * Hook for managing multiple encrypted conversations
 */
export function useSecureConversations(currentUserId) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId) return;

        const fetchConversations = async () => {
            setLoading(true);
            
            try {
                const { data, error } = await supabase
                    .from('conversations')
                    .select(`
                        *,
                        lastMessage:messages!last_message_id(content, created_at, sender_id, is_encrypted),
                        settings:conversation_settings(user_id, pinned, muted, read_receipts_enabled)
                    `)
                    .contains('participants', [currentUserId])
                    .order('last_message_at', { ascending: false });

                if (error) throw error;

                // Process conversations with other user details
                const processed = await Promise.all(
                    (data || []).map(async (conv) => {
                        const otherId = conv.participants?.find(p => p !== currentUserId);
                        
                        if (otherId) {
                            const { data: userData } = await supabase
                                .from('profiles')
                                .select('id, username, full_name, avatar_url, is_online, last_seen')
                                .eq('id', otherId)
                                .single();
                            
                            return {
                                ...conv,
                                otherUser: userData,
                                hasUnread: conv.lastMessage?.sender_id !== currentUserId &&
                                    !conv.lastMessage?.read_by?.includes(currentUserId)
                            };
                        }
                        return conv;
                    })
                );

                setConversations(processed);
            } catch (err) {
                console.error('Failed to fetch conversations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        // Subscribe to conversation updates
        const subscription = supabase
            .channel('conversations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations'
                },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [currentUserId]);

    return {
        conversations,
        loading
    };
}

export default useSecureChatThread;
