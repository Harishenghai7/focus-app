// useReport hook - For submitting and managing reports
import { useState, useCallback } from 'react';
import { submitReport, scanAndModerateContent } from '../utils/supabaseReports';
import { validateReport, sanitizeReportData } from '../utils/reportValidator';
import { sendReportConfirmation } from '../utils/emailNotifications';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const useReport = () => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Submit a report
     * @param {Object} reportData - Report data
     * @returns {Promise<Object>} - Result
     */
    const submit = useCallback(async (reportData) => {
        if (!user) {
            setError('You must be logged in to submit a report');
            return { success: false, error: 'Not authenticated' };
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Add reporter ID
            const fullReportData = {
                ...reportData,
                reporter_id: user.id
            };

            // Validate report data
            const validation = validateReport(fullReportData);
            if (!validation.valid) {
                const errorMsg = validation.errors.join(', ');
                setError(errorMsg);
                toast.error(errorMsg);
                return { success: false, error: errorMsg };
            }

            // Sanitize data
            const sanitizedData = sanitizeReportData(fullReportData);

            // Submit report
            const result = await submitReport(sanitizedData);

            if (!result.success) {
                setError(result.error);
                toast.error('Failed to submit report');
                return result;
            }

            // Send confirmation email
            try {
                await sendReportConfirmation(result.data, user);
            } catch (emailError) {
                console.warn('Failed to send confirmation email:', emailError);
                // Don't fail the whole operation if email fails
            }

            toast.success('Report submitted successfully. Thank you for helping keep Focus safe!');
            return result;
        } catch (err) {
            const errorMsg = err.message || 'Failed to submit report';
            setError(errorMsg);
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setIsSubmitting(false);
        }
    }, [user]);

    /**
     * Report content with auto-moderation check
     * @param {Object} content - Content to report and scan
     * @param {Object} reportData - Report details
     * @returns {Promise<Object>} - Result
     */
    const reportAndScan = useCallback(async (content, reportData) => {
        try {
            // First, scan the content
            const scanResult = await scanAndModerateContent(content);

            if (!scanResult.success) {
                console.warn('Content scanning failed:', scanResult.error);
            }

            // Then submit the report
            return await submit(reportData);
        } catch (err) {
            console.error('Error in reportAndScan:', err);
            return { success: false, error: err.message };
        }
    }, [submit]);

    return {
        submit,
        reportAndScan,
        isSubmitting,
        error
    };
};

export default useReport;
