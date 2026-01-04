// useReportHistory hook - For fetching user's report history
import { useState, useEffect, useCallback } from 'react';
import { getReportsByUser } from '../utils/supabaseReports';
import { useAuth } from './useAuth';

export const useReportHistory = (filters = {}) => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        if (!user) {
            setReports([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getReportsByUser(user.id, filters);

            if (result.success) {
                setReports(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, filters]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const refreshReports = useCallback(() => {
        fetchReports();
    }, [fetchReports]);

    return {
        reports,
        loading,
        error,
        refreshReports
    };
};

export default useReportHistory;
