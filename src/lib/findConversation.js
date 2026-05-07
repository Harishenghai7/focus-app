// Helper function to find existing conversation
// Add this to directApi.js

import { supabaseUrl, supabaseAnonKey } from './supabase';

/**
 * Find existing conversation between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<{conversationId: string|null, error: any}>}
 */
export const findExistingConversation = async (userId1, userId2) => {
    try {


        // Get conversations where user1 is a participant
        const user1ConvsUrl = `${supabaseUrl}/rest/v1/conversation_participants?select=conversation_id&user_id=eq.${userId1}`;
        const response1 = await fetch(user1ConvsUrl, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
            }
        });

        if (!response1.ok) return { conversationId: null, error: null };

        const user1Convs = await response1.json();
        const convIds = user1Convs.map(c => c.conversation_id);

        if (convIds.length === 0) {

            return { conversationId: null, error: null };
        }

        // Check which of these conversations also has user2
        for (const convId of convIds) {
            const checkUrl = `${supabaseUrl}/rest/v1/conversation_participants?select=conversation_id&conversation_id=eq.${convId}&user_id=eq.${userId2}`;
            const response2 = await fetch(checkUrl, {
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                }
            });

            if (response2.ok) {
                const result = await response2.json();
                if (result.length > 0) {

                    return { conversationId: convId, error: null };
                }
            }
        }


        return { conversationId: null, error: null };

    } catch (error) {
        console.error('❌ Error finding conversation:', error);
        return { conversationId: null, error };
    }
};
