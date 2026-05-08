/**
 * NotificationBell — Sovereign Ecosystem
 * Mode-aware bell with priority badge, focus/quiet indicators, preview dropdown
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Moon, VolumeX } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { getPriority, PRIORITY, humanTime } from '../../services/notificationService';
import styles from './NotificationBell.module.css';

export const NotificationBell = ({ size = 22 }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasCritical, setHasCritical] = useState(false);
    const [hasHigh, setHasHigh] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [recentNotifs, setRecentNotifs] = useState([]);
    const previewTimer = useRef(null);

    const { prefs } = useNotificationPreferences(user?.id);

    const fetchUnreadCount = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            if (error) throw error;
            setUnreadCount(count || 0);

            const { count: criticalCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)
                .in('type', ['security_alert', 'login_new_device', 'suspicious_login', 'account_locked']);
            setHasCritical(!!criticalCount && criticalCount > 0);

            const { count: highCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)
                .in('type', ['follow', 'mention', 'message', 'reply', 'tag', 'badge_granted', 'trust_level_up']);
            setHasHigh(!!highCount && highCount > 0);
        } catch (err) {
            console.error('NotificationBell fetch error:', err);
        }
    }, [user?.id]);

    useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;
        const channel = supabase
            .channel(`bell-${user.id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'notifications',
                filter: `user_id=eq.${user.id}`,
            }, (payload) => {
                if (payload.eventType === 'INSERT' && !payload.new.is_read) {
                    setUnreadCount(prev => prev + 1);
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 2000);
                    if (['security_alert', 'login_new_device', 'suspicious_login', 'account_locked'].includes(payload.new.type)) {
                        setHasCritical(true);
                    }
                } else if (payload.eventType === 'UPDATE' && payload.new.is_read && !payload.old?.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } else if (payload.eventType === 'DELETE') {
                    fetchUnreadCount();
                }
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user?.id, fetchUnreadCount]);

    // Preview dropdown — fetch 3 recent on hover
    const handleMouseEnter = useCallback(async () => {
        previewTimer.current = setTimeout(async () => {
            if (!user?.id) return;
            try {
                const { data } = await supabase
                    .from('notifications')
                    .select('id, type, body, content, created_at, actor:profiles!actor_id(username, full_name, avatar_url)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (data) {
                    setRecentNotifs(data);
                    setShowPreview(true);
                }
            } catch {}
        }, 400);
    }, [user?.id]);

    const handleMouseLeave = () => {
        clearTimeout(previewTimer.current);
        setShowPreview(false);
    };

    const handleClick = () => {
        setShowPreview(false);
        navigate('/notifications');
    };

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;
    const showBadge = unreadCount > 0;

    // Badge priority color
    const badgeClass = [
        styles.badge,
        hasCritical ? styles.criticalBadge : hasHigh ? styles.highBadge : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.bellWrap} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                className={`${styles.bellContainer} ${isAnimating ? styles.animate : ''} ${hasCritical ? styles.critical : ''}`}
                onClick={handleClick}
                aria-label={`Notifications${showBadge ? `, ${unreadCount} unread` : ''}`}
            >
                <div className={styles.iconWrapper}>
                    <Bell size={size} strokeWidth={1.5} className={styles.bellIcon} />
                    {showBadge && <div className={styles.sovereignPulse} />}
                </div>

                {showBadge && (
                    <div className={badgeClass}>
                        <span className={styles.badgeText}>{displayCount}</span>
                    </div>
                )}

                {/* Mode indicators */}
                {prefs.focusMode && (
                    <div className={styles.modeIndicator + ' ' + styles.focusIndicator} title="Focus Mode">
                        <Moon size={8} />
                    </div>
                )}
                {!prefs.focusMode && prefs.quietMode && (
                    <div className={styles.modeIndicator + ' ' + styles.quietIndicator} title="Quiet Mode">
                        <VolumeX size={8} />
                    </div>
                )}
            </button>

            {/* Preview Dropdown */}
            {showPreview && recentNotifs.length > 0 && (
                <div className={styles.previewDropdown}>
                    <div className={styles.previewHeader}>Recent</div>
                    {recentNotifs.map(n => (
                        <div key={n.id} className={styles.previewItem} onClick={handleClick}>
                            <span className={styles.previewText}>
                                <strong>{n.actor?.full_name || n.actor?.username || 'Someone'}</strong>
                                {' '}{n.body || n.content || n.type}
                            </span>
                            <span className={styles.previewTime}>{humanTime(n.created_at)}</span>
                        </div>
                    ))}
                    <div className={styles.previewFooter} onClick={handleClick}>View all →</div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
