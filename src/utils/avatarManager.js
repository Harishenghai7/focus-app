import { supabase } from '../lib/supabase';

/**
 * Get the user's avatar URL with proper fallback chain
 * Priority: profiles.avatar_url -> user_metadata.avatar_url -> generated avatar
 */
export const getUserAvatarUrl = (user, profile) => {
    // 1. Check profile table first (highest priority)
    if (profile?.avatar_url) {
        return profile.avatar_url;
    }

    // 2. Check OAuth metadata (second priority)
    if (user?.user_metadata?.avatar_url) {
        return user.user_metadata.avatar_url;
    }

    // 3. Fallback to generated avatar
    const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=B794F6&color=fff&size=128`;
};

/**
 * Sync OAuth avatar to profiles table
 * Call this after OAuth login
 */
export const syncOAuthAvatar = async (userId) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.user_metadata?.avatar_url) {
            return; // No OAuth avatar to sync
        }

        // Check if profile already has an avatar
        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();

        // Only sync if profile doesn't have an avatar yet
        if (!profile?.avatar_url) {
            await supabase
                .from('profiles')
                .update({ avatar_url: user.user_metadata.avatar_url })
                .eq('id', userId);

            console.log('✅ OAuth avatar synced to profile');
        }
    } catch (error) {
        console.error('Avatar sync error:', error);
    }
};
