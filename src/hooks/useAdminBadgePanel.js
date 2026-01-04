import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
    fetchPendingApplications,
    updateApplicationStatus,
    awardBadge,
    revokeBadge,
    fetchFullAuditLog,
    subscribeToBadgeApplications
} from '../utils/supabaseBadges';
import {
    notifyApplicationApproved,
    notifyApplicationRejected,
    sendBadgeEmail
} from '../utils/badgeNotification';

/**
 * useAdminBadgePanel Hook
 * Admin operations for badge management
 */
export const useAdminBadgePanel = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Check if user is admin
    const isAdmin = user?.user_metadata?.role === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                const [apps, logs] = await Promise.all([
                    fetchPendingApplications(),
                    fetchFullAuditLog(100)
                ]);
                setApplications(apps);
                setAuditLog(logs);
            } catch (error) {
                console.error('Error loading admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Subscribe to application updates
        const subscription = subscribeToBadgeApplications(() => {
            loadData();
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [isAdmin]);

    /**
     * Approve badge application
     */
    const approveApplication = async (applicationId, response = '') => {
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        try {
            setProcessing(true);
            const result = await updateApplicationStatus(
                applicationId,
                'approved',
                response,
                user.id
            );

            if (result.success) {
                // Find the application to get badge name and user
                const app = applications.find(a => a.id === applicationId);
                if (app) {
                    notifyApplicationApproved(app.badge.name);
                    await sendBadgeEmail(app.user_id, 'approved', app.badge.name, { response });
                }

                // Reload applications
                const apps = await fetchPendingApplications();
                setApplications(apps);
            }

            return result;
        } catch (error) {
            console.error('Error approving application:', error);
            return { success: false, error: error.message };
        } finally {
            setProcessing(false);
        }
    };

    /**
     * Reject badge application
     */
    const rejectApplication = async (applicationId, reason = '') => {
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        try {
            setProcessing(true);
            const result = await updateApplicationStatus(
                applicationId,
                'rejected',
                reason,
                user.id
            );

            if (result.success) {
                const app = applications.find(a => a.id === applicationId);
                if (app) {
                    notifyApplicationRejected(app.badge.name, reason);
                    await sendBadgeEmail(app.user_id, 'rejected', app.badge.name, { reason });
                }

                const apps = await fetchPendingApplications();
                setApplications(apps);
            }

            return result;
        } catch (error) {
            console.error('Error rejecting application:', error);
            return { success: false, error: error.message };
        } finally {
            setProcessing(false);
        }
    };

    /**
     * Manually award badge to user
     */
    const manuallyAwardBadge = async (userId, badgeName, notes = '') => {
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        try {
            setProcessing(true);
            const result = await awardBadge(userId, badgeName, notes, user.id);

            if (result.success) {
                await sendBadgeEmail(userId, 'awarded', badgeName, { notes });
            }

            return result;
        } catch (error) {
            console.error('Error awarding badge:', error);
            return { success: false, error: error.message };
        } finally {
            setProcessing(false);
        }
    };

    /**
     * Revoke badge from user
     */
    const revokeBadgeFromUser = async (userId, badgeName, reason = '') => {
        if (!isAdmin) return { success: false, error: 'Unauthorized' };

        try {
            setProcessing(true);
            const result = await revokeBadge(userId, badgeName, reason, user.id);

            if (result.success) {
                await sendBadgeEmail(userId, 'revoked', badgeName, { reason });
            }

            return result;
        } catch (error) {
            console.error('Error revoking badge:', error);
            return { success: false, error: error.message };
        } finally {
            setProcessing(false);
        }
    };

    /**
     * Refresh audit log
     */
    const refreshAuditLog = async () => {
        const logs = await fetchFullAuditLog(100);
        setAuditLog(logs);
    };

    return {
        isAdmin,
        applications,
        auditLog,
        loading,
        processing,
        approveApplication,
        rejectApplication,
        manuallyAwardBadge,
        revokeBadgeFromUser,
        refreshAuditLog
    };
};
