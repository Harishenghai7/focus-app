import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useViewTracking = (boltzId, isVisible) => {
    const viewStartTime = useRef(null);
    const viewTracked = useRef(false);

    useEffect(() => {
        if (isVisible && !viewTracked.current) {
            viewStartTime.current = Date.now();

            const timer = setTimeout(async () => {
                // Track view after 3 seconds
                if (viewStartTime.current && Date.now() - viewStartTime.current >= 3000) {
                    try {
                        const { data: { user } } = await supabase.auth.getUser();

                        await supabase.from('boltz_views').insert({
                            boltz_id: boltzId,
                            user_id: user?.id || null,
                            viewed_at: new Date().toISOString()
                        });

                        viewTracked.current = true;
                    } catch (error) {
                        console.error('View tracking error:', error);
                    }
                }
            }, 3000);

            return () => {
                clearTimeout(timer);
                viewStartTime.current = null;
            };
        } else if (!isVisible) {
            viewStartTime.current = null;
        }
    }, [boltzId, isVisible]);
};
