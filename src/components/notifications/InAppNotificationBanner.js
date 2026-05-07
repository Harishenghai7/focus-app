/**
 * InAppNotificationBanner — Focus App
 * 
 * WhatsApp-style in-app notification banners.
 * - Slides in from top, auto-dismisses after 4s
 * - Shows avatar, actor name, notification text
 * - Click to deep-link navigate to content
 * - Stacks up to 3 banners cleanly
 * - Swipe gesture: swipeY < -40 → dismiss
 * 
 * Usage: Mount <InAppNotificationBannerHost /> near the top level.
 * Push notifications via the exported addBanner() call or
 * use the useInAppNotifications() hook.
 */

import React, {
    useState, useEffect, useCallback, useRef, createContext, useContext
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import { useWebPush } from '../../hooks/useWebPush';
import UserAvatar from '../ui/Avatar';
import styles from './InAppNotificationBanner.module.css';

/* ─────────────────────────────────────────────────────── */
/*  Context                                                */
/* ─────────────────────────────────────────────────────── */
const BannerContext = createContext({ addBanner: () => {} });

let _bannerId = 0;

export const InAppNotificationProvider = ({ children, userId }) => {
    const [banners, setBanners] = useState([]);
    const { foregroundMessage, clearForegroundMessage } = useWebPush(userId);

    const addBannerInternal = useCallback((notification) => {
        _bannerId++;
        const id = _bannerId;
        setBanners(prev => {
            // Priority: Security alerts always go first
            const isSecurity = ['security_alert', 'login_new_device', 'suspicious_login'].includes(notification.type);
            const next = [...prev, { ...notification, _id: id, isSecurity }];
            // Sort: Security first, then by order added
            next.sort((a, b) => {
                if (a.isSecurity && !b.isSecurity) return -1;
                if (!a.isSecurity && b.isSecurity) return 1;
                return 0;
            });
            // Max 3 visible at a time
            return next.length > 3 ? next.slice(0, 3) : next;
        });
    }, []);

    const removeBanner = useCallback((id) => {
        setBanners(prev => prev.filter(b => b._id !== id));
    }, []);

    // Listen for Web Push foreground messages (FREE, No Firebase!)
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
    }, [foregroundMessage, clearForegroundMessage]);

    return (
        <BannerContext.Provider value={{ addBanner: addBannerInternal }}>
            {children}
            <div className={styles.host} aria-live="polite" aria-label="Notifications">
                {banners.map((b, i) => (
                    <Banner
                        key={b._id}
                        notification={b}
                        stackIndex={i}
                        total={banners.length}
                        onDismiss={() => removeBanner(b._id)}
                    />
                ))}
            </div>
        </BannerContext.Provider>
    );
};

export const useInAppNotifications = () => useContext(BannerContext);

/* ─────────────────────────────────────────────────────── */
/*  Individual Banner                                      */
/* ─────────────────────────────────────────────────────── */
const ICON_MAP = {
    like: '❤️', comment: '💬', follow: '👤',
    mention: '@', message: '✉️', share: '↗️',
    tag: '🏷️', system: '🔔',
    boltz_like: '⚡', boltz_comment: '💬', reply: '↩️',
    security_alert: '🔒', login_new_device: '🔐', suspicious_login: '⚠️',
    badge_granted: '🏆', trust_level_up: '🛡️', verification_approved: '✅',
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
        case 'like':    return `${name} liked your post`;
        case 'comment': return `${name}: "${(n.body || '').slice(0, 50)}"`;
        case 'follow':  return `${name} started following you`;
        case 'mention': return `${name} mentioned you`;
        case 'message': return `${name}: "${(n.body || 'New message').slice(0, 50)}"`;
        default:        return n.body || 'New notification';
    }
};

const Banner = ({ notification: n, stackIndex, total, onDismiss }) => {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef(null);
    const touchStartY = useRef(null);

    // Security alerts stay longer
    const isSecurity = ['security_alert', 'login_new_device', 'suspicious_login'].includes(n.type);
    const autoDismissDelay = isSecurity ? 8000 : 4500;

    // Mount animation + auto-dismiss
    useEffect(() => {
        const mountTimer = setTimeout(() => setVisible(true), 20);
        timerRef.current = setTimeout(dismiss, autoDismissDelay);
        return () => {
            clearTimeout(mountTimer);
            clearTimeout(timerRef.current);
        };
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

    // Swipe-up to dismiss
    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
        const delta = e.changedTouches[0].clientY - (touchStartY.current ?? 0);
        if (delta < -40) dismiss();
    };

    const icon = ICON_MAP[n.type] || '🔔';

    // Sovereign styling for security banners
    const bannerClass = [
        styles.banner,
        visible && !exiting ? styles.visible : '',
        exiting ? styles.exiting : '',
        isSecurity ? styles.securityBanner : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={bannerClass}
            style={{ '--stack': stackIndex, '--dismiss-delay': `${autoDismissDelay}ms` }}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            role="alert"
            aria-live="assertive"
        >
            {/* Security indicator */}
            {isSecurity && (
                <div className={styles.securityIndicator}>
                    <AlertTriangle size={14} />
                </div>
            )}

            {/* Avatar with Trust Shield */}
            <div className={styles.avatarWrap}>
                <UserAvatar
                    src={n.actor?.avatar_url}
                    username={n.actor?.username}
                    fullName={n.actor?.full_name}
                    size="sm"
                />
                {n.actor?.trust_shield_verified && (
                    <div className={styles.trustShieldIcon}>
                        <Shield size={10} />
                    </div>
                )}
                <span className={`${styles.typeIcon} ${isSecurity ? styles.securityIcon : ''}`} aria-hidden="true">
                    {icon}
                </span>
            </div>

            {/* Text */}
            <div className={styles.textWrap}>
                <span className={`${styles.notifText} ${isSecurity ? styles.securityText : ''}`}>
                    {getText(n)}
                </span>
                <span className={styles.appName}>
                    {isSecurity ? '⚠️ Security Alert' : 'Focus'}
                </span>
            </div>

            {/* Dismiss */}
            <button
                className={styles.closeBtn}
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
                aria-label="Dismiss"
            >
                ×
            </button>

            {/* Progress bar */}
            <div className={`${styles.progress} ${isSecurity ? styles.securityProgress : ''}`} />
        </div>
    );
};

export default InAppNotificationProvider;
