// useAdminReports hook - For admin report queue management
import { useState, useEffect, useCallback } from 'react';
import { getReportQueue, updateReportStatus } from '../utils/supabaseReports';
import { sendAdminActionNotification } from '../utils/emailNotifications';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export const useAdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: 'pending', limit: 50, offset: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getReportQueue(filters);
            if (result.success) {
                setReports(result.data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('admin-reports')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reports'
                },
                () => {
                    fetchReports();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReports]);

    /**
     * Take action on a report
     * @param {string} reportId - Report ID
     * @param {Object} actionData - { admin_action, admin_notes, admin_id }
     * @returns {Promise<void>}
     */
    const takeAction = useCallback(async (reportId, actionData) => {
        setIsProcessing(true);
        try {
            const result = await updateReportStatus(reportId, {
                status: actionData.admin_action === 'dismiss' ? 'dismissed' : 'resolved',
                admin_action: actionData.admin_action,
                admin_notes: actionData.admin_notes,
                admin_id: actionData.admin_id
            });

            if (result.success) {
                toast.success('Action completed successfully');

                // Send notification to reported user if action taken
                if (result.data.reported_user && actionData.admin_action !== 'dismiss') {
                    try {
                        await sendAdminActionNotification(
                            result.data,
                            result.data.reported_user,
                            actionData.admin_action,
                            actionData.admin_notes
                        );
                    } catch (emailError) {
                        console.warn('Failed to send action notification:', emailError);
                    }
                }

                fetchReports(); // Refresh list
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error taking action:', error);
            toast.error('Failed to process action');
        } finally {
            setIsProcessing(false);
        }
    }, [fetchReports]);

    return {
        reports,
        loading,
        filters,
        setFilters,
        takeAction,
        isProcessing,
        refreshReports: fetchReports
    };
};

export default useAdminReports;
