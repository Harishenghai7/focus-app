import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import getTrustShieldState from '../../utils/trustShieldPolicy';
import useGuardianLinks from '../../hooks/useGuardianLinks';
import styles from './GuardianHub.module.css';

const todayISO = () => new Date().toISOString().slice(0, 10);

const uniqueRecentHandles = (activities, limit = 8) => {
    const seen = new Set();
    const handles = [];

    for (const a of activities || []) {
        const d = a?.details || {};
        const handle = d.username || d.recipient_username || d.followed_username || d.unfollowed_username;
        if (!handle) continue;
        if (seen.has(handle)) continue;
        seen.add(handle);
        handles.push(handle);
        if (handles.length >= limit) break;
    }

    return handles;
};

const GuardianHub = () => {
    const { user, profile } = useAuth();
    const trust = useMemo(() => getTrustShieldState(profile), [profile]);
    const { links, loading: linksLoading } = useGuardianLinks(user?.id);

    const [selectedWardId, setSelectedWardId] = useState('');
    const [safety, setSafety] = useState(null);
    const [focusMinutesToday, setFocusMinutesToday] = useState(0);
    const [interactionPulse, setInteractionPulse] = useState([]);
    const [busy, setBusy] = useState(false);

    const isGuardianEligible = Boolean(trust?.status === 'VERIFIED' && links?.length > 0);

    useEffect(() => {
        if (!selectedWardId && links?.[0]?.ward_id) {
            setSelectedWardId(links[0].ward_id);
        }
    }, [links, selectedWardId]);

    useEffect(() => {
        const loadWardData = async () => {
            if (!selectedWardId) return;

            try {
                const [{ data: safetyRow }, { data: usageRows }, { data: activities }] = await Promise.all([
                    supabase
                        .from('teen_safety_profiles')
                        .select('*')
                        .eq('ward_id', selectedWardId)
                        .maybeSingle(),
                    supabase
                        .from('screen_time_usage')
                        .select('total_minutes')
                        .eq('teen_id', selectedWardId)
                        .eq('date', todayISO())
                        .limit(1),
                    supabase
                        .from('teen_activity_logs')
                        .select('details, created_at')
                        .eq('teen_id', selectedWardId)
                        .order('created_at', { ascending: false })
                        .limit(50),
                ]);

                setSafety(safetyRow || null);
                setFocusMinutesToday(usageRows?.[0]?.total_minutes || 0);
                setInteractionPulse(uniqueRecentHandles(activities, 10));
            } catch (_) {
                setSafety(null);
                setFocusMinutesToday(0);
                setInteractionPulse([]);
            }
        };

        loadWardData();
    }, [selectedWardId]);

    const selectedWard = useMemo(() => {
        return links?.find((l) => l.ward_id === selectedWardId)?.ward || null;
    }, [links, selectedWardId]);

    const setToggle = async (field, value) => {
        if (!selectedWardId) return;

        setBusy(true);
        try {
            const { data, error } = await supabase
                .from('teen_safety_profiles')
                .upsert({ ward_id: selectedWardId, [field]: value, updated_at: new Date().toISOString() })
                .select('*')
                .single();

            if (error) throw error;
            setSafety(data);
        } catch (_) {
        } finally {
            setBusy(false);
        }
    };

    if (linksLoading) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.headerCard}>
                        <div className={styles.title}>Guardian Hub</div>
                        <div className={styles.subTitle}>Loading...</div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!isGuardianEligible) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.headerCard}>
                        <div className={styles.title}>Guardian Hub</div>
                        <div className={styles.subTitle}>
                            Trust Shield VERIFIED + at least one linked ward is required.
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.headerCard}>
                    <div>
                        <div className={styles.title}>Guardian Hub</div>
                        <div className={styles.subTitle}>Royal Lavender Command Center</div>
                    </div>

                    <div className={styles.selector}>
                        <label className={styles.selectorLabel}>Ward</label>
                        <select
                            className={styles.select}
                            value={selectedWardId}
                            onChange={(e) => setSelectedWardId(e.target.value)}
                        >
                            {links.map((l) => (
                                <option key={l.id} value={l.ward_id}>
                                    {l.ward?.full_name || l.ward?.username || l.ward_id}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Ward Stats</div>
                        <div className={styles.statRow}>
                            <div className={styles.statLabel}>Total Focus Time Today</div>
                            <div className={styles.statValue}>{focusMinutesToday} min</div>
                        </div>
                        <div className={styles.statRow}>
                            <div className={styles.statLabel}>Ward</div>
                            <div className={styles.statValue}>{selectedWard?.username || '-'}</div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Interaction Pulse</div>
                        {interactionPulse.length === 0 ? (
                            <div className={styles.muted}>No recent handles logged.</div>
                        ) : (
                            <div className={styles.pulseList}>
                                {interactionPulse.map((h) => (
                                    <div key={h} className={styles.pulseItem}>@{h}</div>
                                ))}
                            </div>
                        )}
                        <div className={styles.muted}>Privacy preserved: only handles, never DM content.</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Sovereign Safety (S_s)</div>

                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Night Lock</div>
                                <div className={styles.toggleSub}>22:00 - 06:00 overlay</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={Boolean(safety?.night_lock_enabled ?? true)}
                                onChange={(e) => setToggle('night_lock_enabled', e.target.checked)}
                                disabled={busy}
                            />
                        </div>

                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Ghost Mode</div>
                                <div className={styles.toggleSub}>Reduce exposure surface</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={Boolean(safety?.ghost_mode_enabled ?? true)}
                                onChange={(e) => setToggle('ghost_mode_enabled', e.target.checked)}
                                disabled={busy}
                            />
                        </div>

                        <div className={styles.toggleRow}>
                            <div>
                                <div className={styles.toggleLabel}>Mutual DMs Only</div>
                                <div className={styles.toggleSub}>DMs restricted by server gate</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={Boolean(safety?.dm_restricted ?? true)}
                                onChange={(e) => setToggle('dm_restricted', e.target.checked)}
                                disabled={busy}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default GuardianHub;
