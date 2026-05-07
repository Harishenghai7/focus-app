/**
 * NotificationBell - Glassmorphism Bell Icon with Sovereign Pulse
 * Displays unread count badge and handles click to navigate to notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import styles from './NotificationBell.module.css';

export const NotificationBell = ({ size = 24 }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasCritical, setHasCritical] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Fetch unread count
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

            // Check for critical notifications
            const { count: criticalCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false)
                .in('type', ['security_alert', 'login_new_device', 'suspicious_login', 'account_locked']);

            setHasCritical(!!criticalCount && criticalCount > 0);

            // Trigger animation on new notifications
            if (count > 0 && count > unreadCount) {
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 2000);
            }
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    }, [user?.id, unreadCount]);

    // Initial fetch
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel(`notification-bell-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' && !payload.new.is_read) {
                        setUnreadCount(prev => prev + 1);
                        setIsAnimating(true);
                        setTimeout(() => setIsAnimating(false), 2000);

                        // Check if critical
                        if (['security_alert', 'login_new_device', 'suspicious_login', 'account_locked'].includes(payload.new.type)) {
                            setHasCritical(true);
                        }
                    } else if (payload.eventType === 'UPDATE' && payload.new.is_read && !payload.old.is_read) {
                        setUnreadCount(prev => Math.max(0, prev - 1));
                    } else if (payload.eventType === 'DELETE') {
                        fetchUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchUnreadCount]);

    const handleClick = () => {
        navigate('/notifications');
    };

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;
    const showBadge = unreadCount > 0;

    return (
        <button
            className={`${styles.bellContainer} ${isAnimating ? styles.animate : ''} ${hasCritical ? styles.critical : ''}`}
            onClick={handleClick}
            aria-label={`Notifications${showBadge ? `, ${unreadCount} unread` : ''}`}
        >
            <div className={styles.iconWrapper}>
                <Bell
                    size={size}
                    strokeWidth={1.5}
                    className={styles.bellIcon}
                />

                {/* Glassmorphism glow effect */}
                <div className={styles.glowRing} />

                {/* Sovereign pulse animation when unread */}
                {showBadge && (
                    <div className={styles.sovereignPulse} />
                )}
            </div>

            {/* Unread badge */}
            {showBadge && (
                <div className={`${styles.badge} ${hasCritical ? styles.criticalBadge : ''}`}>
                    <span className={styles.badgeText}>{displayCount}</span>
                </div>
            )}

            {/* Critical alert indicator */}
            {hasCritical && (
                <div className={styles.criticalAlert} title="Security alert!">
                    ⚠️
                </div>
            )}
        </button>
    );
};

export default NotificationBell;
