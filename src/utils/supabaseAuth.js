import { supabase } from '../lib/supabase';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

/**
 * Sign in with username (converts username to email first)
 */
export const signInWithUsername = async (username, password) => {
    try {
        // Get email from username
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username)
            .single();

        if (profileError || !profile) {
            return {
                data: null,
                error: { message: 'Username not found' }
            };
        }

        // Sign in with email
        return await signInWithEmail(profile.email, password);
    } catch (err) {
        return { data: null, error: err };
    }
};

/**
 * Sign up with email, password, username, and date of birth
 */
export const signUpWithEmail = async (email, password, username, dateOfBirth = null) => {
    const metadata = {
        username,
    };

    if (dateOfBirth) {
        metadata.date_of_birth = dateOfBirth;
    }

    // V1.0: Skip email verification - users are auto-confirmed
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
            emailRedirectTo: `${window.location.origin}/onboarding`,
            // Email confirmation is disabled in Supabase settings for v1.0
        },
    });

    return { data, error };
};

/**
 * Create user profile manually (if trigger fails)
 */
export const createUserProfile = async (userId, username, email, dateOfBirth, isTeen) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            username,
            email,
            date_of_birth: dateOfBirth,
            is_teen: isTeen,
            account_privacy: 'public',
            created_at: new Date().toISOString()
        });

    return { data, error };
};

/**
 * Create user settings manually (if trigger fails)
 */
export const createUserSettings = async (userId, isTeen) => {
    const { data, error } = await supabase
        .from('user_settings')
        .insert({
            user_id: userId,
            account_privacy: 'public',
            notifications_enabled: true,
            content_filter_level: isTeen ? 'strict' : 'moderate',
            created_at: new Date().toISOString()
        });

    return { data, error };
};

/**
 * Create user presence manually (if trigger fails)
 */
export const createUserPresence = async (userId) => {
    const { data, error } = await supabase
        .from('user_presence')
        .upsert({
            user_id: userId,
            is_online: true,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    return { data, error };
};

/**
 * Update user presence (online status)
 */
export const updateUserPresence = async (userId, isOnline = true) => {
    const { data, error } = await supabase
        .from('user_presence')
        .upsert({
            user_id: userId,
            is_online: isOnline,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    return { data, error };
};

/**
 * Sign out
 */
export const signOut = async () => {
    // Update presence to offline before signing out
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await updateUserPresence(user.id, false);
    }

    const { error } = await supabase.auth.signOut();
    return { error };
};

/**
 * Reset password for email
 */
export const resetPasswordForEmail = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
};

/**
 * Update user password
 */
export const updateUserPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    return { data, error };
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email) => {
    const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
    });
    return { data, error };
};

/**
 * Sign in with OAuth provider
 */
export const signInWithOAuth = async (provider) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: `${window.location.origin}`,
            skipBrowserRedirect: false,
        }
    });
    return { data, error };
};

/**
 * Check if email is verified
 */
export const isEmailVerified = (user) => {
    return user && user.email_confirmed_at !== null;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};

