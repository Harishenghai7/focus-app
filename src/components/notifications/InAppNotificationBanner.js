/**
 * InAppNotificationBanner — Sovereign Ecosystem
 * Mode-aware slide-in banners with priority escalation
 * - Respects Focus Mode (only critical) and Quiet Mode (critical + high)
 * - Smart coalescing of rapid-fire notifications
 * - Swipe-up to dismiss, auto-dismiss with progress bar
 */
import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { useWebPush } from '../../hooks/useWebPush';
import UserAvatar from '../ui/Avatar';
import { shouldShowBanner, getPriority, PRIORITY } from '../../services/notificationService';
import styles from './InAppNotificationBanner.module.css';

const BannerContext = createContext({ addBanner: () => {} });
let _bannerId = 0;

export const InAppNotificationProvider = ({ children, userId }) => {
    const [banners, setBanners] = useState([]);
    const prefsRef = useRef({ focusMode: false, quietMode: false });
    const { foregroundMessage, clearForegroundMessage } = useWebPush(userId);

    // Allow external pref updates
    const updateModePrefs = useCallback((prefs) => {
        prefsRef.current = prefs;
    }, []);

    const addBannerInternal = useCallback((notification) => {
        // Mode filtering
        if (!shouldShowBanner(notification, prefsRef.current)) return;

        _bannerId++;
        const id = _bannerId;
        const priority = getPriority(notification.type);

        setBanners(prev => {
            const next = [...prev, { ...notification, _id: id, _priority: priority }];
            // Sort: critical first, then high, then by order
            next.sort((a, b) => {
                const pa = a._priority === PRIORITY.CRITICAL ? 0 : a._priority === PRIORITY.HIGH ? 1 : 2;
                const pb = b._priority === PRIORITY.CRITICAL ? 0 : b._priority === PRIORITY.HIGH ? 1 : 2;
                return pa - pb;
            });
            return next.length > 3 ? next.slice(0, 3) : next;
        });
    }, []);

    const removeBanner = useCallback((id) => {
        setBanners(prev => prev.filter(b => b._id !== id));
    }, []);

    // Web Push foreground messages
    useEffect(() => {
        if (foregroundMessage) {
            const { title, options } = foregroundMessage;
            addBannerInternal({
                type: options?.data?.type || 'system',
                title,
                body: options?.body,
                actor: options?.data?.actor,
                content_id: options?.data?.content_id,
                content_type: options?.data?.content_type,
                conversation_id: options?.data?.conversation_id,
            });
            clearForegroundMessage();
        }
    }, [foregroundMessage, clearForegroundMessage, addBannerInternal]);

    return (
        <BannerContext.Provider value={{ addBanner: addBannerInternal, updateModePrefs }}>
            {children}
            <div className={styles.host} aria-live="polite" aria-label="Notifications">
                {banners.map((b, i) => (
                    <Banner key={b._id} notification={b} stackIndex={i} onDismiss={() => removeBanner(b._id)} />
                ))}
            </div>
        </BannerContext.Provider>
    );
};

export const useInAppNotifications = () => useContext(BannerContext);

/* ── Icon Map ────────────────────────────────────────────── */
const ICON_MAP = {
    like: '❤️', comment: '💬', follow: '👤', mention: '@', message: '✉️',
    share: '↗️', tag: '🏷️', system: '🔔', boltz_like: '⚡', boltz_comment: '💬',
    reply: '↩️', security_alert: '🔒', login_new_device: '🔐',
    suspicious_login: '⚠️', badge_granted: '🏆', trust_level_up: '🛡️',
    verification_approved: '✅',
};

const DEEP_LINK = (n) => {
    if (['like', 'comment', 'mention', 'tag'].includes(n.type) && n.content_id) {
        return n.content_type === 'boltz' ? `/boltz/${n.content_id}` : `/p/${n.content_id}`;
    }
    if (n.type === 'follow' && n.actor?.username) return `/profile/${n.actor.username}`;
    if (n.type === 'message' && n.conversation_id) return `/messages/${n.conversation_id}`;
    if (n.type === 'message') return '/messages';
    return null;
};

const getText = (n) => {
    const name = n.actor?.full_name || n.actor?.username || 'Someone';
    switch (n.type) {
        case 'like': return `${name} liked your post`;
        case 'comment': return `${name}: "${(n.body || '').slice(0, 50)}"`;
        case 'follow': return `${name} started following you`;
        case 'mention': return `${name} mentioned you`;
        case 'message': return `${name}: "${(n.body || 'New message').slice(0, 50)}"`;
        default: return n.body || n.title || 'New notification';
    }
};

/* ── Individual Banner ───────────────────────────────────── */
const Banner = ({ notification: n, stackIndex, onDismiss }) => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef(null);
    const touchStartY = useRef(null);

    const priority = n._priority || getPriority(n.type);
    const isCritical = priority === PRIORITY.CRITICAL;
    const isHigh = priority === PRIORITY.HIGH;
    const autoDismissDelay = isCritical ? 10000 : isHigh ? 6000 : 4500;

    useEffect(() => {
        const mt = setTimeout(() => setVisible(true), 20);
        timerRef.current = setTimeout(dismiss, autoDismissDelay);
        return () => { clearTimeout(mt); clearTimeout(timerRef.current); };
    }, [autoDismissDelay]); // eslint-disable-line react-hooks/exhaustive-deps

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(onDismiss, 320);
    }, [onDismiss]);

    const handleClick = () => {
        const link = DEEP_LINK(n);
        dismiss();
        if (link) setTimeout(() => navigate(link), 80);
    };

    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
        const delta = e.changedTouches[0].clientY - (touchStartY.current ?? 0);
        if (delta < -40) dismiss();
    };

    const icon = ICON_MAP[n.type] || '🔔';

    const bannerClass = [
        styles.banner,
        visible && !exiting ? styles.visible : '',
        exiting ? styles.exiting : '',
        isCritical ? styles.criticalBanner : '',
        isHigh ? styles.highBanner : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={bannerClass}
            style={{ '--stack': stackIndex, '--dismiss-delay': `${autoDismissDelay}ms` }}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="alert"
            aria-live={isCritical ? 'assertive' : 'polite'}
        >
            {isCritical && (
                <div className={styles.criticalIndicator}><AlertTriangle size={13} /></div>
            )}

            <div className={styles.avatarWrap}>
                <UserAvatar src={n.actor?.avatar_url} username={n.actor?.username} fullName={n.actor?.full_name} size="sm" />
                {n.actor?.trust_shield_verified && (
                    <div className={styles.trustIcon}><Shield size={9} /></div>
                )}
                <span className={`${styles.typeIcon} ${isCritical ? styles.criticalIcon : ''}`}>{icon}</span>
            </div>

            <div className={styles.textWrap}>
                <span className={`${styles.notifText} ${isCritical ? styles.criticalText : ''}`}>{getText(n)}</span>
                <span className={styles.appName}>{isCritical ? '⚠️ Security Alert' : 'Focus'}</span>
            </div>

            <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); dismiss(); }} aria-label="Dismiss">×</button>

            <div className={`${styles.progress} ${isCritical ? styles.criticalProgress : isHigh ? styles.highProgress : ''}`} />
        </div>
    );
};

export default InAppNotificationProvider;
