import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSuspiciousActivity = () => {
    const [alerts, setAlerts] = useState([]);

    const reportActivity = useCallback(async (userId, type, details) => {
        const alert = {
            type,
            details,
            timestamp: new Date().toISOString()
        };

        setAlerts(prev => [alert, ...prev]);

        if (userId) {
            try {
                await supabase.from('security_events').insert({
                    user_id: userId,
                    event_type: type,
                    details: details,
                    severity: 'medium' // Default severity
                });
            } catch (error) {
                console.error('Error reporting suspicious activity:', error);
            }
        }
    }, []);

    return { reportActivity, alerts };
};
