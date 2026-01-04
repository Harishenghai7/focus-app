/**
 * useGuardianship Hook
 * Manages guardian-teen relationships
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useGuardianship = () => {
    const { user } = useAuth();
    const [guardians, setGuardians] = useState([]);
    const [teens, setTeens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch guardians (if current user is a teen)
    const fetchGuardians = async () => {
        if (!user) return;

        try {
            const { data, error: fetchError } = await supabase
                .from('guardian_relationships')
                .select(`
          *,
          parent:parent_id (
            id,
            email,
            username,
            full_name,
            avatar_url
          )
        `)
                .eq('teen_id', user.id)
                .eq('status', 'active');

            if (fetchError) throw fetchError;
            setGuardians(data || []);
        } catch (err) {
            console.error('Error fetching guardians:', err);
            setError(err.message);
        }
    };

    // Fetch teens (if current user is a guardian)
    const fetchTeens = async () => {
        if (!user) {
            console.log('⚠️ useGuardianship: No user found');
            setTeens([]);
            return;
        }

        try {
            console.log('🔍 Fetching teens for guardian:', user.id);
            const { data, error: fetchError } = await supabase
                .from('guardian_relationships')
                .select(`
          *,
          teen:teen_id (
            id,
            email,
            username,
            full_name,
            avatar_url,
            age_verification (
              birth_date,
              is_coppa_mode,
              is_teen_mode
            )
          )
        `)
                .eq('parent_id', user.id)
                .in('status', ['active', 'pending']);

            if (fetchError) {
                console.error('❌ Error fetching teens:', fetchError);
                throw fetchError;
            }

            console.log('✅ Teens fetched:', data?.length || 0, data);
            setTeens(data || []);
        } catch (err) {
            console.error('❌ Error fetching teens:', err);
            setError(err.message);
            setTeens([]);
        }
    };

    // Send guardian invitation
    const sendInvitation = async (teenEmail, relationshipType = 'parent') => {
        if (!user) throw new Error('Not authenticated');

        try {
            // Generate invitation code
            const invitationCode = `INV-${Math.random().toString(36).substring(2, 15)}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            // Find teen by email
            const { data: teenData, error: teenError } = await supabase
                .from('users')
                .select('id')
                .eq('email', teenEmail)
                .single();

            if (teenError) throw new Error('Teen not found with this email');

            // Create pending relationship
            const { data, error: insertError } = await supabase
                .from('guardian_relationships')
                .insert({
                    parent_id: user.id,
                    teen_id: teenData.id,
                    relationship_type: relationshipType,
                    status: 'pending',
                    invitation_code: invitationCode,
                    invitation_sent_at: new Date().toISOString(),
                    invitation_expires_at: expiresAt.toISOString()
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // TODO: Send email notification to teen with invitation
            // await sendInvitationEmail(teenEmail, invitationCode);

            return { success: true, data };
        } catch (err) {
            console.error('Error sending invitation:', err);
            throw err;
        }
    };

    // Accept guardian invitation
    const acceptInvitation = async (relationshipId) => {
        if (!user) throw new Error('Not authenticated');

        try {
            const { data, error: updateError } = await supabase
                .from('guardian_relationships')
                .update({
                    status: 'active',
                    approved_at: new Date().toISOString()
                })
                .eq('id', relationshipId)
                .eq('teen_id', user.id)
                .eq('status', 'pending')
                .select()
                .single();

            if (updateError) throw updateError;

            // Log consent
            await supabase.from('consent_log').insert({
                user_id: user.id,
                consent_type: 'guardian_linking',
                consented_by: user.id,
                consent_given: true
            });

            await fetchGuardians();
            return { success: true, data };
        } catch (err) {
            console.error('Error accepting invitation:', err);
            throw err;
        }
    };

    // Reject guardian invitation
    const rejectInvitation = async (relationshipId) => {
        if (!user) throw new Error('Not authenticated');

        try {
            const { error: updateError } = await supabase
                .from('guardian_relationships')
                .update({ status: 'revoked' })
                .eq('id', relationshipId)
                .eq('teen_id', user.id);

            if (updateError) throw updateError;

            await fetchGuardians();
            return { success: true };
        } catch (err) {
            console.error('Error rejecting invitation:', err);
            throw err;
        }
    };

    // Remove guardian (teen removes guardian at 18+)
    const removeGuardian = async (relationshipId) => {
        if (!user) throw new Error('Not authenticated');

        try {
            // Check if user is 18+
            const { data: ageData } = await supabase
                .from('age_verification')
                .select('is_adult')
                .eq('user_id', user.id)
                .single();

            if (!ageData?.is_adult) {
                throw new Error('Only adults (18+) can remove guardians');
            }

            const { error: updateError } = await supabase
                .from('guardian_relationships')
                .update({
                    status: 'revoked',
                    revoked_at: new Date().toISOString(),
                    revoked_by: user.id,
                    revoke_reason: 'Removed by user (18+)'
                })
                .eq('id', relationshipId)
                .eq('teen_id', user.id);

            if (updateError) throw updateError;

            await fetchGuardians();
            return { success: true };
        } catch (err) {
            console.error('Error removing guardian:', err);
            throw err;
        }
    };

    // Check if user has permission
    const hasPermission = (relationship, permission) => {
        if (!relationship?.permissions) return false;
        return relationship.permissions[permission] === true;
    };

    // Update guardian permissions (guardian can modify)
    const updatePermissions = async (relationshipId, newPermissions) => {
        if (!user) throw new Error('Not authenticated');

        try {
            const { data, error: updateError } = await supabase
                .from('guardian_relationships')
                .update({ permissions: newPermissions })
                .eq('id', relationshipId)
                .eq('parent_id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;

            await fetchTeens();
            return { success: true, data };
        } catch (err) {
            console.error('Error updating permissions:', err);
            throw err;
        }
    };

    // Subscribe to realtime changes
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchGuardians(), fetchTeens()]);
            setLoading(false);
        };

        fetchData();

        // Realtime subscription
        const subscription = supabase
            .channel('guardian_relationships_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'guardian_relationships',
                    filter: `teen_id=eq.${user.id},parent_id=eq.${user.id}`
                },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    return {
        guardians,
        teens,
        loading,
        error,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        removeGuardian,
        hasPermission,
        updatePermissions,
        refetch: () => Promise.all([fetchGuardians(), fetchTeens()])
    };
};
