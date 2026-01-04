/* ═══════════════════════════════════════════════════════════════════════
   FRIENDSHIP INSIGHTS - Analytics and stats
   Phase 5: Future Enhancements
   ═══════════════════════════════════════════════════════════════════════ */

import { supabase } from '../../../lib/supabase';

/**
 * Get friendship insights for a conversation
 */
export const getFriendshipInsights = async (conversationId, userId) => {
    try {
        // Fetch all messages
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('deleted', false);

        if (!messages || messages.length === 0) {
            return null;
        }

        // Calculate insights
        const insights = {
            totalMessages: messages.length,
            yourMessages: messages.filter(m => m.sender_id === userId).length,
            theirMessages: messages.filter(m => m.sender_id !== userId).length,

            // Message types
            textMessages: messages.filter(m => m.type === 'text').length,
            photoMessages: messages.filter(m => m.type === 'image').length,
            videoMessages: messages.filter(m => m.type === 'video').length,
            voiceMessages: messages.filter(m => m.type === 'voice').length,

            // Reactions
            totalReactions: messages.reduce((sum, m) => {
                const reactions = m.reactions || {};
                return sum + Object.keys(reactions).length;
            }, 0),

            // Timing
            firstMessage: messages[messages.length - 1]?.created_at,
            lastMessage: messages[0]?.created_at,
            daysSinceFirstMessage: Math.floor(
                (new Date() - new Date(messages[messages.length - 1]?.created_at)) / (1000 * 60 * 60 * 24)
            ),

            // Activity
            averageMessagesPerDay: messages.length / Math.max(1, Math.floor(
                (new Date() - new Date(messages[messages.length - 1]?.created_at)) / (1000 * 60 * 60 * 24)
            )),

            // Most active hour
            mostActiveHour: getMostActiveHour(messages),

            // Streak
            currentStreak: calculateStreak(messages),
            longestStreak: calculateLongestStreak(messages),

            // Response time
            averageResponseTime: calculateAverageResponseTime(messages, userId)
        };

        return insights;
    } catch (error) {
        console.error('Error getting friendship insights:', error);
        return null;
    }
};

/**
 * Get most active hour
 */
const getMostActiveHour = (messages) => {
    const hourCounts = {};

    messages.forEach(msg => {
        const hour = new Date(msg.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActive = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])[0];

    return mostActive ? parseInt(mostActive[0]) : 12;
};

/**
 * Calculate current streak (consecutive days with messages)
 */
const calculateStreak = (messages) => {
    if (messages.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(messages[0].created_at);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < messages.length; i++) {
        const msgDate = new Date(messages[i].created_at);
        msgDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate - msgDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            streak++;
            currentDate = msgDate;
        } else if (dayDiff > 1) {
            break;
        }
    }

    return streak;
};

/**
 * Calculate longest streak
 */
const calculateLongestStreak = (messages) => {
    if (messages.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;
    let currentDate = new Date(messages[0].created_at);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < messages.length; i++) {
        const msgDate = new Date(messages[i].created_at);
        msgDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((currentDate - msgDate) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
            currentDate = msgDate;
        } else if (dayDiff > 1) {
            currentStreak = 1;
            currentDate = msgDate;
        }
    }

    return longestStreak;
};

/**
 * Calculate average response time
 */
const calculateAverageResponseTime = (messages, userId) => {
    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < messages.length; i++) {
        if (messages[i].sender_id === userId && messages[i - 1].sender_id !== userId) {
            const responseTime = new Date(messages[i].created_at) - new Date(messages[i - 1].created_at);
            totalTime += responseTime;
            count++;
        }
    }

    if (count === 0) return 0;

    const avgMs = totalTime / count;
    const avgMinutes = Math.floor(avgMs / (1000 * 60));

    return avgMinutes;
};

/**
 * Get friendship milestones
 */
export const getFriendshipMilestones = (insights) => {
    const milestones = [];

    if (insights.totalMessages >= 100) {
        milestones.push({ icon: '💯', title: 'Century Club', description: '100+ messages' });
    }
    if (insights.totalMessages >= 1000) {
        milestones.push({ icon: '🎉', title: 'Chatty Friends', description: '1000+ messages' });
    }
    if (insights.currentStreak >= 7) {
        milestones.push({ icon: '🔥', title: 'Week Streak', description: '7 days in a row' });
    }
    if (insights.currentStreak >= 30) {
        milestones.push({ icon: '⭐', title: 'Month Streak', description: '30 days in a row' });
    }
    if (insights.voiceMessages >= 50) {
        milestones.push({ icon: '🎤', title: 'Voice Champion', description: '50+ voice messages' });
    }
    if (insights.totalReactions >= 100) {
        milestones.push({ icon: '❤️', title: 'Reaction Master', description: '100+ reactions' });
    }

    return milestones;
};
