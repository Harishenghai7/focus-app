// ═══════════════════════════════════════════════════════════════════════
// 📞 SOVEREIGN FREQUENCY — Premium Call History & Management
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import styles from './Calls.module.css';

const Icons = {
    phone: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    video: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
    incoming: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/><path d="M3 5v14"/></svg>,
    outgoing: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 7 3 12 8 17"/><line x1="3" y1="12" x2="15" y2="12"/><path d="M21 5v14"/></svg>,
    missed: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/></svg>,
    shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'missed', label: 'Missed' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'outgoing', label: 'Outgoing' }
];

const Calls = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!user?.id) return;
        const fetchCalls = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('calls')
                    .select('*, caller:caller_id(id, username, full_name, avatar_url), receiver:receiver_id(id, username, full_name, avatar_url)')
                    .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
                    .order('created_at', { ascending: false })
                    .limit(50);
                setCalls(data || []);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, [user?.id]);

    const filteredCalls = useMemo(() => {
        if (activeTab === 'all') return calls;
        if (activeTab === 'missed') return calls.filter(c => c.status === 'missed' || c.status === 'no_answer');
        if (activeTab === 'incoming') return calls.filter(c => c.receiver_id === user?.id);
        if (activeTab === 'outgoing') return calls.filter(c => c.caller_id === user?.id);
        return calls;
    }, [calls, activeTab, user?.id]);

    const getOtherUser = (call) => {
        return call.caller_id === user?.id ? call.receiver : call.caller;
    };

    const getDirection = (call) => {
        if (call.status === 'missed' || call.status === 'no_answer') return 'missed';
        return call.caller_id === user?.id ? 'outgoing' : 'incoming';
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        if (diff < 86400000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diff < 604800000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const handleCallBack = (call) => {
        const other = getOtherUser(call);
        if (other?.id) {
            navigate(`/messages/${other.id}?call=${call.type || 'audio'}`);
        }
    };

    // Quick dial — top 6 unique recent contacts
    const quickDial = useMemo(() => {
        const seen = new Set();
        const contacts = [];
        for (const call of calls) {
            const other = getOtherUser(call);
            if (other && !seen.has(other.id)) {
                seen.add(other.id);
                contacts.push(other);
                if (contacts.length >= 6) break;
            }
        }
        return contacts;
    }, [calls]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Calls</h1>
                <div className={styles.headerRight}>
                    <Icons.shield />
                    <span className={styles.encLabel}>Encrypted</span>
                </div>
            </div>

            {/* Quick Dial */}
            {quickDial.length > 0 && (
                <div className={styles.quickDial}>
                    <div className={styles.quickDialTitle}>Quick Dial</div>
                    <div className={styles.quickDialScroll}>
                        {quickDial.map(contact => (
                            <button
                                key={contact.id}
                                className={styles.quickDialItem}
                                onClick={() => navigate(`/messages/${contact.id}?call=audio`)}
                            >
                                {contact.avatar_url ? (
                                    <img src={contact.avatar_url} alt="" className={styles.quickDialAvatar} />
                                ) : (
                                    <div className={styles.quickDialAvatarFallback}>
                                        {(contact.username?.[0] || '?').toUpperCase()}
                                    </div>
                                )}
                                <span className={styles.quickDialName}>{contact.username}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className={styles.tabs}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        {tab.key === 'missed' && calls.filter(c => c.status === 'missed' || c.status === 'no_answer').length > 0 && (
                            <span className={styles.missedBadge}>
                                {calls.filter(c => c.status === 'missed' || c.status === 'no_answer').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Call List */}
            <div className={styles.callList}>
                {loading ? (
                    <div className={styles.loader}>
                        <div className={styles.spinner} />
                        <span>Loading calls...</span>
                    </div>
                ) : filteredCalls.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyRings}>
                            <div className={styles.ring1} />
                            <div className={styles.ring2} />
                            <div className={styles.ring3} />
                            <Icons.phone />
                        </div>
                        <h3 className={styles.emptyTitle}>
                            {activeTab === 'all' ? 'No calls yet' :
                             activeTab === 'missed' ? 'No missed calls' :
                             `No ${activeTab} calls`}
                        </h3>
                        <p className={styles.emptyText}>Your encrypted call history will appear here</p>
                    </div>
                ) : (
                    filteredCalls.map(call => {
                        const other = getOtherUser(call);
                        const direction = getDirection(call);
                        const isMissed = direction === 'missed';

                        return (
                            <div
                                key={call.id}
                                className={`${styles.callItem} ${isMissed ? styles.callItemMissed : ''}`}
                                onClick={() => handleCallBack(call)}
                            >
                                {/* Avatar */}
                                <div className={styles.callAvatar}>
                                    {other?.avatar_url ? (
                                        <img src={other.avatar_url} alt="" className={styles.callAvatarImg} />
                                    ) : (
                                        <div className={styles.callAvatarFallback}>
                                            {(other?.username?.[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className={styles.callInfo}>
                                    <div className={styles.callName}>
                                        {other?.full_name || other?.username || 'Unknown'}
                                    </div>
                                    <div className={styles.callMeta}>
                                        <span className={`${styles.callDirection} ${isMissed ? styles.missed : ''}`}>
                                            {direction === 'incoming' ? <Icons.incoming /> :
                                             direction === 'outgoing' ? <Icons.outgoing /> :
                                             <Icons.missed />}
                                            {direction === 'incoming' ? 'Incoming' :
                                             direction === 'outgoing' ? 'Outgoing' : 'Missed'}
                                        </span>
                                        <span className={styles.callDot}>·</span>
                                        <span>{call.type === 'video' ? 'Video' : 'Audio'}</span>
                                        {call.duration > 0 && (
                                            <>
                                                <span className={styles.callDot}>·</span>
                                                <span>{formatDuration(call.duration)}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Time & Action */}
                                <div className={styles.callRight}>
                                    <span className={styles.callTime}>{formatTime(call.created_at)}</span>
                                    <button
                                        className={styles.callAction}
                                        onClick={(e) => { e.stopPropagation(); handleCallBack(call); }}
                                    >
                                        {call.type === 'video' ? <Icons.video /> : <Icons.phone />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Calls;
