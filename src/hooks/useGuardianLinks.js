import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useGuardianLinks = (guardianId) => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        if (!guardianId) {
            setLinks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('guardian_links')
                .select('id, guardian_id, ward_id, status, linked_at, expires_at')
                .eq('guardian_id', guardianId)
                .eq('status', 'linked')
                .order('linked_at', { ascending: false });

            if (fetchError) throw fetchError;

            const wardIds = (data || []).map((l) => l.ward_id).filter(Boolean);
            let wardsById = {};
            if (wardIds.length > 0) {
                const { data: wardProfiles, error: wardError } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, avatar_url')
                    .in('id', wardIds);

                if (!wardError) {
                    wardsById = (wardProfiles || []).reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
            }

            setLinks((data || []).map((l) => ({ ...l, ward: wardsById[l.ward_id] || null })));
            setError(null);
        } catch (e) {
            setLinks([]);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [guardianId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { links, loading, error, refresh };
};

export default useGuardianLinks;
