import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook for guardian dashboard functionality
 */
export const useGuardianDashboard = (teenId = null) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dashboard data
    const [activityOverview, setActivityOverview] = useState(null);
    const [screenTimeData, setScreenTimeData] = useState(null);
    const [safetyAlerts, setSafetyAlerts] = useState([]);
    const [flaggedContent, setFlaggedContent] = useState([]);
    const [contactActivity, setContactActivity] = useState(null);
    const [weeklyReport, setWeeklyReport] = useState(null);

    // Fetch activity overview
    const fetchActivityOverview = useCallback(async (targetTeenId) => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data: activities, error } = await supabase
            .from('teen_activity_logs')
            .select('*')
            .eq('teen_id', targetTeenId)
            .gte('created_at', weekAgo.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process activities
        const overview = {
            postsCreated: activities?.filter(a => a.activity_type === 'post_created').length || 0,
            newFollowers: activities?.filter(a => a.activity_type === 'new_follower').length || 0,
            newFollowing: activities?.filter(a => a.activity_type === 'followed_user').length || 0,
            unfollowed: activities?.filter(a => a.activity_type === 'unfollowed_user').length || 0,
            messagesCount: activities?.filter(a => a.activity_type === 'message_sent').length || 0,
            blockedUsers: activities?.filter(a => a.activity_type === 'blocked_user').length || 0,
            reportedContent: activities?.filter(a => a.activity_type === 'reported_content').length || 0,
            recentActivity: activities?.slice(0, 20) || []
        };

        setActivityOverview(overview);
        return overview;
    }, []);

    // Fetch screen time data
    const fetchScreenTimeData = useCallback(async (targetTeenId, days = 7) => {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('screen_time_usage')
            .select('*')
            .eq('teen_id', targetTeenId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;

        // Get limits
        const { data: limits } = await supabase
            .from('screen_time_limits')
            .select('*')
            .eq('teen_id', targetTeenId)
            .single();

        const screenTime = {
            daily: data || [],
            totalMinutes: data?.reduce((sum, d) => sum + (d.total_minutes || 0), 0) || 0,
            avgDailyMinutes: data?.length > 0
                ? Math.round(data.reduce((sum, d) => sum + (d.total_minutes || 0), 0) / data.length)
                : 0,
            limits: limits || null,
            exceededDays: data?.filter(d =>
                limits && d.total_minutes > limits.daily_limit_minutes
            ).length || 0,
            breakdown: {
                feed: data?.reduce((sum, d) => sum + (d.feed_minutes || 0), 0) || 0,
                create: data?.reduce((sum, d) => sum + (d.create_minutes || 0), 0) || 0,
                messages: data?.reduce((sum, d) => sum + (d.messages_minutes || 0), 0) || 0,
                explore: data?.reduce((sum, d) => sum + (d.explore_minutes || 0), 0) || 0
            }
        };

        setScreenTimeData(screenTime);
        return screenTime;
    }, []);

    // Fetch safety alerts
    const fetchSafetyAlerts = useCallback(async (targetTeenId, limit = 50) => {
        const { data, error } = await supabase
            .from('safety_alerts')
            .select(`
                *,
                related_user:related_user_id (id, username, avatar_url)
            `)
            .eq('teen_id', targetTeenId)
            .eq('guardian_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        setSafetyAlerts(data || []);
        return data;
    }, [user?.id]);

    // Fetch flagged content
    const fetchFlaggedContent = useCallback(async (targetTeenId) => {
        const { data, error } = await supabase
            .from('guardian_flagged_content')
            .select('*')
            .eq('teen_id', targetTeenId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        setFlaggedContent(data || []);
        return data;
    }, []);

    // Fetch contact activity
    const fetchContactActivity = useCallback(async (targetTeenId) => {
        // Get recent follows
        const { data: follows } = await supabase
            .from('teen_activity_logs')
            .select('*')
            .eq('teen_id', targetTeenId)
            .in('activity_type', ['followed_user', 'new_follower'])
            .order('created_at', { ascending: false })
            .limit(20);

        // Get blocked accounts
        const { data: blocked } = await supabase
            .from('guardian_blocked_accounts')
            .select(`
                *,
                blocked_user:blocked_user_id (id, username, avatar_url)
            `)
            .eq('teen_id', targetTeenId);

        const activity = {
            recentFollows: follows || [],
            blockedAccounts: blocked || []
        };

        setContactActivity(activity);
        return activity;
    }, []);

    // Fetch weekly report
    const fetchWeeklyReport = useCallback(async (targetTeenId) => {
        const { data, error } = await supabase
            .from('weekly_safety_reports')
            .select('*')
            .eq('teen_id', targetTeenId)
            .eq('guardian_id', user?.id)
            .order('week_start', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        setWeeklyReport(data || null);
        return data;
    }, [user?.id]);

    // Load all dashboard data
    const loadDashboard = useCallback(async (targetTeenId) => {
        if (!targetTeenId || !user?.id) return;

        try {
            setLoading(true);
            setError(null);

            await Promise.all([
                fetchActivityOverview(targetTeenId),
                fetchScreenTimeData(targetTeenId),
                fetchSafetyAlerts(targetTeenId),
                fetchFlaggedContent(targetTeenId),
                fetchContactActivity(targetTeenId),
                fetchWeeklyReport(targetTeenId)
            ]);
        } catch (err) {
            console.error('Error loading guardian dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.id, fetchActivityOverview, fetchScreenTimeData, fetchSafetyAlerts,
        fetchFlaggedContent, fetchContactActivity, fetchWeeklyReport]);

    // Update screen time limits
    const updateScreenTimeLimits = useCallback(async (targetTeenId, limits) => {
        const { error } = await supabase
            .from('screen_time_limits')
            .upsert({
                teen_id: targetTeenId,
                ...limits,
                created_by: user?.id,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        await fetchScreenTimeData(targetTeenId);
    }, [user?.id, fetchScreenTimeData]);

    // Block a user for teen
    const blockUserForTeen = useCallback(async (targetTeenId, blockedUserId, reason = '') => {
        const { error } = await supabase
            .from('guardian_blocked_accounts')
            .insert({
                teen_id: targetTeenId,
                blocked_user_id: blockedUserId,
                blocked_by: user?.id,
                reason
            });

        if (error) throw error;
        await fetchContactActivity(targetTeenId);
    }, [user?.id, fetchContactActivity]);

    // Resolve alert
    const resolveAlert = useCallback(async (alertId, status, notes = '') => {
        const { error } = await supabase
            .from('safety_alerts')
            .update({
                status,
                resolution_notes: notes,
                resolved_at: new Date().toISOString(),
                resolved_by: user?.id
            })
            .eq('id', alertId);

        if (error) throw error;

        if (teenId) {
            await fetchSafetyAlerts(teenId);
        }
    }, [user?.id, teenId, fetchSafetyAlerts]);

    // Initial load
    useEffect(() => {
        if (teenId) {
            loadDashboard(teenId);
        }
    }, [teenId, loadDashboard]);

    return {
        loading,
        error,
        activityOverview,
        screenTimeData,
        safetyAlerts,
        flaggedContent,
        contactActivity,
        weeklyReport,
        loadDashboard,
        updateScreenTimeLimits,
        blockUserForTeen,
        resolveAlert,
        refreshAlerts: () => teenId && fetchSafetyAlerts(teenId)
    };
};

export default useGuardianDashboard;
