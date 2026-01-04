import { supabase } from '../lib/supabase';

/**
 * Supabase Badge Operations
 * All database operations for the badge system
 */

// ==================== BADGE DEFINITIONS ====================

/**
 * Fetch all badge definitions
 */
export const fetchBadgeDefinitions = async () => {
    const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching badge definitions:', error);
        return [];
    }

    return data;
};

/**
 * Fetch single badge definition by name
 */
export const fetchBadgeDefinition = async (badgeName) => {
    const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .eq('name', badgeName)
        .single();

    if (error) {
        console.error('Error fetching badge definition:', error);
        return null;
    }

    return data;
};

// ==================== USER BADGES ====================

/**
 * Fetch user's badges
 */
export const fetchUserBadges = async (userId) => {
    const { data, error } = await supabase
        .from('user_badges')
        .select(`
            *,
            badge:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('date_awarded', { ascending: false });

    if (error) {
        console.error('Error fetching user badges:', error);
        return [];
    }

    return data;
};

/**
 * Check if user has specific badge
 */
export const userHasBadge = async (userId, badgeName) => {
    const { data, error } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('badge_id', (
            supabase
                .from('badge_definitions')
                .select('id')
                .eq('name', badgeName)
                .single()
        ))
        .maybeSingle();

    return !!data && !error;
};

/**
 * Award badge to user
 */
export const awardBadge = async (userId, badgeName, adminNotes = null, actorId = null) => {
    try {
        // Get badge definition
        const badgeDef = await fetchBadgeDefinition(badgeName);
        if (!badgeDef) {
            throw new Error('Badge definition not found');
        }

        // Check if user already has this badge
        const { data: existing } = await supabase
            .from('user_badges')
            .select('id, status')
            .eq('user_id', userId)
            .eq('badge_id', badgeDef.id)
            .maybeSingle();

        if (existing) {
            if (existing.status === 'active') {
                return { success: false, error: 'User already has this badge' };
            }
            // Reactivate revoked badge
            const { error: updateError } = await supabase
                .from('user_badges')
                .update({
                    status: 'active',
                    date_awarded: new Date().toISOString(),
                    date_revoked: null,
                    admin_notes: adminNotes
                })
                .eq('id', existing.id);

            if (updateError) throw updateError;
        } else {
            // Insert new badge
            const { error: insertError } = await supabase
                .from('user_badges')
                .insert({
                    user_id: userId,
                    badge_id: badgeDef.id,
                    status: 'active',
                    admin_notes: adminNotes
                });

            if (insertError) throw insertError;
        }

        // Log to audit
        await logBadgeAction(badgeDef.id, userId, 'awarded', actorId || userId, {
            admin_notes: adminNotes
        });

        return { success: true };
    } catch (error) {
        console.error('Error awarding badge:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Revoke badge from user
 */
export const revokeBadge = async (userId, badgeName, reason = null, actorId = null) => {
    try {
        const badgeDef = await fetchBadgeDefinition(badgeName);
        if (!badgeDef) {
            throw new Error('Badge definition not found');
        }

        const { error } = await supabase
            .from('user_badges')
            .update({
                status: 'revoked',
                date_revoked: new Date().toISOString(),
                admin_notes: reason
            })
            .eq('user_id', userId)
            .eq('badge_id', badgeDef.id);

        if (error) throw error;

        // Log to audit
        await logBadgeAction(badgeDef.id, userId, 'revoked', actorId || userId, {
            reason
        });

        return { success: true };
    } catch (error) {
        console.error('Error revoking badge:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update badge visibility
 */
export const updateBadgeVisibility = async (userId, badgeName, visibility) => {
    try {
        const badgeDef = await fetchBadgeDefinition(badgeName);
        if (!badgeDef) {
            throw new Error('Badge definition not found');
        }

        const { error } = await supabase
            .from('user_badges')
            .update({ visibility })
            .eq('user_id', userId)
            .eq('badge_id', badgeDef.id);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error updating badge visibility:', error);
        return { success: false, error: error.message };
    }
};

// ==================== BADGE APPLICATIONS ====================

/**
 * Submit badge application
 */
export const submitBadgeApplication = async (userId, badgeName, applicationData) => {
    try {
        const badgeDef = await fetchBadgeDefinition(badgeName);
        if (!badgeDef) {
            throw new Error('Badge definition not found');
        }

        // Check for existing pending application
        const { data: existing } = await supabase
            .from('badge_applications')
            .select('id, status')
            .eq('user_id', userId)
            .eq('badge_id', badgeDef.id)
            .in('status', ['pending', 'under_review'])
            .maybeSingle();

        if (existing) {
            return { success: false, error: 'You already have a pending application for this badge' };
        }

        const { data, error } = await supabase
            .from('badge_applications')
            .insert({
                user_id: userId,
                badge_id: badgeDef.id,
                application_data: applicationData,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, application: data };
    } catch (error) {
        console.error('Error submitting badge application:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch user's badge applications
 */
export const fetchUserApplications = async (userId) => {
    const { data, error } = await supabase
        .from('badge_applications')
        .select(`
            *,
            badge:badge_definitions(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return data;
};

/**
 * Fetch all pending applications (admin)
 */
export const fetchPendingApplications = async () => {
    const { data, error } = await supabase
        .from('badge_applications')
        .select(`
            *,
            badge:badge_definitions(*),
            user:user_id(id, email, user_metadata)
        `)
        .in('status', ['pending', 'under_review'])
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending applications:', error);
        return [];
    }

    return data;
};

/**
 * Update application status (admin)
 */
export const updateApplicationStatus = async (applicationId, status, adminResponse, reviewerId) => {
    try {
        const { data, error } = await supabase
            .from('badge_applications')
            .update({
                status,
                admin_response: adminResponse,
                reviewed_by: reviewerId,
                resolved_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;

        // If approved, award the badge
        if (status === 'approved') {
            const { data: app } = await supabase
                .from('badge_applications')
                .select('user_id, badge:badge_definitions(name)')
                .eq('id', applicationId)
                .single();

            if (app) {
                await awardBadge(app.user_id, app.badge.name, `Approved via application`, reviewerId);
            }
        }

        return { success: true, application: data };
    } catch (error) {
        console.error('Error updating application status:', error);
        return { success: false, error: error.message };
    }
};

// ==================== AUDIT LOG ====================

/**
 * Log badge action to audit log
 */
export const logBadgeAction = async (badgeId, userId, action, actorId, metadata = {}) => {
    try {
        await supabase
            .from('badge_audit_log')
            .insert({
                badge_id: badgeId,
                user_id: userId,
                action,
                actor_id: actorId,
                metadata
            });
    } catch (error) {
        console.error('Error logging badge action:', error);
    }
};

/**
 * Fetch audit log for user
 */
export const fetchUserAuditLog = async (userId, limit = 50) => {
    const { data, error } = await supabase
        .from('badge_audit_log')
        .select(`
            *,
            badge:badge_definitions(name, icon, color)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching audit log:', error);
        return [];
    }

    return data;
};

/**
 * Fetch full audit log (admin)
 */
export const fetchFullAuditLog = async (limit = 100) => {
    const { data, error } = await supabase
        .from('badge_audit_log')
        .select(`
            *,
            badge:badge_definitions(name, icon, color),
            user:user_id(email, user_metadata),
            actor:actor_id(email, user_metadata)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching full audit log:', error);
        return [];
    }

    return data;
};

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to user badge changes
 */
export const subscribeToUserBadges = (userId, callback) => {
    const subscription = supabase
        .channel(`user-badges-${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'user_badges',
                filter: `user_id=eq.${userId}`
            },
            callback
        )
        .subscribe();

    return subscription;
};

/**
 * Subscribe to badge applications (admin)
 */
export const subscribeToBadgeApplications = (callback) => {
    const subscription = supabase
        .channel('badge-applications')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'badge_applications'
            },
            callback
        )
        .subscribe();

    return subscription;
};
