import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

export const useChatThread = (currentUserId, conversationId, session) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [participants, setParticipants] = useState([]);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        if (!currentUserId || !conversationId) return;

        fetchConversation();
        fetchMessages();

        // Subscribe to real-time message updates
        subscriptionRef.current = supabase
            .channel(`chat_${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, handleNewMessage)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, handleMessageUpdate)
            .on('postgres_changes', {
                event: 'DELETE',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, handleMessageDelete)
            .subscribe();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [currentUserId, conversationId]);

    const fetchConversation = async () => {
        try {
            console.log('🔍 useChatThread: Fetching conversation:', conversationId);
            // Get conversation details
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (convError) {
                console.error('❌ Error fetching conversation:', convError);
                throw convError;
            }
            console.log('✅ Conversation fetched:', conv);
            setConversation(conv);

            // Get participants
            console.log('🔍 Fetching participants for conversation:', conversationId);
            const { data: parts, error: partsError } = await supabase
                .from('conversation_participants')
                .select(`
                    *,
                    profile:user_id (*)
                `)
                .eq('conversation_id', conversationId);

            if (partsError) {
                console.error('Error fetching participants:', partsError);
                throw partsError;
            }

            console.log('📋 Fetched participants:', parts);
            setParticipants(parts || []);
        } catch (err) {
            console.error('Error fetching conversation:', err);
            setError(err.message);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            console.log('📨 Fetching messages for conversation:', conversationId);

            // Use session passed from parent
            console.log('🔐 Using passed session:', session ? 'YES' : 'NO');

            if (!session) {
                console.error('❌ No session for fetch');
                setMessages([]);
                setLoading(false);
                return;
            }

            // Import config
            const { supabaseUrl, supabaseAnonKey } = await import('../lib/supabase');

            // Use direct REST API (same as INSERT)
            console.log('📡 Fetching via REST API...');
            const response = await fetch(
                `${supabaseUrl}/rest/v1/messages?conversation_id=eq.${conversationId}&order=created_at.asc`,
                {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Fetch error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            console.log('📨 Fetch result:', {
                messageCount: data?.length || 0,
                conversationId,
                messages: data
            });

            setMessages(data || []);
            setError(null);

            // Mark messages as read
            await markMessagesAsRead();
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message);
            focusToast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async () => {
        try {
            // DISABLED: This was causing 400 errors
            // await supabase
            //     .from('messages')
            //     .update({ is_read: true })
            //     .eq('conversation_id', conversationId)
            //     .neq('sender_id', currentUserId)
            //     .eq('is_read', false);
            console.log('📖 markMessagesAsRead disabled to prevent errors');
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const handleNewMessage = (payload) => {
        console.log('New message:', payload);
        setMessages(prev => [...prev, payload.new]);
    };

    const handleMessageUpdate = (payload) => {
        console.log('Message updated:', payload);
        setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
        ));
    };

    const handleMessageDelete = (payload) => {
        console.log('Message deleted:', payload);
        setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
    };

    const deleteMessage = async (messageId, deleteForEveryone = false) => {
        try {
            if (deleteForEveryone) {
                const { error } = await supabase
                    .from('messages')
                    .delete()
                    .eq('id', messageId);

                if (error) throw error;
            } else {
                // Soft delete - mark as deleted
                const { error } = await supabase
                    .from('messages')
                    .update({
                        deleted_at: new Date().toISOString()
                    })
                    .eq('id', messageId);

                if (error) throw error;
            }

            focusToast.success('Message deleted');
        } catch (err) {
            console.error('Error deleting message:', err);
            focusToast.error('Failed to delete message');
        }
    };

    const editMessage = async (messageId, newContent) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({
                    content: newContent,
                    is_edited: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .eq('sender_id', currentUserId);

            if (error) throw error;

            focusToast.success('Message edited');
        } catch (err) {
            console.error('Error editing message:', err);
            focusToast.error('Failed to edit message');
        }
    };

    // Compute the other user from participants
    const otherUser = participants.find(p => p.user_id !== currentUserId)?.profile || null;

    return {
        messages,
        loading,
        error,
        conversation,
        participants,
        otherUser,
        refetch: fetchMessages,
        deleteMessage,
        editMessage
    };
};
