import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheck, FaBan, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';

const FlaggedAccountsTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingUserId, setActingUserId] = useState(null);

    const loadFlaggedUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, trust_tier, is_banned, updated_at')
                .or('is_banned.eq.true,trust_tier.eq.0')
                .order('updated_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            const normalized = (data || []).map((row) => ({
                id: row.id,
                username: row.username || 'focus_user',
                reason: row.is_banned ? 'Account already globally banned' : 'Low trust tier requires moderation review',
                score: Number(row.trust_tier ?? 0),
                date: row.updated_at,
                status: row.is_banned ? 'banned' : 'pending',
                is_banned: Boolean(row.is_banned),
                full_name: row.full_name,
                avatar_url: row.avatar_url,
            }));
            setUsers(normalized);
        } catch (error) {
            console.error('Failed to load flagged accounts:', error);
            focusToast.error('Failed to load flagged accounts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFlaggedUsers();
    }, [loadFlaggedUsers]);

    useEffect(() => {
        const channel = supabase
            .channel('admin-flagged-profiles')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
            }, (payload) => {
                setUsers((prev) => prev.map((u) => (
                    u.id === payload.new.id
                        ? {
                            ...u,
                            is_banned: Boolean(payload.new.is_banned),
                            status: payload.new.is_banned ? 'banned' : 'pending',
                            reason: payload.new.is_banned
                                ? 'Account already globally banned'
                                : 'Low trust tier requires moderation review',
                            date: payload.new.updated_at,
                        }
                        : u
                )));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleAction = async (id, action) => {
        const user = users.find((u) => u.id === id);
        if (!user) return;
        setActingUserId(id);
        try {
            if (action === 'review') {
                focusToast.info(`Review opened for @${user.username}`);
                return;
            }
            if (action === 'clear') {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        trust_tier: Math.max(1, Number(user.score || 0)),
                        is_banned: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);
                if (error) throw error;
                focusToast.success(`Cleared moderation flag for @${user.username}`);
            }
            if (action === 'ban') {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        is_banned: true,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);
                if (error) throw error;
                focusToast.success(`Global ban applied to @${user.username}`);
            }
            if (action === 'unban') {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        is_banned: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id);
                if (error) throw error;
                focusToast.success(`Global ban removed for @${user.username}`);
            }
            await loadFlaggedUsers();
        } catch (error) {
            console.error('Moderation action failed:', error);
            focusToast.error('Moderation action failed. State rolled back to server truth.');
        } finally {
            setActingUserId(null);
        }
    };

    const pendingCount = useMemo(
        () => users.filter((u) => !u.is_banned).length,
        [users]
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.headerTitle}>Global Ban Control</h3>
                <span style={styles.headerMeta}>{pendingCount} pending review</span>
            </div>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Reason</th>
                        <th style={styles.th}>Trust Score</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td style={styles.td} colSpan={5}>Loading flagged accounts...</td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td style={styles.td} colSpan={5}>No flagged accounts right now.</td>
                        </tr>
                    ) : (
                    users.map(user => (
                        <tr key={user.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.userCell}>
                                    <div style={styles.avatar}>{(user.username || 'f')[0]?.toUpperCase()}</div>
                                    {user.username}
                                </div>
                            </td>
                            <td style={styles.td}>
                                <span style={styles.reason}>
                                    <FaExclamationTriangle size={12} style={{ marginRight: '6px' }} />
                                    {user.reason}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{ ...styles.score, color: user.score < 30 ? '#ef4444' : '#eab308' }}>
                                    {user.score}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{
                                    ...styles.status,
                                    background: user.status === 'pending' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.14)',
                                    color: user.status === 'pending' ? '#fbbf24' : '#f87171'
                                }}>
                                    {user.status}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <div style={styles.actions}>
                                    <button
                                        style={styles.actionBtn}
                                        title="Review"
                                        disabled={actingUserId === user.id}
                                        onClick={() => handleAction(user.id, 'review')}
                                    >
                                        <FaEye />
                                    </button>
                                    <button
                                        style={{ ...styles.actionBtn, color: '#34d399' }}
                                        title="Clear"
                                        disabled={actingUserId === user.id}
                                        onClick={() => handleAction(user.id, 'clear')}
                                    >
                                        <FaCheck />
                                    </button>
                                    <button
                                        style={{ ...styles.actionBtn, color: user.is_banned ? '#22d3ee' : '#f87171' }}
                                        title={user.is_banned ? 'Unban' : 'Ban'}
                                        disabled={actingUserId === user.id}
                                        onClick={() => handleAction(user.id, user.is_banned ? 'unban' : 'ban')}
                                    >
                                        <FaBan />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        background: 'rgba(126, 87, 194, 0.1)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 10px 34px rgba(15, 10, 30, 0.35)',
        overflow: 'hidden'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    headerTitle: {
        margin: 0,
        color: '#fff',
        fontSize: '1rem',
    },
    headerMeta: {
        color: '#c4b5fd',
        fontSize: '0.8rem',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    th: {
        textAlign: 'left',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        color: '#d8c7ff',
        fontWeight: '600'
    },
    tr: {
        borderBottom: '1px solid rgba(255,255,255,0.06)'
    },
    td: {
        padding: '16px',
        color: '#fff'
    },
    userCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '500'
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'rgba(126, 87, 194, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: '#fff'
    },
    reason: {
        display: 'flex',
        alignItems: 'center',
        color: '#fca5a5'
    },
    score: {
        fontWeight: '700'
    },
    status: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    actions: {
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#d8c7ff',
        transition: 'all 0.2s'
    }
};

export default FlaggedAccountsTable;
