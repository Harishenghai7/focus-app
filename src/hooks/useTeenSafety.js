import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import getTrustShieldState from '../utils/trustShieldPolicy';

const isWithinNightLockWindow = (now, startTime, endTime) => {
    if (!startTime || !endTime) return false;

    const [sh, sm] = String(startTime).split(':').map((v) => parseInt(v, 10));
    const [eh, em] = String(endTime).split(':').map((v) => parseInt(v, 10));

    if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return false;

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes === endMinutes) return false;

    if (startMinutes < endMinutes) {
        return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }

    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

export const useTeenSafety = () => {
    const { user, profile } = useAuth();
    const trust = useMemo(() => getTrustShieldState(profile), [profile]);

    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (!user?.id) {
                if (isMounted) {
                    setSettings(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('teen_safety_profiles')
                    .select('*')
                    .eq('ward_id', user.id)
                    .maybeSingle();

                if (error) throw error;

                if (isMounted) {
                    setSettings(data || null);
                    setLoading(false);
                }
            } catch (e) {
                if (isMounted) {
                    setSettings(null);
                    setLoading(false);
                }
            }
        };

        setLoading(true);
        load();

        return () => {
            isMounted = false;
        };
    }, [user?.id]);

    const isTeen = Boolean(trust?.age != null && trust.age < 18);

    const nightLockEnabled = Boolean(settings?.night_lock_enabled ?? isTeen);
    const start = settings?.night_lock_start || '22:00';
    const end = settings?.night_lock_end || '06:00';

    const nightLockActive = useMemo(() => {
        if (!isTeen) return false;
        if (!nightLockEnabled) return false;
        return isWithinNightLockWindow(new Date(), start, end);
    }, [isTeen, nightLockEnabled, start, end]);

    return {
        loading,
        isTeen,
        trust,
        settings,
        nightLockActive,
        nightLockEnabled,
    };
};

export default useTeenSafety;
