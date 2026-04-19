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

            const [{ data: contentMatches, error }, { data: profileMatches, error: profileError }] = await Promise.all([
                queryBuilder,
                supabase
                    .from('profiles')
                    .select('id')
                    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
                    .limit(20)
            ]);

            if (error) throw error;
            if (profileError) throw profileError;

            let usernameMatches = [];
            const profileIds = (profileMatches || []).map((p) => p.id).filter(Boolean);
            if (profileIds.length > 0) {
                let profileQuery = supabase
                    .from('messages')
                    .select(`
                        *,
                        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url),
                        receiver:profiles!messages_receiver_id_fkey(id, username, full_name, avatar_url)
                    `)
                    .or(`sender_id.in.(${profileIds.join(',')}),receiver_id.in.(${profileIds.join(',')})`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (filters.conversationId) {
                    profileQuery = profileQuery.eq('conversation_id', filters.conversationId);
                }
                const { data: profileRows, error: profileRowsError } = await profileQuery;
                if (profileRowsError) throw profileRowsError;
                usernameMatches = profileRows || [];
            }

            const mergedMap = new Map();
            [...(contentMatches || []), ...usernameMatches].forEach((item) => {
                mergedMap.set(item.id, item);
            });
            const merged = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setResults(merged);
            return merged;
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
