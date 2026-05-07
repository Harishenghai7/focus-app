import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Silent logger - don't spam console with expected 404s/403s
const isSilentError = (err) => /does not exist|Could not find the table|42P01|PGRST205|403|Forbidden|violates row|RLS|permission denied/i.test(
  `${err?.message || ''}${err?.code || ''}${err?.status || ''}`
);

export const useViewTracking = (boltzId, isVisible) => {
    const viewStartTime = useRef(null);
    const viewTracked = useRef(false);
    const trackAttempted = useRef(false);

    useEffect(() => {
        if (isVisible && !viewTracked.current && !trackAttempted.current) {
            viewStartTime.current = Date.now();

            const timer = setTimeout(async () => {
                // Track view after 3 seconds
                if (viewStartTime.current && Date.now() - viewStartTime.current >= 3000) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();

                        // Silently fail if boltz_views table doesn't exist
                        // Wrap in try-catch to catch network-level failures
                        try {
                            const { error } = await supabase.from('boltz_views').insert({
                                boltz_id: boltzId,
                                user_id: user?.id || null,
                                viewed_at: new Date().toISOString()
                            });

                            if (error && !isSilentError(error)) {
                                // Only log real errors, not missing table/RLS issues
                                console.warn('View tracking error:', error.message);
                            }
                        } catch (networkErr) {
                            // Silent fail - network or CORS errors
                        }

                        viewTracked.current = true;
                        trackAttempted.current = true;
                    } catch (error) {
                        // Silent fail - view tracking is non-critical
                    }
                }
            }, 3000)

            return () => {
                clearTimeout(timer);
                viewStartTime.current = null;
            };
        } else if (!isVisible) {
            viewStartTime.current = null;
        }
    }, [boltzId, isVisible]);
};
