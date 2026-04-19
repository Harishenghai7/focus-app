/**
 * Age Verification Utility
 * Handle age-based account type detection and default settings
 */

import { supabase } from '../lib/supabase';

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Determine account type based on age
 */
export const getAccountType = (age) => {
    if (age < 13) {
        return {
            type: 'coppa',
            label: 'Child Account (Under 13)',
            requiresGuardian: true,
            needsApproval: true
        };
    } else if (age >= 13 && age < 18) {
        return {
            type: 'teen',
            label: 'Teen Account (13-17)',
            requiresGuardian: false, //Optional
            needsApproval: false
        };
    } else {
        return {
            type: 'adult',
            label: 'Adult Account (18+)',
            requiresGuardian: false,
            needsApproval: false
        };
    }
};

/**
 * Verify age and create age_verification record
 */
export const verifyAge = async (userId, birthDate, verificationMethod = 'self_reported') => {
    try {
        const age = calculateAge(birthDate);
        const accountType = getAccountType(age);

        const { data, error } = await supabase
            .from('age_verification')
            .upsert({
                user_id: userId,
                birth_date: birthDate,
                verification_method: verificationMethod,
                is_coppa_mode: accountType.type === 'coppa',
                is_teen_mode: accountType.type === 'teen',
                is_adult: accountType.type === 'adult',
                requires_guardian: accountType.requiresGuardian,
                account_activated: !accountType.needsApproval
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            age,
            accountType,
            data
        };
    } catch (error) {
        console.error('Error verifying age:', error);
        throw error;
    }
};

/**
 * Apply default teen mode settings
 * Called automatically by database trigger, but can be called manually too
 */
export const applyTeenModeDefaults = async (userId, accountType) => {
    try {
        if (accountType !== 'teen' && accountType !== 'coppa') {
            return { success: true, message: 'Not a teen/child account, no defaults to apply' };
        }

        const isCoppa = accountType === 'coppa';

        // 1. Apply content filter settings
        await supabase.from('content_filter_settings').upsert({
            user_id: userId,
            nsfw_filter_enabled: true,
            violence_filter_enabled: true,
            profanity_filter_enabled: true,
            hide_offensive_comments: true,
            require_comment_approval: isCoppa,
            block_stranger_posts: isCoppa,
            hide_sensitive_content: true,
            prevent_download: true,
            content_visibility: isCoppa ? 'private' : 'followers_only',
            managed_by_guardian: isCoppa,
            guardian_locked: isCoppa
        });

        // 2. Apply contact restrictions
        await supabase.from('contact_restrictions').upsert({
            user_id: userId,
            allow_messages_from: isCoppa ? 'approved_contacts' : 'followers_only',
            allow_comments_from: isCoppa ? 'off' : 'followers_only',
            allow_mentions_from: 'followers_only',
            require_mention_approval: true,
            allow_group_invites: false,
            require_group_approval: true,
            block_adult_strangers: true,
            alert_on_stranger_message: true,
            managed_by_guardian: isCoppa,
            guardian_locked: isCoppa
        });

        // 3. Set screen time limits (if COPPA mode)
        if (isCoppa) {
            await supabase.from('screen_time_limits').upsert({
                teen_id: userId,
                daily_limit_minutes: 60, // 1 hour for under-13
                enabled: true,
                time_blocks: [
                    {
                        name: 'Bedtime',
                        start: '21:00',
                        end: '07:00',
                        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                    }
                ]
            });
        } else {
            // Teen mode - 2 hours default
            await supabase.from('screen_time_limits').upsert({
                teen_id: userId,
                daily_limit_minutes: 120,
                weekend_limit_minutes: 180, // 3 hours on weekends
                enabled: true,
                time_blocks: [
                    {
                        name: 'Bedtime',
                        start: '22:00',
                        end: '07:00',
                        days: ['mon', 'tue', 'wed', 'thu', 'fri']
                    }
                ]
            });
        }

        // 4. Update user profile settings (make account private for teens)
        await supabase
            .from('users')
            .update({
                is_private: true, // Private by default
                allow_dms: isCoppa ? false : true
            })
            .eq('id', userId);

        return {
            success: true,
            message: `${isCoppa ? 'COPPA' : 'Teen'} mode defaults applied successfully`
        };
    } catch (error) {
        console.error('Error applying teen mode defaults:', error);
        throw error;
    }
};

/**
 * Check if user is eligible to remove guardians (18+)
 */
export const canRemoveGuardians = async (userId) => {
    try {
        const { data } = await supabase
            .from('age_verification')
            .select('is_adult')
            .eq('user_id', userId)
            .single();

        return data?.is_adult || false;
    } catch (error) {
        console.error('Error checking guardian removal eligibility:', error);
        return false;
    }
};

/**
 * Transition user from teen to adult (called on 18th birthday)
 */
export const transitionToAdult = async (userId) => {
    try {
        // 1. Update age verification
        await supabase
            .from('age_verification')
            .update({
                is_teen_mode: false,
                is_adult: true,
                requires_guardian: false
            })
            .eq('user_id', userId);

        // 2. Unlock guardian-managed settings (user can now change them)
        await supabase
            .from('content_filter_settings')
            .update({
                managed_by_guardian: false,
                guardian_locked: false
            })
            .eq('user_id', userId);

        await supabase
            .from('contact_restrictions')
            .update({
                managed_by_guardian: false,
                guardian_locked: false
            })
            .eq('user_id', userId);

        // 3. Disable screen time limits (optional - user can re-enable)
        await supabase
            .from('screen_time_limits')
            .update({ enabled: false })
            .eq('teen_id', userId);

        // 4. Send notification to user about transition
        // TODO: Implement notification system

        return {
            success: true,
            message: 'Successfully transitioned to adult account. You can now remove guardians if desired.'
        };
    } catch (error) {
        console.error('Error transitioning to adult:', error);
        throw error;
    }
};

/**
 * Get user's age verification status
 */
export const getAgeVerificationStatus = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('age_verification')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) {
            return {
                verified: false,
                accountType: null
            };
        }

        const age = calculateAge(data.birth_date);

        return {
            verified: true,
            age,
            birthDate: data.birth_date,
            isCoppaMode: data.is_coppa_mode,
            isTeenMode: data.is_teen_mode,
            isAdult: data.is_adult,
            requiresGuardian: data.requires_guardian,
            accountActivated: data.account_activated,
            accountType: data.is_coppa_mode ? 'coppa' : (data.is_teen_mode ? 'teen' : 'adult')
        };
    } catch (error) {
        console.error('Error getting age verification status:', error);
        throw error;
    }
};

const _defaultModule = {
    calculateAge,
    getAccountType,
    verifyAge,
    applyTeenModeDefaults,
    canRemoveGuardians,
    transitionToAdult,
    getAgeVerificationStatus
};


export default _defaultModule;
