import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateTrustScore } from '../utils/trustScoreCalculator';

export const useTrustScore = (user) => {
    const [trustData, setTrustData] = useState({
        score: 0,
        tier: null,
        breakdown: {},
        loading: true
    });

    useEffect(() => {
        if (!user) {
            setTrustData(prev => ({ ...prev, loading: false }));
            return;
        }

        const fetchTrustScore = async () => {
            try {
                // Fetch additional metrics from Supabase if needed (e.g., reports, interactions)
                // For now, we'll mock the metrics or fetch from a 'user_trust_metrics' table
                let safeMetrics = { interactions: 0, reports_count: 0 };

                try {
                    const { data: metrics, error } = await supabase
                        .from('user_trust_metrics')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (!error && metrics) {
                        safeMetrics = metrics;
                    }
                } catch (err) {
                    // Ignore error, use defaults
                    console.warn('Could not fetch trust metrics, using defaults.');
                }

                const { score, tier, breakdown } = calculateTrustScore(user, safeMetrics);

                setTrustData({
                    score,
                    tier,
                    breakdown,
                    loading: false
                });
            } catch (error) {
                console.error('Error calculating trust score:', error);
                setTrustData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchTrustScore();

        // Real-time subscription to metrics updates
        const subscription = supabase
            .channel('trust_score_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_trust_metrics',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                // Re-calculate on update
                fetchTrustScore();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user]);

    return trustData;
};
