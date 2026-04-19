/**
 * useInboxThreads — Focus App
 *
 * Fetches and maintains the messaging inbox thread list.
 * Includes:
 * - Initial REST fetch
 * - Supabase Realtime subscription for new messages (live thread update)
 * - Working refetch() function
 * - JWT expiry retry logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=Focusly';

export const useInboxThreads = (userId) => {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { session } = useAuth();
    const fetchingRef = useRef(false);

    // ─── API helper ──────────────────────────────────────────
    const apiCall = useCallback(async (endpoint, options = {}) => {
        const currentSession = session || (await supabase.auth.getSession()).data.session;
        const url = `${supabaseUrl}/rest/v1/${endpoint}`;
        const headers = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${currentSession?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        return response.json();
    }, [session]);

    // ─── Fetch all threads ────────────────────────────────────
    const fetchThreads = useCallback(async (retryCount = 0) => {
        if (!userId || !session?.access_token) {
            setLoading(false);
            return;
        }
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            if (threads.length === 0 && retryCount === 0) setLoading(true);

            const myParticipations = await apiCall(
                `conversation_participants?select=conversation_id&user_id=eq.${userId}`
            );

            if (myParticipations.length === 0) {
                setThreads([]);
                setLoading(false);
                return;
            }

            const conversationIds = myParticipations.map(p => p.conversation_id);
            const idsParam = `(${conversationIds.join(',')})`;

            const [conversations, allParticipants, messages] = await Promise.all([
                apiCall(`conversations?id=in.${idsParam}&order=updated_at.desc`),
                apiCall(`conversation_participants?conversation_id=in.${idsParam}`),
                apiCall(`messages?conversation_id=in.${idsParam}&order=created_at.desc&limit=100`),
            ]);

            const userIds = [...new Set(allParticipants.map(p => p.user_id))];
            const profiles = await apiCall(`profiles?id=in.(${userIds.join(',')})`);
            const profilesMap = new Map(profiles.map(p => [p.id, p]));

            const threadsData = conversations.map(conv => {
                const convParticipants = allParticipants
                    .filter(p => p.conversation_id === conv.id && p.user_id !== userId)
                    .map(p => profilesMap.get(p.user_id))
                    .filter(Boolean);

                const lastMessage = messages.find(m => m.conversation_id === conv.id);

                let displayUser;
                if (conv.is_group) {
                    displayUser = {
                        username: conv.group_name || 'Group Chat',
                        avatar_url: conv.group_avatar,
                        status: 'offline',
                        is_online: false,
                    };
                } else {
                    const otherUser = convParticipants[0];
                    if (otherUser) {
                        const lastSeen = otherUser.last_seen ? new Date(otherUser.last_seen) : null;
                        const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;
                        displayUser = {
                            id: otherUser.id,
                            username: otherUser.username || `focusly_${otherUser.id.slice(0, 6)}`,
                            full_name: otherUser.full_name || otherUser.username || 'Focusly User',
                            avatar_url: otherUser.avatar_url || FALLBACK_AVATAR,
                            status: isOnline ? 'online' : 'offline',
                            is_online: isOnline,
                            last_seen: otherUser.last_seen,
                        };
                    } else {
                        displayUser = {
                            username: 'focusly_user',
                            avatar_url: FALLBACK_AVATAR,
                            status: 'offline',
                            is_online: false,
                        };
                    }
                }

                return {
                    id: conv.id,
                    conversationId: conv.id,
                    user: displayUser,
                    lastMessage: lastMessage || {
                        content: 'No messages yet',
                        created_at: conv.created_at,
                    },
                    unreadCount: 0,
                    messages: messages
                        .filter(m => m.conversation_id === conv.id && m.content?.trim())
                        .reverse(),
                    participants: convParticipants,
                    updatedAt: conv.updated_at,
                };
            });

            setThreads(threadsData);
            setError(null);
        } catch (err) {
            console.error(`Error fetching threads (attempt ${retryCount + 1}):`, err);
            if (retryCount < 2) {
                setTimeout(() => fetchThreads(retryCount + 1), 2000);
                return;
            }
            setError(err.message);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [userId, session?.access_token, apiCall]); // eslint-disable-line

    // ─── Initial fetch ────────────────────────────────────────
    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    // ─── Realtime: new message → bump thread to top ───────────
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`inbox-realtime:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new;

                    setThreads(prev => {
                        const idx = prev.findIndex(t => t.id === newMsg.conversation_id);
                        if (idx === -1) {
                            // New conversation — do a full refetch
                            fetchThreads();
                            return prev;
                        }

                        // Update existing thread: move to top, update lastMessage
                        const updated = { ...prev[idx], lastMessage: newMsg };
                        const rest = prev.filter((_, i) => i !== idx);
                        return [updated, ...rest];
                    });
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                console.log('🔌 Unsubscribing from inbox realtime channel.');
                supabase.removeChannel(channel);
            }
        };
    }, [userId, fetchThreads]);

    // ─── Mark thread as read ──────────────────────────────────
    const markThreadAsRead = useCallback(async (conversationId) => {
        try {
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .neq('sender_id', userId)
                .is('read_at', null);

            setThreads(prev =>
                prev.map(t =>
                    t.id === conversationId ? { ...t, unreadCount: 0 } : t
                )
            );
        } catch (err) {
            console.warn('⚠️ markThreadAsRead error:', err);
        }
    }, [userId]);

    const searchThreads = useCallback((term = '') => {
        const normalized = term.trim().toLowerCase();
        if (!normalized) return threads;
        return threads.filter((thread) => {
            const username = thread.user?.username?.toLowerCase() || '';
            const fullName = thread.user?.full_name?.toLowerCase() || '';
            const last = thread.lastMessage?.content?.toLowerCase() || '';
            const anyMessage = (thread.messages || []).some((msg) =>
                (msg.content || '').toLowerCase().includes(normalized)
            );
            return (
                username.includes(normalized) ||
                fullName.includes(normalized) ||
                last.includes(normalized) ||
                anyMessage
            );
        });
    }, [threads]);

    return {
        threads,
        loading,
        error,
        refetch: fetchThreads,   // ← was empty function, now works!
        markThreadAsRead,
        searchThreads,
    };
};
