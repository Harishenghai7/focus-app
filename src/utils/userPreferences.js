import { supabase } from '../lib/supabase';

const PREFERENCE_FIELDS = ['hidden_posts', 'hidden_boltz', 'interested_boltz'];

export const getUserPreferences = async (userId) => {
    if (!userId) return null;

    const { data, error } = await supabase
        .from('user_preferences')
        .select('user_id, hidden_posts, hidden_boltz, interested_boltz')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data || null;
};

export const upsertUserPreferenceArray = async (userId, field, value) => {
    if (!userId) {
        throw new Error('User is required');
    }

    if (!PREFERENCE_FIELDS.includes(field)) {
        throw new Error('Invalid preference field');
    }

    if (!value) {
        throw new Error('Preference value is required');
    }

    const existing = await getUserPreferences(userId);
    const current = Array.isArray(existing?.[field]) ? existing[field] : [];
    const next = current.includes(value) ? current : [...current, value];
    const timestamp = new Date().toISOString();

    if (existing) {
        const { error } = await supabase
            .from('user_preferences')
            .update({
                [field]: next,
                updated_at: timestamp
            })
            .eq('user_id', userId);

        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('user_preferences')
            .insert({
                user_id: userId,
                [field]: next,
                created_at: timestamp,
                updated_at: timestamp
            });

        if (error) throw error;
    }

    return next;
};
