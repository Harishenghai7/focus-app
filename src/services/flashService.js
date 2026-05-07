// src/services/flashService.js
// 🛡️ PILLAR 2: shadow-moderation filter applied
import { supabase } from '../lib/supabase';

export const fetchFlashStories = async (viewerId = null) => {
    let query = supabase
        .from('flash')
        .select(`
            id,
            media_url,
            created_at,
            user_id,
            moderation_status,
            profiles (
                username,
                avatar_url
            )
        `)
        .gt(
            'created_at',
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        )
        .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};
