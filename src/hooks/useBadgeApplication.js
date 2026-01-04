import { useState } from 'react';
import { useAuth } from './useAuth';
import { submitBadgeApplication, fetchUserApplications } from '../utils/supabaseBadges';
import { notifyApplicationSubmitted } from '../utils/badgeNotification';
import { supabase } from '../lib/supabase';

/**
 * useBadgeApplication Hook
 * Handles badge application submission and status tracking
 */
export const useBadgeApplication = () => {
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    /**
     * Upload file to Supabase Storage
     */
    const uploadFile = async (file, userId, badgeName) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${badgeName}/${Date.now()}.${fileExt}`;

            const { data, error } = await supabase.storage
                .from('badge-applications')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('badge-applications')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    /**
     * Submit badge application
     */
    const submitApplication = async (badgeName, formData) => {
        if (!user) {
            return { success: false, error: 'User not authenticated' };
        }

        try {
            setSubmitting(true);

            // Handle file uploads if present
            const processedData = { ...formData };
            for (const [key, value] of Object.entries(formData)) {
                if (value instanceof File) {
                    const url = await uploadFile(value, user.id, badgeName);
                    processedData[key] = url;
                }
            }

            const result = await submitBadgeApplication(user.id, badgeName, processedData);

            if (result.success) {
                notifyApplicationSubmitted(badgeName);
            }

            return result;
        } catch (error) {
            console.error('Error submitting application:', error);
            return { success: false, error: error.message };
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Fetch user's applications
     */
    const getApplications = async () => {
        if (!user) return [];
        return await fetchUserApplications(user.id);
    };

    /**
     * Check if user has pending application for badge
     */
    const hasPendingApplication = async (badgeName) => {
        const applications = await getApplications();
        return applications.some(
            app => app.badge?.name === badgeName &&
                ['pending', 'under_review'].includes(app.status)
        );
    };

    return {
        submitApplication,
        getApplications,
        hasPendingApplication,
        submitting,
        uploading
    };
};
