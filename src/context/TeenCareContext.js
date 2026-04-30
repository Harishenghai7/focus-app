import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TeenCareContext = createContext();

export const useTeenCare = () => {
    const context = useContext(TeenCareContext);
    if (!context) {
        throw new Error('useTeenCare must be used within a TeenCareProvider');
    }
    return context;
};

export const TeenCareProvider = ({ children }) => {
    const { user } = useAuth();

    // User role states
    const [isGuardian, setIsGuardian] = useState(false);
    const [isTeen, setIsTeen] = useState(false);
    const [isCoppaMode, setIsCoppaMode] = useState(false);
    const [userAge, setUserAge] = useState(null);

    // Guardian data
    const [linkedTeens, setLinkedTeens] = useState([]);
    const [guardianAlerts, setGuardianAlerts] = useState([]);
    const [pendingInvitations, setPendingInvitations] = useState([]);

    // Teen data
    const [myGuardians, setMyGuardians] = useState([]);
    const [safetySettings, setSafetySettings] = useState(null);
    const [screenTimeStatus, setScreenTimeStatus] = useState(null);
    const [trustedContacts, setTrustedContacts] = useState([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Calculate age from birth date
    const calculateAge = (birthDate) => {
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

    // Fetch user's teen care status
    const fetchUserStatus = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Check if user is a guardian
            const { data: guardianData } = await supabase
                .from('guardian_relationships')
                .select('*')
                .eq('guardian_id', user.id)
                .eq('status', 'active');

            setIsGuardian(guardianData?.length > 0);

            // Check if user is a teen
            const { data: teenSettings } = await supabase
                .from('teen_safety_settings')
                .select('*')
                .eq('teen_id', user.id)
                .single();

            if (teenSettings) {
                setIsTeen(true);
                setSafetySettings(teenSettings);
                setIsCoppaMode(teenSettings.coppa_mode);
                setUserAge(calculateAge(teenSettings.birth_date));
            }

            // Fetch linked teens for guardians
            if (guardianData?.length > 0) {
                const teenIds = guardianData.map(g => g.teen_id);
                const { data: teens } = await supabase
                    .from('users')
                    .select('id, username, avatar_url, birth_date')
                    .in('id', teenIds);

                setLinkedTeens(teens || []);
            }

            // Fetch guardians for teens
            const { data: guardianLinks } = await supabase
                .from('guardian_relationships')
                .select(`
                    *,
                    guardian:guardian_id (id, username, avatar_url)
                `)
                .eq('teen_id', user.id)
                .eq('status', 'active');

            if (guardianLinks) {
                setMyGuardians(guardianLinks.map(g => g.guardian));
            }

            setError(null);
        } catch (err) {
            console.error('Error fetching teen care status:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchUserStatus();
    }, [fetchUserStatus]);

    // Generate invitation code
    const generateInvitationCode = useCallback(async (teenId = user?.id) => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        const { data, error } = await supabase
            .from('guardian_relationships')
            .insert({
                teen_id: teenId,
                invitation_code: code,
                invitation_expires_at: expiresAt.toISOString(),
                status: 'pending',
                invited_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return { code, expiresAt, id: data.id };
    }, [user?.id]);

    // Accept guardian invitation
    const acceptInvitation = useCallback(async (code) => {
        // Find the invitation
        const { data: invitation, error: findError } = await supabase
            .from('guardian_relationships')
            .select('*')
            .eq('invitation_code', code)
            .eq('status', 'pending')
            .single();

        if (findError || !invitation) {
            throw new Error('Invalid or expired invitation code');
        }

        // Check if expired
        if (new Date(invitation.invitation_expires_at) < new Date()) {
            throw new Error('Invitation code has expired');
        }

        // Accept the invitation
        const { error: updateError } = await supabase
            .from('guardian_relationships')
            .update({
                guardian_id: user?.id,
                status: 'active',
                approved_at: new Date().toISOString()
            })
            .eq('id', invitation.id);

        if (updateError) throw updateError;

        // Mark user as guardian
        await supabase
            .from('users')
            .update({ is_guardian: true })
            .eq('id', user?.id);

        await fetchUserStatus();
        return invitation;
    }, [user?.id, fetchUserStatus]);

    // Send invitation to teen
    const inviteTeen = useCallback(async (teenEmail) => {
        // Find teen by email
        const { data: teen, error: findError } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('email', teenEmail)
            .single();

        if (findError || !teen) {
            throw new Error('User not found with that email');
        }

        // Create guardian relationship
        const { data, error } = await supabase
            .from('guardian_relationships')
            .insert({
                guardian_id: user?.id,
                teen_id: teen.id,
                relationship_type: 'parent',
                status: 'pending',
                invited_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;

        // TODO: Send notification to teen

        return { teen, invitation: data };
    }, [user?.id]);

    // Remove guardian link
    const removeGuardian = useCallback(async (guardianId) => {
        const { error } = await supabase
            .from('guardian_relationships')
            .update({
                status: 'revoked',
                revoked_at: new Date().toISOString(),
                revoked_by: user?.id
            })
            .eq('guardian_id', guardianId)
            .eq('teen_id', user?.id);

        if (error) throw error;
        await fetchUserStatus();
    }, [user?.id, fetchUserStatus]);

    // Update safety settings
    const updateSafetySettings = useCallback(async (settings) => {
        const { error } = await supabase
            .from('teen_safety_settings')
            .upsert({
                teen_id: user?.id,
                ...settings,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        setSafetySettings(prev => ({ ...prev, ...settings }));
    }, [user?.id]);

    // Fetch alerts for guardian
    const fetchAlerts = useCallback(async (teenId = null) => {
        let query = supabase
            .from('safety_alerts')
            .select(`
                *,
                teen:teen_id (id, username, avatar_url)
            `)
            .eq('guardian_id', user?.id)
            .order('created_at', { ascending: false });

        if (teenId) {
            query = query.eq('teen_id', teenId);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;

        setGuardianAlerts(data || []);
        return data;
    }, [user?.id]);

    // Mark alert as reviewed
    const reviewAlert = useCallback(async (alertId, status, notes = '') => {
        const { error } = await supabase
            .from('safety_alerts')
            .update({
                status,
                resolution_notes: notes,
                resolved_at: status === 'resolved' ? new Date().toISOString() : null,
                resolved_by: user?.id
            })
            .eq('id', alertId);

        if (error) throw error;
        await fetchAlerts();
    }, [user?.id, fetchAlerts]);

    // Create safety alert
    const createAlert = useCallback(async (alert) => {
        // Get all guardians for this teen
        const { data: guardians } = await supabase
            .from('guardian_relationships')
            .select('guardian_id')
            .eq('teen_id', alert.teen_id)
            .eq('status', 'active');

        // Create alert for each guardian
        const alerts = guardians?.map(g => ({
            ...alert,
            guardian_id: g.guardian_id,
            created_at: new Date().toISOString()
        })) || [];

        if (alerts.length > 0) {
            const { error } = await supabase
                .from('safety_alerts')
                .insert(alerts);

            if (error) throw error;
        }

        return alerts;
    }, []);

    // Panic button activation
    const activatePanicButton = useCallback(async (message = '', location = null) => {
        const { data, error } = await supabase
            .from('panic_activations')
            .insert({
                teen_id: user?.id,
                message,
                latitude: location?.latitude,
                longitude: location?.longitude,
                location_accuracy: location?.accuracy,
                guardians_notified: myGuardians.map(g => g.id)
            })
            .select()
            .single();

        if (error) throw error;

        // Create critical alert for all guardians
        await createAlert({
            teen_id: user?.id,
            alert_type: 'panic_button',
            severity: 'critical',
            title: 'Panic Button Activated',
            description: message || 'Your teen has activated the panic button and may need help.',
            status: 'new'
        });

        return data;
    }, [user?.id, myGuardians, createAlert]);

    // Check screen time
    const checkScreenTime = useCallback(async () => {
        if (!isTeen) return null;

        const { data, error } = await supabase
            .rpc('check_screen_time_limit', { user_id: user?.id });

        if (error) {
            console.error('Error checking screen time:', error);
            return null;
        }

        setScreenTimeStatus(data);
        return data;
    }, [user?.id, isTeen]);

    // Log screen time usage
    const logScreenTime = useCallback(async (minutes, category = 'general') => {
        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('screen_time_usage')
            .upsert({
                teen_id: user?.id,
                date: today,
                total_minutes: minutes,
                [`${category}_minutes`]: minutes
            }, {
                onConflict: 'teen_id,date'
            });

        if (error) console.error('Error logging screen time:', error);
    }, [user?.id]);

    // Fetch trusted contacts
    const fetchTrustedContacts = useCallback(async () => {
        const { data, error } = await supabase
            .from('trusted_contacts')
            .select(`
                *,
                contact:contact_user_id (id, username, avatar_url)
            `)
            .eq('teen_id', user?.id);

        if (error) throw error;
        setTrustedContacts(data || []);
        return data;
    }, [user?.id]);

    // Add trusted contact
    const addTrustedContact = useCallback(async (contact) => {
        const { data, error } = await supabase
            .from('trusted_contacts')
            .insert({
                teen_id: user?.id,
                ...contact
            })
            .select()
            .single();

        if (error) throw error;
        await fetchTrustedContacts();
        return data;
    }, [user?.id, fetchTrustedContacts]);

    const value = {
        // Status
        isGuardian,
        isTeen,
        isCoppaMode,
        userAge,
        loading,
        error,

        // Guardian features
        linkedTeens,
        guardianAlerts,
        pendingInvitations,
        fetchAlerts,
        reviewAlert,
        inviteTeen,
        acceptInvitation,
        generateInvitationCode,

        // Teen features
        myGuardians,
        safetySettings,
        screenTimeStatus,
        trustedContacts,
        updateSafetySettings,
        removeGuardian,
        activatePanicButton,
        checkScreenTime,
        logScreenTime,
        fetchTrustedContacts,
        addTrustedContact,

        // Shared
        createAlert,
        refreshStatus: fetchUserStatus
    };

    return (
        <TeenCareContext.Provider value={value}>
            {children}
        </TeenCareContext.Provider>
    );
};

export default TeenCareContext;
