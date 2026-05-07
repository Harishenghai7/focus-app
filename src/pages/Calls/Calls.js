import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Calls.module.css';
import MainLayout from '../../components/layout/MainLayout';
import Icon from '../../components/ui/Icon';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const TABS = [
    { key: 'all', label: 'All', icon: 'Phone' },
    { key: 'missed', label: 'Missed', icon: 'PhoneMissed' },
    { key: 'incoming', label: 'Received', icon: 'PhoneIncoming' },
    { key: 'outgoing', label: 'Dialed', icon: 'PhoneOutgoing' }
];

// "Sovereign Frequency" call-history page — wired to the calls table.
const Calls = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [calls, setCalls] = useState([]);
    const [tab, setTab] = useState('all');
    const [error, setError] = useState(null);

    const fetchCalls = useCallback(async () => {
        if (!user?.id) return;
        try {
            setError(null);
            const { data, error: dbError } = await supabase
                .from('calls')
                .select(`
                    id, conversation_id, caller_id, receiver_id, call_type, status,
                    started_at, ended_at, duration_seconds, created_at,
                    caller:profiles!calls_caller_id_fkey(id, username, full_name, avatar_url, is_verified),
                    receiver:profiles!calls_receiver_id_fkey(id, username, full_name, avatar_url, is_verified)
                `)
                .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false })
                .limit(100);

            if (dbError) throw dbError;
            setCalls(data || []);
        } catch (err) {
            console.error('Failed to load call history:', err);
            setError(err.message || 'Could not load call history');
            setCalls([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    // Realtime: refresh log when call rows change
    useEffect(() => {
        if (!user?.id) return;
        const ch = supabase
            .channel(`calls-history-${user.id}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'calls' },
                () => fetchCalls()
            )
            .subscribe();
        return () => { ch.unsubscribe(); };
    }, [user?.id, fetchCalls]);

    const enriched = useMemo(() => {
        return (calls || []).map(c => {
            const isOutgoing = c.caller_id === user?.id;
            const other = isOutgoing ? c.receiver : c.caller;
            let direction = 'outgoing';
            if (!isOutgoing) direction = 'incoming';
            if (c.status === 'missed' || (!isOutgoing && c.status === 'rejected')) direction = 'missed';
            return { ...c, isOutgoing, other, direction };
        });
    }, [calls, user?.id]);

    const filtered = useMemo(() => {
        if (tab === 'all') return enriched;
        return enriched.filter(c => c.direction === tab);
    }, [enriched, tab]);

    const formatTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        const sameDay = d.toDateString() === now.toDateString();
        if (sameDay) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        const diffDays = Math.floor((now - d) / 86400000);
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatDuration = (s) => {
        if (!s || s <= 0) return null;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleRedial = (call, callType) => {
        if (!call.conversation_id) return;
        // Hand off to ChatPane; it owns the call lifecycle via useCall.
        // Pass intent through query params so the conversation auto-dials on mount.
        navigate(`/messages/${call.conversation_id}?dial=${callType}&to=${call.other?.id || ''}`);
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Sovereign Frequency</h1>
                    <Link to="/messages" className={styles.messagesLink}>
                        <Icon name="MessageCircle" size={16} />
                        Messages
                    </Link>
                </div>

                <div className={styles.tabs} role="tablist" aria-label="Call history filter">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={tab === t.key}
                            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            <Icon name={t.icon} size={14} />
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className={styles.loaderContainer}>
                        <div className={styles.pulse} aria-hidden />
                        <p className={styles.loaderText}>Tuning frequencies…</p>
                    </div>
                ) : error ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon} aria-hidden>
                            <Icon name="AlertCircle" size={40} />
                        </div>
                        <h2 className={styles.emptyTitle}>Frequency unavailable</h2>
                        <p className={styles.emptyText}>{error}</p>
                        <button className={styles.cta} onClick={fetchCalls} type="button">
                            Retry
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon} aria-hidden>
                            <Icon name="Phone" size={40} />
                        </div>
                        <h2 className={styles.emptyTitle}>
                            {tab === 'all' ? 'No call log yet' : `No ${tab} calls`}
                        </h2>
                        <p className={styles.emptyText}>
                            Calls you make from Messages will land here. Try starting a Sovereign Whisper.
                        </p>
                        <Link to="/messages" className={styles.cta}>
                            Open Messages
                        </Link>
                    </div>
                ) : (
                    <div className={styles.list} role="list">
                        {filtered.map((call) => {
                            const directionLabel = call.direction === 'missed'
                                ? 'Missed'
                                : call.direction === 'incoming' ? 'Incoming' : 'Outgoing';
                            const duration = formatDuration(call.duration_seconds);
                            return (
                                <div key={call.id} className={styles.item} role="listitem">
                                    <div
                                        className={styles.avatar}
                                        onClick={() => call.conversation_id && navigate(`/messages/${call.conversation_id}`)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        {call.other?.avatar_url ? (
                                            <img src={call.other.avatar_url} alt={call.other?.username || 'User'} />
                                        ) : (
                                            <span className={styles.avatarPlaceholder}>
                                                {(call.other?.username || '?')[0]?.toUpperCase()}
                                            </span>
                                        )}
                                        {call.other?.is_verified && (
                                            <span className={styles.shieldDot} aria-label="Trust Shield verified">
                                                <Icon name="ShieldCheck" size={12} />
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.info}>
                                        <span className={styles.username}>
                                            {call.other?.full_name || call.other?.username || 'Unknown'}
                                        </span>
                                        <div className={styles.meta}>
                                            <span className={`${styles.callTypeBadge} ${styles[call.direction]}`}>
                                                <Icon
                                                    name={
                                                        call.direction === 'missed' ? 'PhoneMissed' :
                                                        call.direction === 'incoming' ? 'PhoneIncoming' : 'PhoneOutgoing'
                                                    }
                                                    size={12}
                                                />
                                                {directionLabel}
                                                {call.call_type === 'video' ? ' · Video' : ' · Audio'}
                                            </span>
                                            <span className={styles.time}>
                                                {formatTime(call.created_at)}
                                                {duration ? ` · ${duration}` : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        className={styles.callActionBtn}
                                        title="Redial audio"
                                        type="button"
                                        onClick={() => handleRedial(call, 'audio')}
                                        aria-label="Redial audio"
                                    >
                                        <Icon name="Phone" size={18} />
                                    </button>
                                    <button
                                        className={`${styles.callActionBtn} ${styles.video}`}
                                        title="Redial video"
                                        type="button"
                                        onClick={() => handleRedial(call, 'video')}
                                        aria-label="Redial video"
                                    >
                                        <Icon name="Video" size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Calls;
