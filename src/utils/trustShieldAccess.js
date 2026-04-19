import { supabase } from '../lib/supabase';

export const assertTrustShieldVerified = async (userId) => {
    if (!userId) {
        throw new Error('TRUST_SHIELD_REQUIRED');
    }

    const { error } = await supabase.rpc('assert_trust_shield_verified', { p_user_id: userId });
    if (!error) return true;

    // Fallback in case RPC is not yet deployed.
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', userId)
        .single();

    if (profileError) throw error;
    const status = String(profile?.verification_status || '').toUpperCase();
    if (status !== 'VERIFIED' && status !== 'VERIFIED_MINOR') {
        throw error;
    }
    return true;
};

export default assertTrustShieldVerified;
