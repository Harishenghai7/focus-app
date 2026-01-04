/* ═══════════════════════════════════════════════════════════════════════
   BLOCK & REPORT BACKEND - Complete implementation
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import { supabase } from '../../../lib/supabase';

/**
 * Block a user
 */
export const blockUser = async (userId, blockedUserId) => {
    try {
        // Add to blocked_users table
        const { error } = await supabase
            .from('blocked_users')
            .insert({
                user_id: userId,
                blocked_user_id: blockedUserId,
                blocked_at: new Date().toISOString()
            });

        if (error) throw error;

        // Hide all conversations with blocked user
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id, participants')
            .contains('participants', [userId])
            .contains('participants', [blockedUserId]);

        for (const conv of conversations || []) {
            await supabase
                .from('conversation_settings')
                .upsert({
                    conversation_id: conv.id,
                    user_id: userId,
                    archived: true,
                    muted: true
                }, {
                    onConflict: 'conversation_id,user_id'
                });
        }

        return true;
    } catch (error) {
        console.error('Error blocking user:', error);
        return false;
    }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId, blockedUserId) => {
    try {
        await supabase
            .from('blocked_users')
            .delete()
            .eq('user_id', userId)
            .eq('blocked_user_id', blockedUserId);

        return true;
    } catch (error) {
        console.error('Error unblocking user:', error);
        return false;
    }
};

/**
 * Check if user is blocked
 */
export const isUserBlocked = async (userId, otherUserId) => {
    try {
        const { data } = await supabase
            .from('blocked_users')
            .select('id')
            .eq('user_id', userId)
            .eq('blocked_user_id', otherUserId)
            .single();

        return !!data;
    } catch (error) {
        return false;
    }
};

/**
 * Get blocked users list
 */
export const getBlockedUsers = async (userId) => {
    try {
        const { data } = await supabase
            .from('blocked_users')
            .select('*, profiles!blocked_user_id(*)')
            .eq('user_id', userId)
            .order('blocked_at', { ascending: false });

        return data || [];
    } catch (error) {
        console.error('Error getting blocked users:', error);
        return [];
    }
};

/**
 * Report a conversation
 */
export const reportConversation = async (userId, conversationId, reason, details) => {
    try {
        const { error } = await supabase
            .from('reports')
            .insert({
                reporter_id: userId,
                reported_type: 'conversation',
                reported_id: conversationId,
                reason,
                details,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error reporting conversation:', error);
        return false;
    }
};

/**
 * Report a message
 */
export const reportMessage = async (userId, messageId, reason, details) => {
    try {
        const { error } = await supabase
            .from('reports')
            .insert({
                reporter_id: userId,
                reported_type: 'message',
                reported_id: messageId,
                reason,
                details,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error reporting message:', error);
        return false;
    }
};

/**
 * Report reasons
 */
export const REPORT_REASONS = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'violence', label: 'Violence or threats' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'other', label: 'Other' }
];
