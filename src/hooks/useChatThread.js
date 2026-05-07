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

            setConversation(conv);

            // Get participants

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


            setParticipants(parts || []);
        } catch (err) {
            console.error('Error fetching conversation:', err);
            setError(err.message);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);


            // Use session passed from parent


            if (!session) {
                console.error('❌ No session for fetch');
                setMessages([]);
                setLoading(false);
                return;
            }

            // Use native Supabase JS SDK

            const { data, error: fetchErr } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (fetchErr) {
                console.error('❌ Fetch error:', fetchErr.message);
                throw new Error(fetchErr.message);
            }

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
            await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId,
                p_user_id: currentUserId,
                p_message_id: null
            });
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const handleNewMessage = (payload) => {

        setMessages(prev => [...prev, payload.new]);
    };

    const handleMessageUpdate = (payload) => {

        setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
        ));
    };

    const handleMessageDelete = (payload) => {

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
    const rawOtherUser = participants.find(p => p.user_id !== currentUserId)?.profile || null;
    const otherUser = rawOtherUser ? {
        ...rawOtherUser,
        username: rawOtherUser.username || `focusly_${rawOtherUser.id?.slice?.(0, 6) || 'user'}`,
        full_name: rawOtherUser.full_name || rawOtherUser.username || 'Focusly User',
        avatar_url: rawOtherUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Focusly',
    } : null;

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
