import { supabase } from '../lib/supabase';

export const initializeTrustShield = async (userId) => {
    if (!userId) {
        throw new Error('User not authenticated.');
    }

    const { data, error } = await supabase
        .from('user_trust_metrics')
        .select('user_id')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }

    if (data) {
        return { initialized: true };
    }

    const { error: insertError } = await supabase
        .from('user_trust_metrics')
        .insert({
            user_id: userId,
            created_at: new Date().toISOString()
        });

    if (insertError) throw insertError;

    return { initialized: true };
};
