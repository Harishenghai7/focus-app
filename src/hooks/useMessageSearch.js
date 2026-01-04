import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for searching messages
 * Supports text search, media filtering, and conversation filtering
 */
export const useMessageSearch = () => {
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);

    // Search messages by text content
    const searchMessages = useCallback(async (query, filters = {}) => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            return [];
        }

        setSearching(true);
        try {
            let queryBuilder = supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
                    receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
                `)
                .ilike('content', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            // Filter by message type
            if (filters.messageType) {
                queryBuilder = queryBuilder.eq('message_type', filters.messageType);
            }

            // Filter by conversation
            if (filters.conversationId) {
                queryBuilder = queryBuilder.eq('conversation_id', filters.conversationId);
            }

            // Filter by user
            if (filters.userId) {
                queryBuilder = queryBuilder.or(`sender_id.eq.${filters.userId},receiver_id.eq.${filters.userId}`);
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;

            setResults(data || []);
            return data || [];
        } catch (error) {
            console.error('Error searching messages:', error);
            setResults([]);
            return [];
        } finally {
            setSearching(false);
        }
    }, []);

    // Search group messages
    const searchGroupMessages = useCallback(async (query, filters = {}) => {
        if (!query || query.trim().length < 2) {
            setResults([]);
            return [];
        }

        setSearching(true);
        try {
            let queryBuilder = supabase
                .from('group_messages')
                .select(`
                    *,
                    sender:profiles!group_messages_sender_id_fkey(id, username, full_name, avatar_url),
                    group:group_conversations(id, name, avatar_url)
                `)
                .ilike('content', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (filters.messageType) {
                queryBuilder = queryBuilder.eq('message_type', filters.messageType);
            }

            if (filters.groupId) {
                queryBuilder = queryBuilder.eq('group_id', filters.groupId);
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;

            setResults(data || []);
            return data || [];
        } catch (error) {
            console.error('Error searching group messages:', error);
            setResults([]);
            return [];
        } finally {
            setSearching(false);
        }
    }, []);

    // Search by media type
    const searchByMediaType = useCallback(async (mediaType, conversationId = null) => {
        setSearching(true);
        try {
            let queryBuilder = supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
                `)
                .eq('message_type', mediaType)
                .order('created_at', { ascending: false })
                .limit(50);

            if (conversationId) {
                queryBuilder = queryBuilder.eq('conversation_id', conversationId);
            }

            const { data, error } = await queryBuilder;

            if (error) throw error;

            setResults(data || []);
            return data || [];
        } catch (error) {
            console.error('Error searching by media type:', error);
            setResults([]);
            return [];
        } finally {
            setSearching(false);
        }
    }, []);

    // Clear search results
    const clearResults = useCallback(() => {
        setResults([]);
    }, []);

    return {
        searching,
        results,
        searchMessages,
        searchGroupMessages,
        searchByMediaType,
        clearResults
    };
};
