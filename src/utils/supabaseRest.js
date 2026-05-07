import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';

const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseAnonKey;

/**
 * Get authentication token
 * Returns the user's access token or anon key as fallback
 */
export const getAuthToken = async () => {
    try {
        // Try to get session from localStorage first (faster)
        // Find the Supabase auth token key dynamically
        const authKey = Object.keys(localStorage).find(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
        );

        if (authKey) {
            try {
                const sessionStr = localStorage.getItem(authKey);
                const session = JSON.parse(sessionStr);
                if (session?.access_token && session?.expires_at) {
                    // Check if token is still valid
                    const expiresAt = new Date(session.expires_at * 1000);
                    if (expiresAt > new Date()) {

                        return session.access_token;
                    }
                }
            } catch (e) {
                console.warn('Failed to parse cached session');
            }
        }

        // Fallback: Get fresh session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            console.warn('⚠️ No valid session, using anon key');
            return SUPABASE_ANON_KEY;
        }


        return session.access_token;
    } catch (err) {
        console.warn('⚠️ Auth error, using anon key:', err.message);
        return SUPABASE_ANON_KEY;
    }
};

/**
 * Generic Supabase REST API fetch wrapper
 * Handles authentication, headers, and error handling
 */
export const supabaseFetch = async (endpoint, options = {}) => {
    const token = await getAuthToken();

    const url = `${SUPABASE_URL}/rest/v1${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
};

/**
 * Fetch posts with user data
 */
export const fetchPosts = async (options = {}) => {
    const {
        limit = 20,
        offset = 0,
        orderBy = 'created_at',
        ascending = false,
        userId = null
    } = options;

    let query = supabase.from('posts').select('*, profiles(*)');

    if (userId) {
        query = query.eq('user_id', userId);
    }

    if (options.userIds && options.userIds.length > 0) {
        query = query.in('user_id', options.userIds);
    }

    const { data, error } = await query
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
};

/**
 * Fetch boltz with user data
 */
export const fetchBoltz = async (options = {}) => {
    const {
        limit = 10,
        offset = 0,
        userId = null
    } = options;

    let query = supabase.from('boltz').select('*, profiles(*)');

    if (userId) {
        query = query.eq('user_id', userId);
    }

    if (options.userIds && options.userIds.length > 0) {
        query = query.in('user_id', options.userIds);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
};

/**
 * Fetch stories (flash) with user data
 * Only fetches stories from last 24 hours
 */
export const fetchStories = async (options = {}) => {
    const { userId = null } = options;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const buildBase = () => {
        let q = supabase
            .from('flash')
            .select(`
                *,
                profiles:user_id (
                    id, username, full_name, avatar_url, is_verified, trust_tier
                )
            `)
            .gte('created_at', twentyFourHoursAgo)
            .order('created_at', { ascending: false });
        if (userId) q = q.eq('user_id', userId);
        return q;
    };

    let query = buildBase().gt('expires_at', new Date().toISOString());
    let { data, error } = await query;

    if (error) {
        const simple = await buildBase().limit(80);
        data = simple.data;
        error = simple.error;
    }

    if (error) throw error;

    return (data || []).map((item) => {
        const raw = item.profiles;
        const prof = Array.isArray(raw) ? raw[0] : raw;
        return {
            ...item,
            user: prof ? {
                id: prof.id,
                username: prof.username,
                full_name: prof.full_name,
                avatar_url: prof.avatar_url,
                is_verified: prof.is_verified,
                trust_tier: prof.trust_tier,
            } : null,
        };
    });
};

/**
 * Fetch notifications with related data
 */
export const fetchNotifications = async (userId, options = {}) => {
    const {
        limit = 50,
        offset = 0,
        unreadOnly = false
    } = options;

    let endpoint = `/notifications?select=*,actor:profiles!notifications_actor_id_fkey(id,username,avatar_url),post:posts(id,media_url)`;
    endpoint += `&user_id=eq.${userId}`;
    endpoint += `&order=created_at.desc`;
    endpoint += `&limit=${limit}&offset=${offset}`;

    if (unreadOnly) {
        endpoint += `&read=eq.false`;
    }

    return supabaseFetch(endpoint);
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId) => {
    return supabaseFetch(`/notifications?id=eq.${notificationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
    });
};

/**
 * Fetch suggested users
 */
export const fetchSuggestedUsers = async (currentUserId, limit = 5) => {
    let endpoint = `/profiles?select=id,username,full_name,avatar_url,verified,bio`;
    endpoint += `&id=neq.${currentUserId}`;
    endpoint += `&limit=${limit}`;

    return supabaseFetch(endpoint);
};

/**
 * Fetch trending hashtags
 */
export const fetchTrendingHashtags = async (limit = 10) => {
    // Note: This assumes you have a hashtags table
    // If not, you'll need to create one or extract from posts
    let endpoint = `/hashtags?select=*`;
    endpoint += `&order=post_count.desc`;
    endpoint += `&limit=${limit}`;

    return supabaseFetch(endpoint);
};

/**
 * Search posts by query
 */
export const searchPosts = async (queryStr, limit = 20) => {
    const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .or(`caption.ilike.%${queryStr}%,location.ilike.%${queryStr}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
};

/**
 * Update post caption
 */
export const updatePostCaption = async (postId, caption) => {
    const endpoint = `/posts?id=eq.${postId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ caption })
    });
};

/**
 * Update post (generic)
 */
export const updatePost = async (postId, updates) => {
    const endpoint = `/posts?id=eq.${postId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

/**
 * Update boltz caption
 */
export const updateBoltzCaption = async (boltzId, caption) => {
    const endpoint = `/boltz?id=eq.${boltzId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ caption })
    });
};

/**
 * Update boltz (generic)
 */
export const updateBoltz = async (boltzId, updates) => {
    const endpoint = `/boltz?id=eq.${boltzId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

// ============================================================================
// LIKES - Post & Boltz
// ============================================================================

/**
 * Like a post
 */
export const likePost = async (postId, userId) => {
    const endpoint = `/post_likes`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId, userId) => {
    const endpoint = `/post_likes?post_id=eq.${postId}&user_id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

/**
 * Like a boltz
 */
export const likeBoltz = async (boltzId, userId) => {
    const endpoint = `/boltz_likes`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            boltz_id: boltzId,
            user_id: userId,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Unlike a boltz
 */
export const unlikeBoltz = async (boltzId, userId) => {
    const endpoint = `/boltz_likes?boltz_id=eq.${boltzId}&user_id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

// ============================================================================
// SAVES - Post & Boltz
// ============================================================================

/**
 * Save a post
 */
export const savePost = async (postId, userId) => {
    const endpoint = `/saved_posts`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Unsave a post
 */
export const unsavePost = async (postId, userId) => {
    const endpoint = `/saved_posts?post_id=eq.${postId}&user_id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

/**
 * Save a boltz
 */
export const saveBoltz = async (boltzId, userId) => {
    const endpoint = `/boltz_saves`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            boltz_id: boltzId,
            user_id: userId,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Unsave a boltz
 */
export const unsaveBoltz = async (boltzId, userId) => {
    const endpoint = `/boltz_saves?boltz_id=eq.${boltzId}&user_id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * Fetch comments for a post
 */
export const fetchComments = async (postId, options = {}) => {
    const { limit = 50, offset = 0 } = options;

    const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
};

/**
 * Add a comment to a post
 */
export const addComment = async (postId, userId, text) => {
    const endpoint = `/comments`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            post_id: postId,
            user_id: userId,
            text: text,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId) => {
    const endpoint = `/comments?id=eq.${commentId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

// ============================================================================
// FOLLOWS
// ============================================================================

/**
 * Follow a user
 */
export const followUser = async (followerId, followingId) => {
    const endpoint = `/follows`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId, followingId) => {
    const endpoint = `/follows?follower_id=eq.${followerId}&following_id=eq.${followingId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

/**
 * Fetch user's followers
 */
export const fetchFollowers = async (userId, options = {}) => {
    const { limit = 50, offset = 0 } = options;

    let endpoint = `/follows?select=follower:profiles!follows_follower_id_fkey(id,username,full_name,avatar_url,verified)`;
    endpoint += `&following_id=eq.${userId}`;
    endpoint += `&order=created_at.desc`;
    endpoint += `&limit=${limit}&offset=${offset}`;

    return supabaseFetch(endpoint);
};

/**
 * Fetch users that a user is following
 */
export const fetchFollowing = async (userId, options = {}) => {
    const { limit = 50, offset = 0 } = options;

    let endpoint = `/follows?select=following:profiles!follows_following_id_fkey(id,username,full_name,avatar_url,verified)`;
    endpoint += `&follower_id=eq.${userId}`;
    endpoint += `&order=created_at.desc`;
    endpoint += `&limit=${limit}&offset=${offset}`;

    return supabaseFetch(endpoint);
};

// ============================================================================
// PROFILE
// ============================================================================

/**
 * Fetch user profile by username
 */
export const fetchProfile = async (username) => {
    const endpoint = `/profiles?select=*&username=eq.${username}`;
    const result = await supabaseFetch(endpoint);
    return result[0]; // Return single profile
};

/**
 * Fetch user profile by ID
 */
export const fetchProfileById = async (userId) => {
    const endpoint = `/profiles?select=*&id=eq.${userId}`;
    const result = await supabaseFetch(endpoint);
    return result[0];
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
    const endpoint = `/profiles?id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

/**
 * Fetch user stats (posts, followers, following counts)
 */
export const fetchUserStats = async (userId) => {
    // This would typically be done with multiple queries or a database function
    // For now, we'll use the RPC approach if available
    try {
        return await supabaseFetch(`/rpc/get_user_stats`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId })
        });
    } catch (error) {
        // Fallback: fetch counts separately
        console.warn('RPC not available, fetching stats separately');
        return {
            posts_count: 0,
            followers_count: 0,
            following_count: 0
        };
    }
};

// ============================================================================
// MESSAGES
// ============================================================================

/**
 * Fetch all users (for new message modal)
 */
export const fetchAllUsers = async (currentUserId, limit = 50) => {
    let endpoint = `/profiles?select=id,username,full_name,avatar_url,verified`;
    endpoint += `&id=neq.${currentUserId}`;
    endpoint += `&limit=${limit}`;
    endpoint += `&order=username.asc`;

    return supabaseFetch(endpoint);
};



/**
 * Create a new conversation
 */
export const createConversation = async (user1Id, user2Id) => {
    const endpoint = `/conversations`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            type: 'direct',
            participants: [user1Id, user2Id], // Will be stored as JSONB array
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });
};



/**
 * Send a message
 */
export const sendMessage = async (conversationId, senderId, content, type = 'text') => {
    const endpoint = `/messages`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            type,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId) => {
    const endpoint = `/messages?id=eq.${messageId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted: true,
            deleted_at: new Date().toISOString()
        })
    });
};

// ============================================================================
// PRODUCTION MESSAGING SYSTEM
// ============================================================================

/**
 * Get or create conversation between two users
 */
export const getOrCreateConversation = async (user1Id, user2Id) => {
    return supabaseFetch(`/rpc/get_or_create_conversation`, {
        method: 'POST',
        body: JSON.stringify({
            user1_id: user1Id,
            user2_id: user2Id
        })
    });
};

/**
 * Fetch conversations for a user
 */
export const fetchConversations = async (userId) => {
    let endpoint = `/conversation_participants?select=*,conversation:conversations(*),other_user:profiles!conversation_participants_user_id_fkey(*)`;
    endpoint += `&user_id=eq.${userId}`;
    endpoint += `&order=conversation.last_message_at.desc.nullslast`;

    return supabaseFetch(endpoint);
};

/**
 * Fetch messages for a conversation with pagination
 */
export const fetchMessages = async (conversationId, options = {}) => {
    const { limit = 50, before = null } = options;

    let endpoint = `/messages?select=*,sender:profiles!messages_sender_id_fkey(id,username,full_name,avatar_url),attachments:message_attachments(*),reply_to:messages!messages_reply_to_message_id_fkey(id,content,type,sender_id)`;
    endpoint += `&conversation_id=eq.${conversationId}`;
    endpoint += `&deleted_for_everyone=eq.false`;
    endpoint += `&order=created_at.desc`;
    endpoint += `&limit=${limit}`;

    if (before) {
        endpoint += `&created_at=lt.${before}`;
    }

    return supabaseFetch(endpoint);
};

/**
 * Send a text message
 */
export const sendTextMessage = async (conversationId, senderId, content, replyToId = null) => {
    const endpoint = `/messages`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: senderId,
            type: 'text',
            content,
            reply_to_message_id: replyToId,
            status: 'sent',
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Send a message with attachment
 */
export const sendMediaMessage = async (conversationId, senderId, type, attachmentData, content = null) => {
    // First create the message
    const messageEndpoint = `/messages`;
    const messageResponse = await supabaseFetch(messageEndpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: senderId,
            type,
            content,
            status: 'sent',
            created_at: new Date().toISOString()
        })
    });

    const message = messageResponse[0];

    // Then create the attachment
    const attachmentEndpoint = `/message_attachments`;
    await supabaseFetch(attachmentEndpoint, {
        method: 'POST',
        body: JSON.stringify({
            message_id: message.id,
            type,
            url: attachmentData.url,
            thumbnail_url: attachmentData.thumbnailUrl,
            duration: attachmentData.duration,
            size: attachmentData.size,
            width: attachmentData.width,
            height: attachmentData.height,
            mime_type: attachmentData.mimeType,
            metadata: attachmentData.metadata || {},
            created_at: new Date().toISOString()
        })
    });

    return message;
};

/**
 * Send shared content (post, flash, boltz)
 */
export const sendSharedContent = async (conversationId, senderId, contentType, contentId, caption = null) => {
    const endpoint = `/messages`;
    const type = `shared_${contentType}`; // shared_post, shared_flash, shared_boltz

    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            sender_id: senderId,
            type,
            content: caption,
            metadata: { content_id: contentId },
            status: 'sent',
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Delete message for sender only
 */
export const deleteMessageForMe = async (messageId) => {
    const endpoint = `/messages?id=eq.${messageId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted_for_sender: true,
            updated_at: new Date().toISOString()
        })
    });
};

/**
 * Delete message for everyone (unsend)
 */
export const unsendMessage = async (messageId) => {
    const endpoint = `/messages?id=eq.${messageId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
            deleted_for_everyone: true,
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
    });
};

/**
 * Update message status (delivered, seen)
 */
export const updateMessageStatus = async (messageId, status) => {
    const endpoint = `/messages?id=eq.${messageId}`;
    const updates = {
        status,
        updated_at: new Date().toISOString()
    };

    if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
    } else if (status === 'seen') {
        updates.seen_at = new Date().toISOString();
    }

    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

/**
 * Mark all messages as read in a conversation
 */
export const markConversationAsRead = async (conversationId, userId, lastMessageId) => {
    return supabaseFetch(`/rpc/mark_messages_as_read`, {
        method: 'POST',
        body: JSON.stringify({
            p_conversation_id: conversationId,
            p_user_id: userId,
            p_message_id: lastMessageId
        })
    });
};

/**
 * Set typing indicator
 */
export const setTypingStatus = async (conversationId, userId, isTyping) => {
    const endpoint = `/typing_indicators`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            user_id: userId,
            is_typing: isTyping,
            last_typed_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'resolution=merge-duplicates' }
    });
};

/**
 * Update user presence
 */
export const updatePresence = async (userId, isOnline) => {
    const endpoint = `/user_presence`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            is_online: isOnline,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }),
        headers: { 'Prefer': 'resolution=merge-duplicates' }
    });
};

/**
 * Fetch user presence
 */
export const fetchPresence = async (userIds) => {
    const idsParam = `(${userIds.join(',')})`;
    const endpoint = `/user_presence?user_id=in.${idsParam}`;
    return supabaseFetch(endpoint);
};

/**
 * Initiate a call (audio or video)
 */
export const initiateCall = async (conversationId, callerId, receiverId, type) => {
    const endpoint = `/calls`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            caller_id: callerId,
            receiver_id: receiverId,
            type,
            status: 'calling',
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Update call status
 */
export const updateCallStatus = async (callId, status, duration = null) => {
    const endpoint = `/calls?id=eq.${callId}`;
    const updates = {
        status,
        updated_at: new Date().toISOString()
    };

    if (status === 'accepted') {
        updates.started_at = new Date().toISOString();
    } else if (status === 'ended' && duration !== null) {
        updates.ended_at = new Date().toISOString();
        updates.duration = duration;
    }

    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(updates)
    });
};

/**
 * Update call signaling data (WebRTC)
 */
export const updateCallSignaling = async (callId, signalingData) => {
    const endpoint = `/calls?id=eq.${callId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({
            signaling_data: signalingData,
            updated_at: new Date().toISOString()
        })
    });
};

/**
 * Block a user
 */
export const blockUser = async (blockerId, blockedId) => {
    const endpoint = `/blocked_users`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            blocker_id: blockerId,
            blocked_id: blockedId,
            blocked_at: new Date().toISOString()
        })
    });
};

/**
 * Unblock a user
 */
export const unblockUser = async (blockerId, blockedId) => {
    const endpoint = `/blocked_users?blocker_id=eq.${blockerId}&blocked_id=eq.${blockedId}`;
    return supabaseFetch(endpoint, {
        method: 'DELETE'
    });
};

/**
 * Check if user is blocked
 */
export const isUserBlocked = async (userId, otherUserId) => {
    const endpoint = `/blocked_users?or=(and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId}))`;
    const result = await supabaseFetch(endpoint);
    return result.length > 0;
};

/**
 * Report content
 */
export const reportContent = async (reporterId, type, id, reason, details = null) => {
    const endpoint = `/reports`;
    return supabaseFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            reporter_id: reporterId,
            reported_type: type,
            reported_id: id,
            reason,
            details,
            created_at: new Date().toISOString()
        })
    });
};

/**
 * Update conversation participant settings
 */
export const updateConversationSettings = async (conversationId, userId, settings) => {
    const endpoint = `/conversation_participants?conversation_id=eq.${conversationId}&user_id=eq.${userId}`;
    return supabaseFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(settings)
    });
};
