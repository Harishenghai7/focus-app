/**
 * useSafetyAlerts Hook
 * Manage AI-powered safety alerts for guardians
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useSafetyAlerts = (teenId = null) => {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch safety alerts
    const fetchAlerts = useCallback(async () => {
        if (!user) {
            console.log('⚠️ useSafetyAlerts: No user found');
            setAlerts([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('🔍 Fetching safety alerts for:', { userId: user.id, teenId });

            let query = supabase
                .from('safety_alerts')
                .select(`
          *,
          teen:teen_id (
            id,
            username,
            full_name,
            avatar_url
          ),
          related_user:related_user_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
                .order('created_at', { ascending: false });

            // If teenId provided, filter by that teen (for guardian viewing specific teen)
            if (teenId) {
                query = query.eq('teen_id', teenId);
            } else {
                // Otherwise get all alerts where user is the parent
                query = query.eq('parent_id', user.id);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('❌ Error fetching safety alerts:', fetchError);
                throw fetchError;
            }

            console.log('✅ Safety alerts fetched:', data?.length || 0);
            setAlerts(data || []);

            // Count unread (status = 'new' or 'notified')
            const unread = data?.filter(a => ['new', 'notified'].includes(a.status)).length || 0;
            setUnreadCount(unread);

        } catch (err) {
            console.error('❌ Error fetching safety alerts:', err);
            setError(err.message);
            // Set empty arrays to prevent undefined errors
            setAlerts([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    }, [user, teenId]);

    // Mark alert as reviewed
    const markAsReviewed = async (alertId) => {
        if (!user) return;

        try {
            const { error: updateError } = await supabase
                .from('safety_alerts')
                .update({
                    status: 'reviewed',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id
                })
                .eq('id', alertId);

            if (updateError) throw updateError;

            await fetchAlerts();
        } catch (err) {
            console.error('Error marking alert as reviewed:', err);
            throw err;
        }
    };

    // Mark alert as resolved
    const markAsResolved = async (alertId, resolutionNotes = '') => {
        if (!user) return;

        try {
            const { error: updateError } = await supabase
                .from('safety_alerts')
                .update({
                    status: 'resolved',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id,
                    resolution_notes: resolutionNotes
                })
                .eq('id', alertId);

            if (updateError) throw updateError;

            await fetchAlerts();
        } catch (err) {
            console.error('Error resolving alert:', err);
            throw err;
        }
    };

    // Mark alert as false positive
    const markAsFalsePositive = async (alertId) => {
        if (!user) return;

        try {
            const { error: updateError } = await supabase
                .from('safety_alerts')
                .update({
                    status: 'false_positive',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: user.id
                })
                .eq('id', alertId);

            if (updateError) throw updateError;

            await fetchAlerts();
        } catch (err) {
            console.error('Error marking as false positive:', err);
            throw err;
        }
    };

    // Get alerts by severity
    const getAlertsBySeverity = useCallback((severity) => {
        return alerts.filter(a => a.severity === severity);
    }, [alerts]);

    // Get alerts by type
    const getAlertsByType = useCallback((type) => {
        return alerts.filter(a => a.alert_type === type);
    }, [alerts]);

    // Get critical unresolved alerts
    const getCriticalAlerts = useCallback(() => {
        return alerts.filter(a =>
            a.severity === 'critical' &&
            !['resolved', 'false_positive'].includes(a.status)
        );
    }, [alerts]);

    // Subscribe to realtime changes
    useEffect(() => {
        if (!user) return;

        fetchAlerts();

        // Realtime subscription
        const subscription = supabase
            .channel('safety_alerts_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'safety_alerts',
                    filter: teenId ? `teen_id=eq.${teenId}` : `parent_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Safety alert change:', payload);
                    fetchAlerts();
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, teenId, fetchAlerts]);

    return {
        alerts,
        unreadCount,
        loading,
        error,
        markAsReviewed,
        markAsResolved,
        markAsFalsePositive,
        getAlertsBySeverity,
        getAlertsByType,
        getCriticalAlerts,
        refetch: fetchAlerts
    };
};
