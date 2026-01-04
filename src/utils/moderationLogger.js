import { supabase } from '../lib/supabase';

export const logModerationAction = async ({
    userId,
    contentId,
    contentType, // 'post', 'comment', etc.
    reason,
    toxicScore,
    nsfwScore,
    blockType, // 'soft', 'hard', 'shadow'
    status = 'blocked',
    adminAction = null
}) => {
    try {
        // In a real app, you might want to strip this out in production if it's too noisy, 
        // or ensure it only runs if the user is actually blocked.

        const { data, error } = await supabase
            .from('blocked_content')
            .insert([
                {
                    user_id: userId,
                    content_id: contentId,
                    type: contentType,
                    reason,
                    toxic_score: toxicScore,
                    nsfw_score: nsfwScore,
                    block_type: blockType,
                    status,
                    admin_action: adminAction
                }
            ])
            .select();

        if (error) {
            console.error('Error logging moderation action:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.error('Unexpected error logging moderation:', err);
        return null;
    }
};
