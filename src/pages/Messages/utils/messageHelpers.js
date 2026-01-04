// ═══════════════════════════════════════════════════════════════════════
// MESSAGE HELPERS - Utility functions for Focus Messages
// ═══════════════════════════════════════════════════════════════════════

/**
 * Format timestamp for messages
 * Returns: "5m", "2h", "Yesterday", "Dec 15", etc.
 */
export const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Less than 1 hour: "5m"
    if (diffMins < 60) {
        return `${diffMins}m`;
    }

    // Less than 24 hours: "2h"
    if (diffHours < 24) {
        return `${diffHours}h`;
    }

    // Yesterday
    if (diffDays === 1) {
        return 'Yesterday';
    }

    // Less than 7 days: "Monday"
    if (diffDays < 7) {
        return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    }

    // This year: "Dec 15"
    if (messageDate.getFullYear() === now.getFullYear()) {
        return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Different year: "Dec 15, 2023"
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format full timestamp for tooltips
 * Returns: "December 15, 2023 at 3:45 PM"
 */
export const formatFullTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Truncate message preview
 * Max 60 characters with ellipsis
 */
export const truncateMessage = (message, maxLength = 60) => {
    if (!message) return '';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
};

/**
 * Get message preview text based on type
 */
export const getMessagePreview = (message) => {
    if (!message) return '';

    switch (message.type) {
        case 'text':
            return truncateMessage(message.content);
        case 'image':
            return '📷 Photo';
        case 'video':
            return '🎥 Video';
        case 'voice':
            return '🎤 Voice message';
        case 'post_share':
            return '📝 Shared a post';
        case 'boltz_share':
            return '⚡ Shared a Boltz';
        case 'flash_share':
            return '✨ Shared a Flash';
        default:
            return 'Message';
    }
};

/**
 * Check if message was sent by current user
 */
export const isOwnMessage = (message, currentUserId) => {
    return message.sender_id === currentUserId;
};

/**
 * Check if message is within unsend window (5 minutes)
 */
export const canUnsendMessage = (message) => {
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5;
};

/**
 * Get reaction emoji array from reactions object
 * Returns: [{emoji: '❤️', users: ['user1', 'user2'], count: 2}]
 */
export const getReactionsList = (reactions) => {
    if (!reactions || typeof reactions !== 'object') return [];

    const reactionMap = {};

    Object.entries(reactions).forEach(([userId, emoji]) => {
        if (!reactionMap[emoji]) {
            reactionMap[emoji] = {
                emoji,
                users: [],
                count: 0
            };
        }
        reactionMap[emoji].users.push(userId);
        reactionMap[emoji].count++;
    });

    return Object.values(reactionMap);
};

/**
 * Check if current user has reacted with specific emoji
 */
export const hasUserReacted = (message, currentUserId, emoji) => {
    if (!message.reactions) return false;
    return message.reactions[currentUserId] === emoji;
};

/**
 * Format voice message duration
 * Returns: "1:23" or "0:45"
 */
export const formatVoiceDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get unread count for conversation
 */
export const getUnreadCount = (messages, currentUserId) => {
    if (!messages || !Array.isArray(messages)) return 0;

    return messages.filter(msg =>
        msg.sender_id !== currentUserId &&
        (!msg.read_by || !msg.read_by.includes(currentUserId))
    ).length;
};

/**
 * Check if user is participant in conversation
 */
export const isParticipant = (conversation, userId) => {
    if (!conversation || !conversation.participants) return false;
    return conversation.participants.includes(userId);
};

/**
 * Get other user in direct conversation
 */
export const getOtherUser = (conversation, currentUserId) => {
    if (!conversation || conversation.type !== 'direct') return null;
    return conversation.participants.find(id => id !== currentUserId);
};

/**
 * Group messages by date
 * Returns: [{date: 'Today', messages: [...]}, {date: 'Yesterday', messages: [...]}]
 */
export const groupMessagesByDate = (messages) => {
    if (!messages || !Array.isArray(messages)) return [];

    const groups = {};
    const now = new Date();

    messages.forEach(message => {
        const messageDate = new Date(message.created_at);
        const diffDays = Math.floor((now - messageDate) / 86400000);

        let dateLabel;
        if (diffDays === 0) {
            dateLabel = 'Today';
        } else if (diffDays === 1) {
            dateLabel = 'Yesterday';
        } else if (diffDays < 7) {
            dateLabel = messageDate.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            dateLabel = messageDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
        date,
        messages
    }));
};

/**
 * Validate message content
 */
export const validateMessage = (content, type = 'text') => {
    if (type === 'text') {
        if (!content || !content.trim()) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        if (content.length > 5000) {
            return { valid: false, error: 'Message too long (max 5000 characters)' };
        }
    }
    return { valid: true };
};

/**
 * Generate conversation name for group chats
 */
export const getConversationName = (conversation, currentUserId, users) => {
    if (conversation.type === 'group') {
        return conversation.group_name || 'Group Chat';
    }

    // For direct chats, get other user's name
    const otherUserId = getOtherUser(conversation, currentUserId);
    const otherUser = users?.find(u => u.id === otherUserId);
    return otherUser?.full_name || otherUser?.username || 'Unknown User';
};

/**
 * Check if conversation is muted
 */
export const isConversationMuted = (settings) => {
    if (!settings) return false;
    if (!settings.muted) return false;
    if (!settings.muted_until) return true;

    const mutedUntil = new Date(settings.muted_until);
    return mutedUntil > new Date();
};

/**
 * Get conversation avatar
 */
export const getConversationAvatar = (conversation, currentUserId, users) => {
    if (conversation.type === 'group') {
        return conversation.group_avatar || '/default-group-avatar.png';
    }

    const otherUserId = getOtherUser(conversation, currentUserId);
    const otherUser = users?.find(u => u.id === otherUserId);
    return otherUser?.avatar_url || '/default-avatar.png';
};

/**
 * Sort conversations by last message time
 */
export const sortConversations = (conversations) => {
    return [...conversations].sort((a, b) => {
        const timeA = a.last_message_at ? new Date(a.last_message_at) : new Date(a.created_at);
        const timeB = b.last_message_at ? new Date(b.last_message_at) : new Date(b.created_at);
        return timeB - timeA;
    });
};

/**
 * Filter conversations by search query
 */
export const filterConversations = (conversations, query, users) => {
    if (!query || !query.trim()) return conversations;

    const lowerQuery = query.toLowerCase();

    return conversations.filter(conv => {
        // Search in group name
        if (conv.type === 'group' && conv.group_name) {
            if (conv.group_name.toLowerCase().includes(lowerQuery)) return true;
        }

        // Search in user names for direct chats
        if (conv.type === 'direct') {
            const otherUserId = conv.participants.find(id => id !== users[0]?.id);
            const otherUser = users?.find(u => u.id === otherUserId);
            if (otherUser) {
                if (otherUser.full_name?.toLowerCase().includes(lowerQuery)) return true;
                if (otherUser.username?.toLowerCase().includes(lowerQuery)) return true;
            }
        }

        return false;
    });
};
