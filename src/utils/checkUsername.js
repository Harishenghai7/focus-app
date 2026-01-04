import { supabase } from '../lib/supabase';

/**
 * Checks if a username is already taken in the 'profiles' table.
 * @param {string} username - The username to check.
 * @returns {Promise<boolean>} - True if available, false if taken.
 */
export const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return false;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle(); // Changed from .single() to .maybeSingle() to prevent 406 error

        if (error) {
            console.error('Error checking username:', error);
            return false; // Fail safe to "not available" on error
        }

        // If data exists, username is taken; if null, it's available
        return !data;
    } catch (error) {
        console.error('Error checking username:', error);
        return false; // Fail safe to "not available" on error to prevent duplicates
    }
};
