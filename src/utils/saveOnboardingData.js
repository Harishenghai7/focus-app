import { supabase } from '../lib/supabase';

/**
 * Saves the user's onboarding data.
 * @param {string} userId - The user's ID.
 * @param {object} profileData - { username, full_name, bio, avatar_url, website }
 * @param {Array} interests - List of interest strings.
 * @returns {Promise<void>}
 */
export const saveOnboardingData = async (userId, profileData, interests) => {
    try {
        // 1. Ensure Profile Exists (insert if missing)
        const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (!existingProfile) {
            const { error: insertError } = await supabase.from('profiles').insert([
                {
                    id: userId,
                    username: profileData.username,
                    full_name: profileData.full_name,
                    bio: profileData.bio,
                    avatar_url: profileData.avatar_url,
                    website: profileData.website,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                }
            ]);
            if (insertError) throw insertError;
        } else {
            // 2. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: profileData.username,
                    full_name: profileData.full_name,
                    bio: profileData.bio,
                    avatar_url: profileData.avatar_url,
                    website: profileData.website,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);
            if (profileError) throw profileError;
        }

        // 3. Save Interests (with error handling for missing table)
        if (interests && interests.length > 0) {
            try {
                // First delete existing interests
                const { error: deleteError } = await supabase
                    .from('user_interests')
                    .delete()
                    .eq('user_id', userId);

                if (deleteError && deleteError.code !== '42P01') {
                    // 42P01 is "table does not exist" error code
                    console.warn('Error deleting existing interests:', deleteError);
                }

                // Insert new interests
                const interestInserts = interests.map(interest => ({
                    user_id: userId,
                    interest_id: interest
                }));

                const { error: interestError } = await supabase
                    .from('user_interests')
                    .insert(interestInserts);

                if (interestError) {
                    if (interestError.code === '42P01') {
                        console.error('❌ user_interests table does not exist! Please run FIX_USER_INTERESTS_TABLE.sql in Supabase SQL Editor');
                    }
                    throw interestError;
                }
            } catch (interestError) {
                console.error('Error saving interests:', interestError);
                // Don't fail the entire onboarding if interests fail
                // Just log the error and continue
                console.warn('⚠️ Interests not saved, but profile was updated successfully');
            }
        }

    } catch (error) {
        console.error('Error saving onboarding data:', error);
        throw error;
    }
};
