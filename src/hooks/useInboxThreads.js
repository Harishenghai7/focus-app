import { useState, useEffect } from 'react';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useInboxThreads = (userId) => {
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { session, refreshSession } = useAuth();

    // Helper for direct API calls
    const apiCall = async (endpoint, options = {}) => {
        const url = `${supabaseUrl}/rest/v1/${endpoint}`;
        const headers = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response.json();
    };

    useEffect(() => {
        if (!userId || !session?.access_token) {
            setLoading(false);
            return;
        }

        const fetchThreads = async (retryCount = 0) => {
            try {
                // Only show loading on initial fetch if we have no data
                if (threads.length === 0 && retryCount === 0) {
                    setLoading(true);
                }
                console.log(`📥 Fetching inbox threads (Attempt ${retryCount + 1})...`);

                // 1. Get my participations
                const myParticipations = await apiCall(`conversation_participants?select=conversation_id&user_id=eq.${userId}`);

                if (myParticipations.length === 0) {
                    // Only clear threads if we previously had some, to avoid unnecessary updates
                    if (threads.length > 0) {
                        setThreads([]);
                    }
                    setLoading(false);
                    return;
                }

                const conversationIds = myParticipations.map(p => p.conversation_id);
                const idsParam = `(${conversationIds.join(',')})`;

                // 2. Fetch conversations details
                const conversations = await apiCall(`conversations?id=in.${idsParam}&order=updated_at.desc`);

                // 3. Fetch all participants for these conversations (to find the other user)
                const allParticipants = await apiCall(`conversation_participants?conversation_id=in.${idsParam}`);

                // 4. Fetch profiles for all participants
                const userIds = [...new Set(allParticipants.map(p => p.user_id))];
                console.log('👥 Fetching profiles for:', userIds);

                const userIdsParam = `(${userIds.join(',')})`;
                const profiles = await apiCall(`profiles?id=in.${userIdsParam}`);
                console.log('👤 Profiles fetched:', profiles);

                const profilesMap = new Map(profiles.map(p => [p.id, p]));

                // 5. Fetch latest messages
                const messages = await apiCall(`messages?conversation_id=in.${idsParam}&order=created_at.desc&limit=50`);

                // 6. Assemble threads with online status
                const threadsData = conversations.map(conv => {
                    // Find other participants
                    const convParticipants = allParticipants
                        .filter(p => p.conversation_id === conv.id && p.user_id !== userId)
                        .map(p => {
                            const profile = profilesMap.get(p.user_id);
                            if (!profile) console.warn('⚠️ Profile not found for user:', p.user_id);
                            return profile;
                        })
                        .filter(Boolean);

                    console.log('👥 Conversation participants:', { convId: conv.id, participants: convParticipants });

                    // Find last message
                    const lastMessage = messages.find(m => m.conversation_id === conv.id);

                    // Determine display info with online status
                    let displayUser;
                    if (conv.is_group) {
                        displayUser = {
                            username: conv.group_name || 'Group Chat',
                            avatar_url: conv.group_avatar,
                            status: 'offline',
                            is_online: false
                        };
                    } else {
                        const otherUser = convParticipants[0];
                        console.log('🔍 Other user object:', otherUser);
                        console.log('🔍 Other user ID:', otherUser?.id);

                        if (otherUser) {
                            // Calculate online status: online if last_seen within 5 minutes
                            const lastSeen = otherUser.last_seen ? new Date(otherUser.last_seen) : null;
                            const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;

                            displayUser = {
                                id: otherUser.id,
                                username: otherUser.username || 'Unknown',
                                full_name: otherUser.full_name,
                                avatar_url: otherUser.avatar_url,
                                status: isOnline ? 'online' : 'offline',
                                is_online: isOnline,
                                last_seen: otherUser.last_seen
                            };

                            console.log('👤 Display user:', { username: displayUser.username, isOnline, lastSeen });
                            console.log('👤 Display user ID:', displayUser.id);
                        } else {
                            console.warn('⚠️ No participants found for conversation:', conv.id);
                            displayUser = {
                                username: 'Unknown User',
                                avatar_url: null,
                                status: 'offline',
                                is_online: false
                            };
                        }
                    }

                    return {
                        id: conv.id,
                        conversationId: conv.id,
                        user: displayUser,
                        lastMessage: lastMessage || { content: 'No messages yet', created_at: conv.created_at },
                        unreadCount: 0,
                        messages: messages
                            .filter(m => m.conversation_id === conv.id && m.content && m.content.trim())
                            .reverse(), // Filter empty messages and reverse for display
                        participants: convParticipants
                    };
                });

                setThreads(threadsData);
                console.log('✅ Loaded threads:', threadsData.length);
                setLoading(false); // Success!

            } catch (err) {
                console.error(`❌ Error fetching threads (Attempt ${retryCount + 1}):`, err);

                // If JWT expired, refresh session automatically
                if (err.message.includes('401') && err.message.includes('JWT expired')) {
                    console.log('🔄 JWT expired, refreshing session...');
                    if (refreshSession) {
                        await refreshSession();
                    }
                }

                // Retry logic
                if (retryCount < 3) {
                    console.log(`🔄 Retrying fetch in 2s...`);
                    setTimeout(() => fetchThreads(retryCount + 1), 2000);
                } else {
                    setError(err.message);
                    setLoading(false);
                }
            }
        };

        fetchThreads();
    }, [userId, session?.access_token]); // Removed refreshSession to prevent infinite loop

    useEffect(() => {
        console.log('📊 useInboxThreads state:', { loading, threadsCount: threads.length, error });
    }, [loading, threads, error]);

    const markThreadAsRead = async (conversationId) => {
        // Placeholder
    };

    const refetch = () => {
        // Trigger re-fetch logic if needed
    };

    return { threads, loading, error, refetch, markThreadAsRead };
};
