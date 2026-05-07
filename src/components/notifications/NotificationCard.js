import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Check, Shield, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import styles from './NotificationCard.module.css';

const TYPE_ICONS = {
    // Interactions
    like: 'Heart', comment: 'MessageCircle', follow: 'UserPlus', mention: 'AtSign',
    message: 'MessageSquare', share: 'Send', tag: 'Tag', boltz_like: 'Zap',
    boltz_comment: 'MessageCircle', reply: 'CornerDownRight',

    // Security
    login_new_device: 'Smartphone', suspicious_login: 'AlertTriangle',
    password_change: 'Key', account_locked: 'Lock', security_alert: 'ShieldAlert',
    session_revoked: 'LogOut', two_factor_enabled: 'ShieldCheck',

    // Verification
    badge_granted: 'Award', trust_level_up: 'TrendingUp', trust_level_down: 'TrendingDown',
    vouched: 'ThumbsUp', guardian_action: 'UserCheck', teen_alert: 'AlertCircle',
    focusid_upgrade: 'Verified', verification_approved: 'CheckCircle',

    system: 'Bell',
};

const TYPE_COLORS = {
    // Interactions - Satin Silver finish
    like: '#c0c0c0', comment: '#a78bfa', follow: '#60a5fa', mention: '#34d399',
    message: '#fbbf24', share: '#a78bfa', tag: '#c084fc',
    boltz_like: '#e5e7eb', boltz_comment: '#a78bfa', reply: '#818cf8',

    // Security - Alert colors
    login_new_device: '#f59e0b', suspicious_login: '#ef4444', password_change: '#60a5fa',
    account_locked: '#dc2626', security_alert: '#ef4444', session_revoked: '#f97316',

    // Verification - Success colors
    badge_granted: '#8b5cf6', trust_level_up: '#10b981', trust_level_down: '#ef4444',
    vouched: '#3b82f6', focusid_upgrade: '#8b5cf6', verification_approved: '#10b981',

    system: '#94a3b8',
};

const getNotificationText = (n) => {
    const name = n.actor?.full_name || n.actor?.username || 'Someone';
    const batchCount = n.group_count || 1;
    const batchIndicator = batchCount > 1 ? (
        <span className={styles.batchIndicator}>
            <Users size={12} />
            {batchCount}
        </span>
    ) : null;

    switch (n.type) {
        case 'like': return <><strong>{name}</strong> liked your post {batchIndicator}</>;
        case 'comment': return <><strong>{name}</strong> commented: <span className={styles.preview}>"{(n.body || n.content || '').slice(0, 60)}"</span></>;
        case 'follow': return <><strong>{name}</strong> started following you</>;
        case 'mention': return <><strong>{name}</strong> mentioned you in a comment</>;
        case 'message': return <><strong>{name}</strong> sent you a message</>;
        case 'share': return <><strong>{name}</strong> shared your post</>;
        case 'tag': return <><strong>{name}</strong> tagged you in a post</>;
        case 'boltz_like': return <><strong>{name}</strong> liked your boltz {batchIndicator}</>;
        case 'boltz_comment': return <><strong>{name}</strong> commented on your boltz</>;
        case 'reply': return <><strong>{name}</strong> replied: <span className={styles.preview}>"{(n.body || n.content || '').slice(0, 60)}"</span></>;

        // Security
        case 'login_new_device': return <><strong style={{color: '#f59e0b'}}>New Device Login</strong> - Unrecognized device detected</>;
        case 'suspicious_login': return <><strong style={{color: '#ef4444'}}>⚠️ Suspicious Login Blocked</strong></>;
        case 'password_change': return <><strong style={{color: '#60a5fa'}}>Password Changed</strong> - Your password was recently updated</>;
        case 'security_alert': return <><strong style={{color: '#ef4444'}}>Security Alert!</strong> {n.body}</>;
        case 'session_revoked': return <><strong style={{color: '#f97316'}}>Session Ended</strong> - A session was terminated</>;

        // Verification
        case 'badge_granted': return <><strong style={{color: '#8b5cf6'}}>🏆 Badge Granted!</strong> You've earned the verified badge</>;
        case 'trust_level_up': return <><strong style={{color: '#10b981'}}>🛡️ Trust Level Up!</strong> Your Trust Shield tier increased</>;
        case 'verification_approved': return <><strong style={{color: '#10b981'}}>✅ Verification Approved</strong> Your identity is now verified</>;
        case 'focusid_upgrade': return <><strong style={{color: '#8b5cf6'}}>🌟 Sovereign ID Upgraded</strong> Your digital identity has been enhanced</>;

        default: return n.content || n.body || n.text || 'New notification';
    }
};

const NotificationCard = ({ notification: n, onMarkAsRead, onDelete, onSwipe }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [followState, setFollowState] = useState('idle'); // idle | loading | followed
    const [isSwiping, setIsSwiping] = useState(false);

    const isUnread = !(n.is_read ?? n.read);
    const isSecurity = ['login_new_device', 'session_revoked', 'suspicious_login', 'password_change', 'account_locked', 'security_alert'].includes(n.type);
    const isVerification = ['badge_granted', 'badge_revoked', 'trust_level_up', 'trust_level_down', 'vouched', 'focusid_upgrade', 'verification_approved', 'verification_rejected'].includes(n.type);
    const isTrusted = n.actor?.trust_shield_verified || n.actor?.verified;

    const iconName = TYPE_ICONS[n.type] || 'Bell';
    const iconColor = TYPE_COLORS[n.type] || '#94a3b8';

    const getCardStyles = () => {
        if (isSecurity) return `${styles.card} ${styles.securityCard}`;
        if (isVerification) return `${styles.card} ${styles.verificationCard}`;
        return `${styles.card} ${isUnread ? styles.unread : ''}`;
    };

    const handleClick = () => {
        if (isUnread) onMarkAsRead(n.id);

        // INTERACTION DEEP LINKS
        if (['like', 'comment', 'mention', 'tag', 'share', 'reply', 'boltz_like', 'boltz_comment'].includes(n.type) && n.content_id) {
            const openComments = ['comment', 'reply', 'boltz_comment'].includes(n.type);
            navigate(n.content_type === 'boltz' ? `/boltz/${n.content_id}` : `/p/${n.content_id}`, {
                state: openComments ? { openComments: true, source: 'notification' } : undefined
            });
        } else if (n.type === 'follow' && n.actor?.username) {
            navigate(`/profile/${n.actor.username}`);
        } else if (n.type === 'message') {
            navigate(n.conversation_id ? `/messages/${n.conversation_id}` : '/messages');
        }

        // SECURITY DEEP LINKS
        else if (isSecurity) {
            navigate('/settings', { state: { section: 'security' } });
        }

        // VERIFICATION DEEP LINKS
        else if (isVerification) {
            navigate('/verification-center');
        }
    };

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (!user || followState !== 'idle') return;
        setFollowState('loading');
        try {
            await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: n.actor?.id,
            });
            setFollowState('followed');
        } catch {
            setFollowState('idle');
        }
    };

    return (
        <div
            className={getCardStyles()}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClick(); }}
        >
            {/* Unread accent with Sovereign styling */}
            {isUnread && !isSecurity && !isVerification && (
                <>
                    <div className={styles.unreadAccent} />
                    <div className={styles.pulseDot} />
                </>
            )}

            {/* Avatar + Trust Shield badge + type badge */}
            <div className={styles.avatarArea}>
                <UserAvatar
                    src={n.actor?.avatar_url}
                    username={n.actor?.username}
                    fullName={n.actor?.full_name}
                    size="md"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (n.actor?.username) navigate(`/profile/${n.actor.username}`);
                    }}
                />
                {/* Trust Shield Badge for verified users */}
                {isTrusted && (
                    <div className={styles.trustShieldBadge} title="Trust Shield Verified">
                        <Shield size={10} />
                    </div>
                )}
                <div
                    className={styles.typeBadge}
                    style={{ background: iconColor }}
                    aria-hidden="true"
                >
                    <Icon name={iconName} size={12} />
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <p className={styles.text}>{getNotificationText(n)}</p>
                <span className={styles.time}>
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true }).replace('about ', '')}
                </span>

                {/* Follow-back button */}
                {n.type === 'follow' && followState !== 'followed' && (
                    <button
                        className={styles.followBtn}
                        onClick={handleFollow}
                        disabled={followState === 'loading'}
                    >
                        {followState === 'loading' ? '…' : 'Follow back'}
                    </button>
                )}
                {n.type === 'follow' && followState === 'followed' && (
                    <span className={styles.followedBadge}>
                        <Check size={12} /> Following
                    </span>
                )}
            </div>

            {/* Post thumbnail */}
            {n.metadata?.preview_image && (
                <div className={styles.thumbnail}>
                    <img src={n.metadata.preview_image} alt="" />
                </div>
            )}

            {/* Delete */}
            <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default NotificationCard;
